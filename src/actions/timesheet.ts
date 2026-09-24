"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  addDays,
  resolveWeekStart,
  toHoursNumber,
  toISODate,
} from "@/lib/timesheet";
import type {
  AllocatedTimesheetProject,
  TimeEntry,
  TimeEntryKind,
} from "@/types/database";

export type TimesheetWeekData = {
  weekStart: string;
  weekEnd: string;
  projects: AllocatedTimesheetProject[];
  entries: TimeEntry[];
  setupRequired: boolean;
  error: string | null;
};

function isMissingTable(message: string | undefined) {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("time_entries") &&
    (lower.includes("schema cache") ||
      lower.includes("does not exist") ||
      lower.includes("could not find"))
  );
}

async function getAllocatedProjects(
  workspaceId: string,
  userId: string
): Promise<{
  projects: AllocatedTimesheetProject[];
  error: string | null;
}> {
  const supabase = await createClient();

  const [{ data: projectRows, error: projectError }, { data: teamRows }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id, name, team_id, workspace_id")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true }),
      supabase
        .from("teams")
        .select(
          `
          id,
          name,
          team_members ( user_id )
        `
        )
        .eq("workspace_id", workspaceId),
    ]);

  if (projectError) {
    return { projects: [], error: projectError.message };
  }

  const membership = new Map<string, { name: string; memberIds: string[] }>();
  for (const team of teamRows ?? []) {
    const row = team as {
      id: string;
      name: string;
      team_members?: Array<{ user_id: string } | null> | null;
    };
    membership.set(row.id, {
      name: row.name,
      memberIds: (row.team_members ?? [])
        .map((member) => member?.user_id)
        .filter(Boolean) as string[],
    });
  }

  // Só projetos com equipe vinculada e em que o usuário é membro da equipe
  const projects: AllocatedTimesheetProject[] = [];
  for (const project of projectRows ?? []) {
    if (!project.team_id) continue;
    const team = membership.get(project.team_id);
    if (!team?.memberIds.includes(userId)) continue;
    projects.push({
      id: project.id,
      name: project.name,
      team_id: project.team_id,
      workspace_id: project.workspace_id,
      teamName: team.name,
    });
  }

  return { projects, error: null };
}

export async function getTimesheetWeek(
  workspaceId: string,
  weekParam?: string | null
): Promise<TimesheetWeekData> {
  const weekStart = resolveWeekStart(weekParam);
  const weekEnd = addDays(weekStart, 6);
  const weekStartIso = toISODate(weekStart);
  const weekEndIso = toISODate(weekEnd);

  const empty: TimesheetWeekData = {
    weekStart: weekStartIso,
    weekEnd: weekEndIso,
    projects: [],
    entries: [],
    setupRequired: false,
    error: null,
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ...empty, error: "Não autenticado." };
  }

  const allocated = await getAllocatedProjects(workspaceId, user.id);
  if (allocated.error) {
    return { ...empty, error: allocated.error };
  }

  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .gte("entry_date", weekStartIso)
    .lte("entry_date", weekEndIso)
    .order("entry_date", { ascending: true });

  if (error) {
    if (isMissingTable(error.message)) {
      return { ...empty, projects: allocated.projects, setupRequired: true };
    }
    return { ...empty, projects: allocated.projects, error: error.message };
  }

  const entries = (data ?? []).map((entry) => ({
    ...entry,
    hours: toHoursNumber(entry.hours),
  }));

  return {
    weekStart: weekStartIso,
    weekEnd: weekEndIso,
    projects: allocated.projects,
    entries,
    setupRequired: false,
    error: null,
  };
}

export async function saveTimeEntry(input: {
  workspaceId: string;
  projectId?: string | null;
  kind: TimeEntryKind;
  entryDate: string;
  hours: number;
  notes?: string | null;
}) {
  if (input.hours <= 0 || input.hours > 24) {
    return { error: "Informe um valor entre 0,01 e 24 horas.", entry: null };
  }

  if (input.kind === "project" && !input.projectId) {
    return { error: "Selecione um projeto.", entry: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autenticado.", entry: null };
  }

  let query = supabase
    .from("time_entries")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("user_id", user.id)
    .eq("kind", input.kind)
    .eq("entry_date", input.entryDate);

  query =
    input.kind === "project" && input.projectId
      ? query.eq("project_id", input.projectId)
      : query.is("project_id", null);

  const { data: existing, error: existingError } = await query.maybeSingle();

  if (existingError && !isMissingTable(existingError.message)) {
    return { error: existingError.message, entry: null };
  }

  if (existingError && isMissingTable(existingError.message)) {
    return {
      error: "Execute supabase/timesheet.sql no SQL Editor do Supabase.",
      entry: null,
    };
  }

  const notes = input.notes?.trim() || null;
  const payload = {
    workspace_id: input.workspaceId,
    project_id: input.kind === "project" ? input.projectId : null,
    user_id: user.id,
    kind: input.kind,
    entry_date: input.entryDate,
    hours: input.hours,
    notes,
  };

  const { data, error } = existing
    ? await supabase
        .from("time_entries")
        .update({ hours: input.hours, notes })
        .eq("id", existing.id)
        .select("*")
        .single()
    : await supabase.from("time_entries").insert(payload).select("*").single();

  if (error || !data) {
    return {
      error: error?.message ?? "Não foi possível salvar o lançamento.",
      entry: null,
    };
  }

  revalidatePath("/dashboard/timesheet");
  return {
    error: null,
    entry: { ...data, hours: toHoursNumber(data.hours) } as TimeEntry,
  };
}

export async function deleteTimeEntry(entryId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autenticado." };
  }

  const { error } = await supabase
    .from("time_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/timesheet");
  return { error: null };
}
