"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  MessagePriorityTag,
  MessageWithSender,
} from "@/types/database";

const MESSAGE_SELECT = `
  id,
  project_id,
  sender_id,
  content,
  priority_tag,
  created_at,
  sender:users!messages_sender_id_fkey ( id, name, avatar_url, presence_status )
`;

export async function sendMessage(input: {
  projectId: string;
  content: string;
  priorityTag: MessagePriorityTag;
  allowEmptyContent?: boolean;
}) {
  const content = input.content.trim();
  if (!content && !input.allowEmptyContent) {
    return { error: "Escreva uma mensagem.", message: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autenticado.", message: null };
  }

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      project_id: input.projectId,
      sender_id: user.id,
      content: content || "Arquivo anexado",
      priority_tag: input.priorityTag,
    })
    .select(MESSAGE_SELECT)
    .single();

  if (error || !message) {
    return {
      error: error?.message ?? "Erro ao enviar mensagem.",
      message: null,
    };
  }

  revalidatePath(`/dashboard/projects/${input.projectId}`);
  return {
    error: null,
    message: {
      ...(message as unknown as MessageWithSender),
      files: [] as MessageWithSender["files"],
    },
  };
}
