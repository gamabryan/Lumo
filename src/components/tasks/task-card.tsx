"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { PriorityBadge } from "@/components/tasks/priority-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TASK_COLUMNS } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import type { TaskStatus, TaskWithAssignee } from "@/types/database";

type TaskCardProps = {
  task: TaskWithAssignee;
  onMove: (taskId: string, status: TaskStatus) => void;
  onOpen: (task: TaskWithAssignee) => void;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function TaskCard({ task, onMove, onOpen }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const otherStatuses = TASK_COLUMNS.filter(
    (column) => column.status !== task.status
  );

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-xl border border-border/50 bg-card/90 p-3 shadow-[0_1px_2px_oklch(0.3_0.02_250/0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/20 hover:shadow-[0_8px_20px_-12px_oklch(0.4_0.06_195/0.35)]",
        isDragging &&
          "z-10 scale-[1.02] border-brand/30 opacity-95 shadow-[0_12px_28px_-10px_oklch(0.4_0.06_195/0.4)]"
      )}
    >
      <div className="flex items-start gap-1">
        <button
          type="button"
          className="mt-0.5 cursor-grab touch-none rounded-md p-0.5 text-muted-foreground opacity-40 transition-opacity hover:opacity-100 active:cursor-grabbing"
          aria-label="Arrastar tarefa"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </button>

        <div
          className="min-w-0 flex-1 cursor-pointer space-y-2.5"
          onClick={() => onOpen(task)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onOpen(task);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <p className="text-sm leading-snug font-medium text-foreground">
            {task.title}
          </p>

          <div className="flex items-center justify-between gap-2">
            <PriorityBadge priority={task.priority} />

            <div
              className="flex items-center gap-1.5"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              {task.assignee ? (
                <div title={task.assignee.name}>
                  <Avatar size="sm" className="ring-1 ring-border/60">
                    {task.assignee.avatar_url ? (
                      <AvatarImage
                        src={task.assignee.avatar_url}
                        alt={task.assignee.name}
                      />
                    ) : null}
                    <AvatarFallback className="bg-brand/10 text-[10px] text-brand">
                      {getInitials(task.assignee.name) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  Sem responsável
                </span>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="xs"
                      className="h-6 px-1.5 text-[11px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  }
                >
                  Mover
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {otherStatuses.map((column) => (
                    <DropdownMenuItem
                      key={column.status}
                      onClick={() => onMove(task.id, column.status)}
                    >
                      {column.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
