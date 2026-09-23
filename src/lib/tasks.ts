import type { TaskPriority, TaskStatus } from "@/types/database";

export const TASK_COLUMNS: {
  status: TaskStatus;
  label: string;
}[] = [
  { status: "todo", label: "A Fazer" },
  { status: "in_progress", label: "Em Andamento" },
  { status: "done", label: "Concluído" },
];

export const TASK_PRIORITIES: {
  value: TaskPriority;
  label: string;
}[] = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
];

export function isPendingStatus(status: TaskStatus) {
  return status !== "done";
}
