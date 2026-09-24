const WEEKDAY_SHORT = ["SEG.", "TER.", "QUA.", "QUI.", "SEX.", "SÁB.", "DOM."];

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function startOfWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = start.getDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  start.setDate(start.getDate() + offset);
  return start;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

export function getWeekDays(weekStart: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    return {
      date,
      iso: toISODate(date),
      weekdayLabel: WEEKDAY_SHORT[index],
      dayLabel: date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
    };
  });
}

export function resolveWeekStart(weekParam?: string | null): Date {
  const parsed = weekParam ? parseISODate(weekParam) : null;
  return startOfWeek(parsed ?? new Date());
}

export function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const startLabel = weekStart.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });
  const endLabel = weekEnd.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });
  return `${startLabel} – ${endLabel}`;
}

export function parseHoursInput(value: string): number | null {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;

  const hm = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (hm) {
    const hours = Number(hm[1]);
    const minutes = Number(hm[2]);
    if (minutes >= 60) return null;
    const total = hours + minutes / 60;
    return Number.isFinite(total) ? roundHours(total) : null;
  }

  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric)) return null;
  return roundHours(numeric);
}

export function roundHours(hours: number): number {
  return Math.round(hours * 100) / 100;
}

export function formatHoursCell(hours: number): string {
  return `${roundHours(hours).toFixed(2)}h`;
}

export function formatHoursTotal(hours: number): string {
  if (hours <= 0) return "—";
  const rounded = roundHours(hours);
  if (Number.isInteger(rounded)) return `${rounded}h`;
  return `${rounded.toFixed(2)}h`;
}

export function toHoursNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}
