import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWorkspaceMembers } from "@/actions/members";
import { getWorkspaceTeams } from "@/actions/teams";
import { ProjectWorkspace } from "@/components/projects/project-workspace";
import { createClient } from "@/lib/supabase/server";
import type {
  MessageWithSender,
  ProjectFile,
  TaskWithAssignee,
} from "@/types/database";

type ProjectPageProps = {
  params: Promise<{ projectId: string }>;
};

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", projectId)
    .single();

  return {
    title: project?.name ?? "Projeto",
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, workspace_id, team_id")
    .eq("id", projectId)
    .maybeSingle();

  // Fallback if teams.sql ainda não foi aplicado (coluna team_id ausente)
  const projectRow =
    project ??
    (
      await supabase
        .from("projects")
        .select("id, name, workspace_id")
        .eq("id", projectId)
        .maybeSingle()
    ).data;

  if (!projectRow || !user) {
    notFound();
  }

  const projectTeamId =
    "team_id" in projectRow
      ? ((projectRow as { team_id: string | null }).team_id ?? null)
      : null;

  const [
    { data: tasks },
    { data: messages },
    { data: profile },
    membersResult,
    teamsResult,
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select(
        `
        id,
        project_id,
        title,
        description,
        assignee_id,
        status,
        priority,
        created_at,
        assignee:users!tasks_assignee_id_fkey ( id, name, avatar_url, presence_status )
      `
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase
      .from("messages")
      .select(
        `
        id,
        project_id,
        sender_id,
        content,
        priority_tag,
        created_at,
        sender:users!messages_sender_id_fkey ( id, name, avatar_url, presence_status ),
        files ( id, file_url, name, task_id, message_id, uploaded_by, created_at )
      `
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: true })
      .limit(100),
    supabase
      .from("users")
      .select("id, name, avatar_url, focus_mode_until")
      .eq("id", user.id)
      .single(),
    getWorkspaceMembers(projectRow.workspace_id),
    getWorkspaceTeams(projectRow.workspace_id),
  ]);

  const workspaceMembers = membersResult.members.map((member) => ({
    id: member.id,
    name: member.name,
    avatar_url: member.avatar_url,
    presence_status: member.presence_status,
  }));

  if (!workspaceMembers.length && profile) {
    workspaceMembers.push({
      id: profile.id,
      name: profile.name,
      avatar_url: profile.avatar_url,
      presence_status: "available" as const,
    });
  }

  const assignedTeam = teamsResult.teams.find(
    (team) => team.id === projectTeamId
  );

  const assigneeOptions = assignedTeam?.members.length
    ? assignedTeam.members.map((member) => ({
        id: member.id,
        name: member.name,
        avatar_url: member.avatar_url,
        presence_status: member.presence_status,
      }))
    : workspaceMembers;

  const initialMessages = (messages ?? []).map((message) => {
    const row = message as unknown as MessageWithSender & {
      files?: ProjectFile[] | null;
    };
    return {
      ...row,
      files: row.files ?? [],
    };
  });

  return (
    <ProjectWorkspace
      projectId={projectRow.id}
      projectName={projectRow.name}
      currentUserId={user.id}
      members={assigneeOptions}
      workspaceMembers={workspaceMembers}
      teams={teamsResult.teams}
      initialTeamId={projectTeamId}
      initialTasks={(tasks ?? []) as unknown as TaskWithAssignee[]}
      initialMessages={initialMessages}
      focusModeUntil={profile?.focus_mode_until ?? null}
    />
  );
}
