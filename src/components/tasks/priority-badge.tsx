import { Badge } from "@/components/ui/badge";
import { TASK_PRIORITIES } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/types/database";

const priorityStyles: Record<TaskPriority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-sky-50/90 text-sky-800 ring-1 ring-sky-200/70",
  high: "bg-amber-50/90 text-amber-900 ring-1 ring-amber-200/70",
  urgent: "bg-rose-50/90 text-rose-800 ring-1 ring-rose-200/70",
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const label =
    TASK_PRIORITIES.find((item) => item.value === priority)?.label ?? priority;

  return (
    <Badge
      variant="secondary"
      className={cn("rounded-md font-medium", priorityStyles[priority])}
    >
      {label}
    </Badge>
  );
}
