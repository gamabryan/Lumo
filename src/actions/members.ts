"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizePresenceStatus } from "@/lib/presence";
import type { WorkspaceMemberProfile } from "@/types/database";

export async function getWorkspaceMembers(workspaceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { members: [] as WorkspaceMemberProfile[], error: "Não autenticado." };
  }

  const { data, error } = await supabase
    .from("workspace_members")
    .select(
      `
      role,
      user:users!workspace_members_user_id_fkey ( id, name, email, avatar_url, presence_status )
    `
    )
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) {
    return { members: [] as WorkspaceMemberProfile[], error: error.message };
  }

  const members: WorkspaceMemberProfile[] = (data ?? [])
    .map((row) => {
      const profile = row.user as unknown as {
        id: string;
        name: string;
        email: string;
        avatar_url: string | null;
        presence_status?: string | null;
      } | null;
      if (!profile) return null;
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        avatar_url: profile.avatar_url,
        presence_status: normalizePresenceStatus(profile.presence_status),
        role: row.role,
      };
    })
    .filter(Boolean) as WorkspaceMemberProfile[];

  return { members, error: null };
}

export async function addWorkspaceMemberByEmail(
  workspaceId: string,
  email: string
) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return { error: "Informe o email do membro.", member: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autenticado.", member: null };
  }

  const { data: targets, error: userError } = await supabase.rpc(
    "find_user_for_invite",
    { p_email: trimmed }
  );

  if (userError) {
    const hint =
      userError.message.includes("find_user_for_invite") ||
      userError.message.includes("schema cache")
        ? " Execute supabase/workspace_members.sql (ou fix-invite-rpc.sql) no SQL Editor do Supabase."
        : "";
    return { error: `${userError.message}${hint}`, member: null };
  }

  const target = Array.isArray(targets) ? targets[0] : targets;

  if (!target) {
    return {
      error:
        "Usuário não encontrado. A pessoa precisa ter uma conta no Lumo com esse email.",
      member: null,
    };
  }

  if (target.id === user.id) {
    return { error: "Você já faz parte deste workspace.", member: null };
  }

  const { data: membership, error } = await supabase
    .from("workspace_members")
    .insert({
      workspace_id: workspaceId,
      user_id: target.id,
      role: "member",
    })
    .select("role")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Este usuário já é membro do workspace.", member: null };
    }
    return { error: error.message, member: null };
  }

  revalidatePath("/dashboard", "layout");

  return {
    error: null,
    member: {
      id: target.id,
      name: target.name,
      email: target.email,
      avatar_url: target.avatar_url,
      presence_status: "available",
      role: membership.role,
    } satisfies WorkspaceMemberProfile,
  };
}

export async function removeWorkspaceMember(
  workspaceId: string,
  memberUserId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autenticado." };
  }

  if (memberUserId === user.id) {
    return { error: "Você não pode remover a si mesmo." };
  }

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", memberUserId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard", "layout");
  return { error: null };
}
