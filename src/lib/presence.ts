import type { PresenceStatus } from "@/types/database";

export const PRESENCE_STATUSES: PresenceStatus[] = [
  "available",
  "busy",
  "away",
  "offline",
];

export const PRESENCE_LABELS: Record<PresenceStatus, string> = {
  available: "Disponível",
  busy: "Ocupado",
  away: "Ausente",
  offline: "Offline",
};

/** Classes Tailwind da bolinha de status */
export const PRESENCE_DOT_CLASS: Record<PresenceStatus, string> = {
  available: "bg-emerald-500",
  busy: "bg-rose-500",
  away: "bg-amber-400",
  offline: "bg-zinc-400 dark:bg-zinc-500",
};

export function normalizePresenceStatus(
  value: string | null | undefined
): PresenceStatus {
  if (
    value === "available" ||
    value === "busy" ||
    value === "away" ||
    value === "offline"
  ) {
    return value;
  }
  return "available";
}
