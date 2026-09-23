"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createTask } from "@/actions/tasks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { TASK_PRIORITIES } from "@/lib/tasks";
import type { TaskPriority, TaskWithAssignee, User } from "@/types/database";

type Member = Pick<User, "id" | "name" | "avatar_url">;

type CreateTaskDialogProps = {
  projectId: string;
  members: Member[];
  onCreated: (task: TaskWithAssignee) => void;
};

export function CreateTaskDialog({
  projectId,
  members,
  onCreated,
}: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("none");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [loading, setLoading] = useState(false);

  function reset() {
    setTitle("");
    setDescription("");
    setAssigneeId("none");
    setPriority("medium");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    const result = await createTask({
      projectId,
      title,
      description,
      assigneeId: assigneeId === "none" ? null : assigneeId,
      priority,
    });

    setLoading(false);

    if (result.error || !result.task) {
      toast.error(result.error ?? "Erro ao criar tarefa.");
      return;
    }

    onCreated(result.task);
    reset();
    setOpen(false);
    toast.success("Tarefa criada.");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button
            size="sm"
            className="gap-1.5 shadow-[0_4px_14px_-6px_oklch(0.45_0.1_195/0.5)]"
          />
        }
      >
        <Plus className="size-3.5" />
        Nova tarefa
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Criar tarefa</DialogTitle>
            <DialogDescription>
              Título, descrição, atribuição e prioridade.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="task-title">Título</Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="O que precisa ser feito?"
                autoFocus
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Descrição</Label>
              <Textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes, contexto ou critérios de aceite (opcional)"
                rows={3}
                className="min-h-[72px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Atribuído a</Label>
              <Select
                value={assigneeId}
                onValueChange={(value) => {
                  if (value != null) setAssigneeId(value);
                }}
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

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={priority}
                onValueChange={(value) => {
                  if (value) setPriority(value as TaskPriority);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="text-primary-foreground" />
                  Criando...
                </>
              ) : (
                "Criar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
