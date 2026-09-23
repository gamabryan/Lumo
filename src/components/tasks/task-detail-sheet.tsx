"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getTaskFiles } from "@/actions/files";
import {
  updateTaskAssignee,
  updateTaskDescription,
} from "@/actions/tasks";
import { FileList } from "@/components/files/file-list";
import { FileUpload } from "@/components/files/file-upload";
import { PriorityBadge } from "@/components/tasks/priority-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { TASK_COLUMNS } from "@/lib/tasks";
import type {
  ProjectFile,
  TaskWithAssignee,
  User,
} from "@/types/database";

type Member = Pick<User, "id" | "name" | "avatar_url">;

type TaskDetailSheetProps = {
  task: TaskWithAssignee | null;
  projectId: string;
  currentUserId: string;
  members: Member[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdate?: (task: TaskWithAssignee) => void;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function TaskDetailSheet({
  task,
  projectId,
  currentUserId,
  members,
  open,
  onOpenChange,
  onTaskUpdate,
}: TaskDetailSheetProps) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingAssignee, setSavingAssignee] = useState(false);
  const [savingDescription, setSavingDescription] = useState(false);
  const [assigneeId, setAssigneeId] = useState("none");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setAssigneeId(task?.assignee_id ?? "none");
    setDescription(task?.description ?? "");
  }, [task]);

  useEffect(() => {
    if (!open || !task) {
      setFiles([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void getTaskFiles(task.id).then((result) => {
      if (cancelled) return;
      setFiles(result.files);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [open, task]);

  async function handleAssigneeChange(value: string | null) {
    if (!task || value == null) return;
    setAssigneeId(value);
    setSavingAssignee(true);

    const result = await updateTaskAssignee(
      task.id,
      projectId,
      value === "none" ? null : value
    );

    setSavingAssignee(false);

    if (result.error || !result.task) {
      setAssigneeId(task.assignee_id ?? "none");
      toast.error(result.error ?? "Erro ao atualizar responsável.");
      return;
    }

    onTaskUpdate?.(result.task);
    toast.success("Responsável atualizado.");
  }

  async function handleSaveDescription() {
    if (!task || savingDescription) return;

    const next = description.trim();
    const current = (task.description ?? "").trim();
    if (next === current) return;

    setSavingDescription(true);
    const result = await updateTaskDescription(
      task.id,
      projectId,
      next || null
    );
    setSavingDescription(false);

    if (result.error || !result.task) {
      toast.error(result.error ?? "Erro ao salvar descrição.");
      return;
    }

    onTaskUpdate?.(result.task);
    toast.success("Descrição salva.");
  }

  const statusLabel =
    TASK_COLUMNS.find((column) => column.status === task?.status)?.label ??
    task?.status;

  const descriptionDirty =
    description.trim() !== (task?.description ?? "").trim();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-l-border/50 bg-card/97 sm:max-w-md"
      >
        {task ? (
          <div className="flex h-full flex-col gap-6">
            <SheetHeader className="space-y-2">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-brand uppercase">
                Tarefa
              </p>
              <SheetTitle className="font-heading text-left text-xl leading-snug tracking-tight">
                {task.title}
              </SheetTitle>
              <SheetDescription className="text-left">
                Detalhes, responsável e arquivos da entrega.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className="rounded-lg bg-muted/80 font-medium"
                >
                  {statusLabel}
                </Badge>
                <PriorityBadge priority={task.priority} />
              </div>

              <div className="space-y-2">
                <Label>Atribuído a</Label>
                <Select
                  value={assigneeId}
                  onValueChange={handleAssigneeChange}
                  disabled={savingAssignee}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sem responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem responsável</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {task.assignee ? (
                <div className="flex items-center gap-2 text-sm">
                  <Avatar size="sm">
                    {task.assignee.avatar_url ? (
                      <AvatarImage
                        src={task.assignee.avatar_url}
                        alt={task.assignee.name}
                      />
                    ) : null}
                    <AvatarFallback>
                      {getInitials(task.assignee.name) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground">
                    Atual:{" "}
                    <span className="font-medium text-foreground">
                      {task.assignee.name}
                    </span>
                  </span>
                </div>
              ) : null}

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="task-detail-description">Descrição</Label>
                  {descriptionDirty ? (
                    <Button
                      type="button"
                      size="xs"
                      onClick={handleSaveDescription}
                      disabled={savingDescription}
                    >
                      {savingDescription ? (
                        <>
                          <Spinner className="size-3 text-primary-foreground" />
                          Salvando
                        </>
                      ) : (
                        "Salvar"
                      )}
                    </Button>
                  ) : null}
                </div>
                <Textarea
                  id="task-detail-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => {
                    if (descriptionDirty) void handleSaveDescription();
                  }}
                  placeholder="Adicione detalhes, contexto ou critérios de aceite…"
                  rows={4}
                  className="min-h-[96px] resize-y"
                  disabled={savingDescription}
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-3 border-t border-border/60 pt-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium tracking-tight">
                  Arquivos Anexados
                </h3>
                <FileUpload
                  context={{
                    type: "task",
                    taskId: task.id,
                    projectId,
                  }}
                  compact
                  label="Anexar"
                  onUploaded={(file) =>
                    setFiles((current) => [file, ...current])
                  }
                />
              </div>

              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <FileList
                  files={files}
                  projectId={projectId}
                  currentUserId={currentUserId}
                  onRemoved={(fileId) =>
                    setFiles((current) =>
                      current.filter((file) => file.id !== fileId)
                    )
                  }
                />
              )}
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
