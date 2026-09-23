"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function assertWorkspaceAccess(workspaceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      error: "Não autenticado.",
      membership: null,
    };
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("id, role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership) {
    return { supabase, user, error: null, membership };
  }

  // Compatibilidade: dono sem membership ainda
  const { data: owned } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!owned) {
    return {
      supabase,
      user,
      error: "Workspace não encontrado.",
      membership: null,
    };
  }

  await supabase.from("workspace_members").upsert(
    {
      workspace_id: workspaceId,
      user_id: user.id,
      role: "owner",
    },
    { onConflict: "workspace_id,user_id" }
  );

  return {
    supabase,
    user,
    error: null,
    membership: { id: "synced", role: "owner" as const },
  };
}

export async function setActiveWorkspace(workspaceId: string) {
  const access = await assertWorkspaceAccess(workspaceId);
  if (access.error || !access.user) {
    return { error: access.error ?? "Não autenticado." };
  }

  const cookieStore = await cookies();
  cookieStore.set("lumo_workspace_id", workspaceId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/dashboard", "layout");
  return { error: null };
}

export async function createWorkspace(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return { error: "Informe um nome para o workspace.", workspace: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autenticado.", workspace: null };
  }

  const { data: workspace, error } = await supabase
    .from("workspaces")
    .insert({ name: trimmed, owner_id: user.id })
    .select()
    .single();

  if (error || !workspace) {
    return {
      error: error?.message ?? "Erro ao criar workspace.",
      workspace: null,
    };
  }

  await supabase.from("workspace_members").upsert(
    {
      workspace_id: workspace.id,
      user_id: user.id,
      role: "owner",
    },
    { onConflict: "workspace_id,user_id" }
  );

  const cookieStore = await cookies();
  cookieStore.set("lumo_workspace_id", workspace.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/dashboard", "layout");
  return { error: null, workspace };
}

export async function renameWorkspace(workspaceId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return { error: "Informe um nome para o workspace.", workspace: null };
  }

  const access = await assertWorkspaceAccess(workspaceId);
  if (access.error || !access.user) {
    return {
      error: access.error ?? "Não autenticado.",
      workspace: null,
    };
  }

  const { data: workspace, error } = await access.supabase
    .from("workspaces")
    .update({ name: trimmed })
    .eq("id", workspaceId)
    .eq("owner_id", access.user.id)
    .select()
    .maybeSingle();

  if (error) {
    return { error: error.message, workspace: null };
  }

  if (!workspace) {
    return {
      error: "Apenas o dono pode renomear o workspace.",
      workspace: null,
    };
  }

  revalidatePath("/dashboard", "layout");
  return { error: null, workspace };
}

export async function createProject(workspaceId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return { error: "Informe um nome para o projeto.", project: null };
  }

  const access = await assertWorkspaceAccess(workspaceId);
  if (access.error || !access.user) {
    return {
      error: access.error ?? "Não autenticado.",
      project: null,
    };
  }

  const { data: project, error } = await access.supabase
    .from("projects")
    .insert({ name: trimmed, workspace_id: workspaceId })
    .select()
    .single();

  if (error || !project) {
    return {
      error: error?.message ?? "Erro ao criar projeto.",
      project: null,
    };
  }

  revalidatePath("/dashboard", "layout");
  return { error: null, project };
}
