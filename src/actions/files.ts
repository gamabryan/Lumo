"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ProjectFile } from "@/types/database";

export async function getTaskFiles(taskId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) {
    return { files: [] as ProjectFile[], error: error.message };
  }

  return { files: (data ?? []) as ProjectFile[], error: null };
}

export async function deleteProjectFile(
  fileId: string,
  projectId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autenticado." };
  }

  const { data: file } = await supabase
    .from("files")
    .select("*")
    .eq("id", fileId)
    .single();

  if (!file) {
    return { error: "Arquivo não encontrado." };
  }

  if (file.uploaded_by !== user.id) {
    return { error: "Você só pode remover seus próprios arquivos." };
  }

  const { error: storageError } = await supabase.storage
    .from("project-files")
    .remove([file.file_url]);

  if (storageError) {
    return { error: storageError.message };
  }

  const { error } = await supabase.from("files").delete().eq("id", fileId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { error: null };
}
