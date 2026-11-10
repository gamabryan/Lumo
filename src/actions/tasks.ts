"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  TaskPriority,
  TaskStatus,
  TaskWithAssignee,
} from "@/types/database";

const TASK_SELECT = `
  id,
  project_id,
  title,
  description,
  assignee_id,
  status,
  priority,
  created_at,
  assignee:users!tasks_assignee_id_fkey ( id, name, avatar_url, presence_status )
`;

export async function createTask(input: {
  projectId: string;
  title: string;
  description?: string | null;
  assigneeId: string | null;
  priority: TaskPriority;
}) {
  const title = input.title.trim();
  if (!title) {
    return { error: "Informe o título da tarefa.", task: null };
  }

  const description = input.description?.trim() || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autenticado.", task: null };
  }

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      project_id: input.projectId,
      title,
      description,
      assignee_id: input.assigneeId,
      priority: input.priority,
      status: "todo",
    })
    .select(TASK_SELECT)
    .single();

  if (error || !task) {
    return {
      error: error?.message ?? "Erro ao criar tarefa.",
      task: null,
    };
  }

  revalidatePath(`/dashboard/projects/${input.projectId}`);
  return { error: null, task: task as unknown as TaskWithAssignee };
}

export async function updateTaskStatus(
  taskId: string,
  projectId: string,
  status: TaskStatus
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autenticado." };
  }

  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId)
    .eq("project_id", projectId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { error: null };
}

export async function updateTaskAssignee(
  taskId: string,
  projectId: string,
  assigneeId: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autenticado.", task: null };
  }

  const { data: task, error } = await supabase
    .from("tasks")
    .update({ assignee_id: assigneeId })
    .eq("id", taskId)
    .eq("project_id", projectId)
    .select(TASK_SELECT)
    .single();

  if (error || !task) {
    return {
      error: error?.message ?? "Erro ao atualizar responsável.",
      task: null,
    };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { error: null, task: task as unknown as TaskWithAssignee };
}

export async function updateTaskDescription(
  taskId: string,
  projectId: string,
  description: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autenticado.", task: null };
  }

  const trimmed = description?.trim() || null;

  const { data: task, error } = await supabase
    .from("tasks")
    .update({ description: trimmed })
    .eq("id", taskId)
    .eq("project_id", projectId)
    .select(TASK_SELECT)
    .single();

  if (error || !task) {
    return {
      error: error?.message ?? "Erro ao atualizar descrição.",
      task: null,
    };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { error: null, task: task as unknown as TaskWithAssignee };
}
