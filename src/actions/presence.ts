"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PRESENCE_STATUSES } from "@/lib/presence";
import type { PresenceStatus } from "@/types/database";

function isMissingPresenceColumn(message: string | undefined) {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("presence_status") &&
    (lower.includes("schema cache") ||
      lower.includes("does not exist") ||
      lower.includes("could not find"))
  );
}

export async function setPresenceStatus(status: PresenceStatus) {
  if (!PRESENCE_STATUSES.includes(status)) {
    return { error: "Status inválido.", status: null as PresenceStatus | null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autenticado.", status: null };
  }

  const { error } = await supabase
    .from("users")
    .update({ presence_status: status })
    .eq("id", user.id);

  if (error) {
    if (isMissingPresenceColumn(error.message)) {
      return {
        error: "Execute supabase/presence.sql no SQL Editor do Supabase.",
        status: null,
      };
    }
    return { error: error.message, status: null };
  }

  revalidatePath("/dashboard", "layout");
  return { error: null, status };
}
