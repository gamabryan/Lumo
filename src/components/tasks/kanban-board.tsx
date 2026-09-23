"use client";

import { useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { updateTaskStatus } from "@/actions/tasks";
import { KanbanColumn } from "@/components/tasks/kanban-column";
import { PriorityBadge } from "@/components/tasks/priority-badge";
import { TASK_COLUMNS } from "@/lib/tasks";
import type { TaskStatus, TaskWithAssignee } from "@/types/database";

type KanbanBoardProps = {
  projectId: string;
  tasks: TaskWithAssignee[];
  onTasksChange: (tasks: TaskWithAssignee[]) => void;
  onOpenTask: (task: TaskWithAssignee) => void;
};

function isColumnId(id: string | number): id is TaskStatus {
  return TASK_COLUMNS.some((column) => column.status === id);
}

function resolveStatus(
  overId: string,
  tasks: TaskWithAssignee[]
): TaskStatus | null {
  if (isColumnId(overId)) return overId;
  return tasks.find((task) => task.id === overId)?.status ?? null;
}

export function KanbanBoard({
  projectId,
  tasks,
  onTasksChange,
  onOpenTask,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<TaskWithAssignee | null>(null);
  const originStatus = useRef<TaskStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const columns = useMemo(
    () =>
      TASK_COLUMNS.map((column) => ({
        ...column,
        tasks: tasks.filter((task) => task.status === column.status),
      })),
    [tasks]
  );

  async function moveTask(taskId: string, status: TaskStatus) {
    const previous = tasks;
    const task = previous.find((item) => item.id === taskId);
    if (!task || task.status === status) return;

    onTasksChange(
      previous.map((item) =>
        item.id === taskId ? { ...item, status } : item
      )
    );

    const result = await updateTaskStatus(taskId, projectId, status);
    if (result.error) {
      onTasksChange(previous);
      toast.error(result.error);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((item) => item.id === event.active.id);
    originStatus.current = task?.status ?? null;
    setActiveTask(task ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const nextStatus = resolveStatus(String(over.id), tasks);
    const activeItem = tasks.find((task) => task.id === activeId);

    if (!nextStatus || !activeItem || activeItem.status === nextStatus) return;

    onTasksChange(
      tasks.map((task) =>
        task.id === activeId ? { ...task, status: nextStatus } : task
      )
    );
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const activeId = String(active.id);
    const startedAs = originStatus.current;
    originStatus.current = null;
    setActiveTask(null);

    if (!over || !startedAs) {
      if (startedAs) {
        onTasksChange(
          tasks.map((task) =>
            task.id === activeId ? { ...task, status: startedAs } : task
          )
        );
      }
      return;
    }

    const nextStatus =
      resolveStatus(String(over.id), tasks) ??
      tasks.find((task) => task.id === activeId)?.status;

    if (!nextStatus) return;

    onTasksChange(
      tasks.map((task) =>
        task.id === activeId ? { ...task, status: nextStatus } : task
      )
    );

    if (nextStatus === startedAs) return;

    const result = await updateTaskStatus(activeId, projectId, nextStatus);
    if (result.error) {
      onTasksChange(
        tasks.map((task) =>
          task.id === activeId ? { ...task, status: startedAs } : task
        )
      );
      toast.error(result.error);
    }
  }

  function handleDragCancel() {
    const activeId = activeTask?.id;
    const startedAs = originStatus.current;
    originStatus.current = null;
    setActiveTask(null);

    if (activeId && startedAs) {
      onTasksChange(
        tasks.map((task) =>
          task.id === activeId ? { ...task, status: startedAs } : task
        )
      );
    }
  }

  return (
    <div className="h-full overflow-auto px-5 py-5 md:px-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="animate-fade-up flex min-w-[48rem] gap-3.5">
          {columns.map((column) => (
            <KanbanColumn
              key={column.status}
              status={column.status}
              label={column.label}
              tasks={column.tasks}
              onMove={moveTask}
              onOpenTask={onOpenTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="w-72 rounded-lg border border-border/60 bg-background p-3 shadow-lg">
              <p className="text-sm font-medium">{activeTask.title}</p>
              <div className="mt-2">
                <PriorityBadge priority={activeTask.priority} />
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
