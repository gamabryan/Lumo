"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FolderKanban, Plus } from "lucide-react";
import { toast } from "sonner";
import { createProject } from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { Project, Workspace } from "@/types/database";

type ProjectListProps = {
  workspace: Workspace;
  projects: Project[];
};

export function ProjectList({
  workspace,
  projects: initialProjects,
}: ProjectListProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const storeProjects = useWorkspaceStore((s) => s.projects);
  const storeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const addProject = useWorkspaceStore((s) => s.addProject);

  const activeWorkspace = storeWorkspace ?? workspace;
  const projects = storeWorkspace ? storeProjects : initialProjects;

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const result = await createProject(activeWorkspace.id, name);
    setLoading(false);

    if (result.error || !result.project) {
      toast.error(result.error ?? "Erro ao criar projeto.");
      return;
    }

    addProject(result.project);
    setName("");
    setOpen(false);
    toast.success("Projeto criado.");
    router.push(`/dashboard/projects/${result.project.id}`);
    router.refresh();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex items-center justify-between px-2">
        <span className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          Projetos
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => setOpen(true)}
          aria-label="Criar novo projeto"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-1">
        <nav className="flex flex-col gap-0.5 pb-2">
          {projects.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted-foreground">
              Nenhum projeto ainda.
            </p>
          ) : (
            projects.map((project) => {
              const href = `/dashboard/projects/${project.id}`;
              const active = pathname === href;

              return (
                <Link
                  key={project.id}
                  href={href}
                  prefetch
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm transition-all duration-150",
                    active
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-sm ring-1 ring-brand/10"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  <FolderKanban className="size-3.5 shrink-0 opacity-70" />
                  <span className="truncate">{project.name}</span>
                </Link>
              );
            })
          )}
        </nav>
      </ScrollArea>

      <div className="px-1 pb-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-start gap-1.5 border-dashed"
          onClick={() => setOpen(true)}
        >
          <Plus className="size-3.5" />
          Criar Novo Projeto
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Novo projeto</DialogTitle>
              <DialogDescription>
                Adicione um projeto ao workspace {activeWorkspace.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="project-name">Nome</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Landing page"
                autoFocus
                required
              />
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
    </div>
  );
}
