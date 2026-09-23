"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  createWorkspace,
  renameWorkspace,
  setActiveWorkspace,
} from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { Workspace } from "@/types/database";

type WorkspaceSwitcherProps = {
  workspaces: Workspace[];
  activeWorkspace: Workspace;
};

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspace,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [name, setName] = useState("");
  const [renameName, setRenameName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const storeActive = useWorkspaceStore((s) => s.activeWorkspace);
  const storeWorkspaces = useWorkspaceStore((s) => s.workspaces);
  const addWorkspace = useWorkspaceStore((s) => s.addWorkspace);
  const updateWorkspace = useWorkspaceStore((s) => s.updateWorkspace);

  const current = storeActive ?? activeWorkspace;
  const list = storeWorkspaces.length ? storeWorkspaces : workspaces;

  function handleSelect(workspace: Workspace) {
    if (workspace.id === current.id) return;

    startTransition(async () => {
      const result = await setActiveWorkspace(workspace.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      useWorkspaceStore.setState({
        activeWorkspace: workspace,
        projects: [],
      });
      router.push("/dashboard");
      router.refresh();
    });
  }

  function openRename() {
    setRenameName(current.name);
    setRenameOpen(true);
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    const result = await createWorkspace(name);
    if (result.error || !result.workspace) {
      toast.error(result.error ?? "Erro ao criar workspace.");
      return;
    }

    addWorkspace(result.workspace);
    setName("");
    setCreateOpen(false);
    toast.success("Workspace criado.");
    router.push("/dashboard");
    router.refresh();
  }

  async function handleRename(event: React.FormEvent) {
    event.preventDefault();
    if (renaming) return;

    const trimmed = renameName.trim();
    if (!trimmed) {
      toast.error("Informe um nome para o workspace.");
      return;
    }

    if (trimmed === current.name) {
      setRenameOpen(false);
      return;
    }

    setRenaming(true);
    const result = await renameWorkspace(current.id, trimmed);
    setRenaming(false);

    if (result.error || !result.workspace) {
      toast.error(result.error ?? "Erro ao renomear workspace.");
      return;
    }

    updateWorkspace(result.workspace);
    setRenameOpen(false);
    toast.success("Workspace renomeado.");
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className="h-auto w-full justify-between gap-2 px-2 py-2 text-left font-normal"
              disabled={pending}
            />
          }
        >
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {current.name}
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            {list.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => handleSelect(workspace)}
              >
                <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                {workspace.id === current.id ? (
                  <Check className="size-3.5 text-foreground" />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={openRename}>
            <Pencil className="size-3.5" />
            Renomear workspace
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            Novo workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Novo workspace</DialogTitle>
              <DialogDescription>
                Crie um espaço para organizar projetos da sua microequipe.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="workspace-name">Nome</Label>
              <Input
                id="workspace-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Produto"
                autoFocus
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Criar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <form onSubmit={handleRename}>
            <DialogHeader>
              <DialogTitle>Renomear workspace</DialogTitle>
              <DialogDescription>
                Altere o nome de{" "}
                <span className="font-medium text-foreground">
                  {current.name}
                </span>
                .
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="workspace-rename">Nome</Label>
              <Input
                id="workspace-rename"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                placeholder="Nome do workspace"
                autoFocus
                required
                maxLength={80}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameOpen(false)}
                disabled={renaming}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={renaming}>
                {renaming ? (
                  <>
                    <Spinner className="text-primary-foreground" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
