import { createClient } from "@/lib/supabase/client";
import {
  MAX_FILE_SIZE,
  STORAGE_BUCKET,
  buildStoragePath,
} from "@/lib/files";
import type { ProjectFile } from "@/types/database";

export type FileContext =
  | { type: "task"; taskId: string; projectId: string }
  | { type: "message"; messageId: string; projectId: string };

export async function uploadProjectFile(
  file: File,
  context: FileContext
): Promise<{ file: ProjectFile | null; error: string | null }> {
  if (file.size > MAX_FILE_SIZE) {
    return { file: null, error: "Arquivo maior que 10 MB." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { file: null, error: "Não autenticado." };
  }

  const path = buildStoragePath(context.projectId, user.id, file.name);

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    return { file: null, error: uploadError.message };
  }

  const payload = {
    file_url: path,
    name: file.name,
    uploaded_by: user.id,
    task_id: context.type === "task" ? context.taskId : null,
    message_id: context.type === "message" ? context.messageId : null,
  };

  const { data: record, error: insertError } = await supabase
    .from("files")
    .insert(payload)
    .select("*")
    .single();

  if (insertError || !record) {
    await supabase.storage.from(STORAGE_BUCKET).remove([path]);
    return {
      file: null,
      error: insertError?.message ?? "Erro ao registrar arquivo.",
    };
  }

  return { file: record as ProjectFile, error: null };
}

export async function getSignedFileUrl(path: string, expiresIn = 3600) {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    return { url: null, error: error?.message ?? "URL indisponível." };
  }

  return { url: data.signedUrl, error: null };
}
