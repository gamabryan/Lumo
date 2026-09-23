import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type {
  Project,
  TeamWithMembers,
  User,
  Workspace,
  WorkspaceMemberProfile,
} from "@/types/database";

export type AppShellData = {
  profile: Pick<User, "id" | "name" | "email" | "avatar_url">;
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  projects: Project[];
  members: WorkspaceMemberProfile[];
  teams: TeamWithMembers[];
};

async function ensureOwnerMembership(
  workspaceId: string,
  ownerId: string
) {
  const supabase = await createClient();
  await supabase.from("workspace_members").upsert(
    {
      workspace_id: workspaceId,
      user_id: ownerId,
      role: "owner",
    },
    { onConflict: "workspace_id,user_id" }
  );
}

export async function getAppShellData(): Promise<AppShellData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, email, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("workspace_id, workspaces(*)")
    .eq("user_id", user.id);

  let workspaces = (memberships ?? [])
    .map((row) => row.workspaces as unknown as Workspace | null)
    .filter(Boolean) as Workspace[];

  // Fallback for workspaces owned before memberships existed
  if (!workspaces.length) {
    const { data: owned } = await supabase
      .from("workspaces")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });

    workspaces = owned ?? [];

    for (const workspace of workspaces) {
      await ensureOwnerMembership(workspace.id, user.id);
    }
  }

  if (!workspaces.length) {
    const { data: created, error } = await supabase
      .from("workspaces")
      .insert({ name: "Meu Workspace", owner_id: user.id })
      .select()
      .single();

    if (error || !created) {
      throw new Error(error?.message ?? "Não foi possível criar o workspace.");
    }

    await ensureOwnerMembership(created.id, user.id);
    workspaces = [created];
  }

  workspaces.sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const cookieStore = await cookies();
  const preferredId = cookieStore.get("lumo_workspace_id")?.value;
  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === preferredId) ??
    workspaces[0];

  const [{ data: projects }, { data: memberRows }, { data: teamRows }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("workspace_members")
        .select(
          `
        role,
        user:users!workspace_members_user_id_fkey ( id, name, email, avatar_url )
      `
        )
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("teams")
        .select(
          `
        id,
        workspace_id,
        name,
        created_at,
        team_members (
          user:users!team_members_user_id_fkey ( id, name, email, avatar_url )
        )
      `
        )
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: true }),
    ]);

  const members: WorkspaceMemberProfile[] = (memberRows ?? [])
    .map((row) => {
      const member = row.user as unknown as {
        id: string;
        name: string;
        email: string;
        avatar_url: string | null;
      } | null;
      if (!member) return null;
      return {
        id: member.id,
        name: member.name,
        email: member.email,
        avatar_url: member.avatar_url,
        role: row.role,
      };
    })
    .filter(Boolean) as WorkspaceMemberProfile[];

  const teams: TeamWithMembers[] = (teamRows ?? []).map((row) => {
    const team = row as unknown as {
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
        } | null;
      }>;
    };
    return {
      id: team.id,
      workspace_id: team.workspace_id,
      name: team.name,
      created_at: team.created_at,
      members: (team.team_members ?? [])
        .map((tm) => tm.user)
        .filter(Boolean) as TeamWithMembers["members"],
    };
  });

  return {
    profile,
    workspaces,
    activeWorkspace,
    projects: projects ?? [],
    members,
    teams,
  };
}
