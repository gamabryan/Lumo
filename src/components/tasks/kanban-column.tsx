"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskCard } from "@/components/tasks/task-card";
import { cn } from "@/lib/utils";
import type { TaskStatus, TaskWithAssignee } from "@/types/database";

type KanbanColumnProps = {
  status: TaskStatus;
  label: string;
  tasks: TaskWithAssignee[];
  onMove: (taskId: string, status: TaskStatus) => void;
  onOpenTask: (task: TaskWithAssignee) => void;
};

const columnAccent: Record<TaskStatus, string> = {
  todo: "from-stone-500/15 to-transparent",
  in_progress: "from-brand/20 to-transparent",
  done: "from-emerald-500/15 to-transparent",
};

export function KanbanColumn({
  status,
  label,
  tasks,
  onMove,
  onOpenTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: "column", status },
  });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-[28rem] flex-1 flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/55 shadow-[0_1px_0_oklch(1_0_0/0.5)_inset] backdrop-blur-sm transition-all duration-200 dark:shadow-[0_1px_0_oklch(1_0_0/0.06)_inset]",
        isOver && "border-brand/35 bg-brand/[0.04] shadow-[0_0_0_1px_oklch(0.55_0.08_195/0.2)]"
      )}
    >
      <header
        className={cn(
          "flex items-center justify-between gap-2 border-b border-border/40 bg-gradient-to-r px-3.5 py-3",
          columnAccent[status]
        )}
      >
        <h2 className="font-heading text-sm font-semibold tracking-tight text-foreground">
          {label}
        </h2>
        <span className="rounded-lg bg-background/80 px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground ring-1 ring-border/50">
          {tasks.length}
        </span>
      </header>

      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-2.5 px-2.5 py-3">
          {tasks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/60 px-2 py-8 text-center text-xs text-muted-foreground">
              Arraste tarefas para cá
            </p>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onMove={onMove}
                onOpen={onOpenTask}
              />
            ))
          )}
        </div>
      </SortableContext>
    </section>
  );
}
