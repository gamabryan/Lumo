"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizePresenceStatus } from "@/lib/presence";
import type {
  TeamMemberProfile,
  TeamWithMembers,
} from "@/types/database";

function mapTeamRows(
  rows: Array<{
    id: string;
    workspace_id: string;
    name: string;
    created_at: string;
    team_members?: Array<{
      user: {
        id: string;
        name: string;
        email: string;
        avatar_url: string | null;
        presence_status?: string | null;
      } | null;
    }> | null;
  }>
): TeamWithMembers[] {
  return rows.map((row) => ({
    id: row.id,
    workspace_id: row.workspace_id,
    name: row.name,
    created_at: row.created_at,
    members: (row.team_members ?? [])
      .map((tm) => {
        if (!tm.user) return null;
        return {
          ...tm.user,
          presence_status: normalizePresenceStatus(tm.user.presence_status),
        };
      })
      .filter(Boolean) as TeamMemberProfile[],
  }));
}

export async function getWorkspaceTeams(workspaceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { teams: [] as TeamWithMembers[], error: "Não autenticado." };
  }

  const { data, error } = await supabase
    .from("teams")
    .select(
      `
      id,
      workspace_id,
      name,
      created_at,
      team_members (
        user:users!team_members_user_id_fkey ( id, name, email, avatar_url, presence_status )
      )
    `
    )
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) {
    return { teams: [] as TeamWithMembers[], error: error.message };
  }

  return {
    teams: mapTeamRows(
      (data ?? []) as unknown as Parameters<typeof mapTeamRows>[0]
    ),
    error: null,
  };
}

export async function createTeam(input: {
  workspaceId: string;
  name: string;
  memberIds: string[];
}) {
  const name = input.name.trim();
  if (!name) {
    return { error: "Informe o nome da equipe.", team: null };
  }

  if (!input.memberIds.length) {
    return { error: "Selecione ao menos um membro.", team: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autenticado.", team: null };
  }

  const { data: team, error } = await supabase
    .from("teams")
    .insert({
      workspace_id: input.workspaceId,
      name,
    })
    .select("id, workspace_id, name, created_at")
    .single();

  if (error || !team) {
    return {
      error: error?.message ?? "Erro ao criar equipe.",
      team: null,
    };
  }

  const uniqueIds = [...new Set(input.memberIds)];
  const { error: membersError } = await supabase.from("team_members").insert(
    uniqueIds.map((userId) => ({
      team_id: team.id,
      user_id: userId,
    }))
  );

  if (membersError) {
    await supabase.from("teams").delete().eq("id", team.id);
    return { error: membersError.message, team: null };
  }

  const result = await getWorkspaceTeams(input.workspaceId);
  const created = result.teams.find((item) => item.id === team.id) ?? {
    ...team,
    members: [],
  };

  revalidatePath("/dashboard", "layout");
  return { error: null, team: created };
}

export async function deleteTeam(teamId: string, workspaceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autenticado." };
  }

  const { error } = await supabase
    .from("teams")
    .delete()
    .eq("id", teamId)
    .eq("workspace_id", workspaceId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard", "layout");
  return { error: null };
}

export async function assignTeamToProject(
  projectId: string,
  teamId: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autenticado.", project: null };
  }

  const { data: project, error } = await supabase
    .from("projects")
    .update({ team_id: teamId })
    .eq("id", projectId)
    .select("id, name, workspace_id, team_id, created_at")
    .single();

  if (error || !project) {
    return {
      error: error?.message ?? "Erro ao vincular equipe.",
      project: null,
    };
  }

  revalidatePath("/dashboard", "layout");
  revalidatePath(`/dashboard/projects/${projectId}`);
  return { error: null, project };
}
