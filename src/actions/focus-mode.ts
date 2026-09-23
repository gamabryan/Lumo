"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FocusDuration = "1h" | "2h" | "until_off" | "off";

function resolveFocusUntil(duration: FocusDuration): string | null {
  if (duration === "off") return null;

  if (duration === "until_off") {
    return new Date("2099-12-31T23:59:59.000Z").toISOString();
  }

  const hours = duration === "1h" ? 1 : 2;
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export async function setFocusMode(duration: FocusDuration) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autenticado.", focusModeUntil: null };
  }

  const focusModeUntil = resolveFocusUntil(duration);

  const { error } = await supabase
    .from("users")
    .update({ focus_mode_until: focusModeUntil })
    .eq("id", user.id);

  if (error) {
    return { error: error.message, focusModeUntil: null };
  }

  revalidatePath("/dashboard", "layout");
  return { error: null, focusModeUntil };
}
