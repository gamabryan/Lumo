"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { createTeam, deleteTeam } from "@/actions/teams";
import { UserStatusAvatar } from "@/components/presence/user-status-avatar";
import { Badge } from "@/components/ui/badge";
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
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type {
  TeamWithMembers,
  WorkspaceMemberProfile,
} from "@/types/database";

type TeamsDialogProps = {
  workspaceId: string;
  workspaceName: string;
  workspaceMembers: WorkspaceMemberProfile[];
  initialTeams: TeamWithMembers[];
  canManage: boolean;
  onTeamsChange?: (teams: TeamWithMembers[]) => void;
};

export function TeamsDialog({
  workspaceId,
  workspaceName,
  workspaceMembers,
  initialTeams,
  canManage,
  onTeamsChange,
}: TeamsDialogProps) {
  const [open, setOpen] = useState(false);
  const [teams, setTeams] = useState(initialTeams);
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTeams(initialTeams);
  }, [initialTeams]);

  function toggleMember(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const result = await createTeam({
      workspaceId,
      name,
      memberIds: selectedIds,
    });
    setLoading(false);

    if (result.error || !result.team) {
      toast.error(result.error ?? "Erro ao criar equipe.");
      return;
    }

    const next = [...teams, result.team];
    setTeams(next);
    onTeamsChange?.(next);
    setName("");
    setSelectedIds([]);
    toast.success("Equipe criada.");
  }

  async function handleDelete(teamId: string) {
    const result = await deleteTeam(teamId, workspaceId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    const next = teams.filter((team) => team.id !== teamId);
    setTeams(next);
    onTeamsChange?.(next);
    toast.success("Equipe removida.");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-start gap-1.5 px-2 text-muted-foreground"
          />
        }
      >
        <UsersRound className="size-3.5" />
        Equipes
        <Badge variant="secondary" className="ml-auto tabular-nums">
          {teams.length}
        </Badge>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Equipes</DialogTitle>
          <DialogDescription>
            Crie equipes em <span className="font-medium">{workspaceName}</span>{" "}
            e vincule-as aos projetos.
          </DialogDescription>
        </DialogHeader>

        <ul className="max-h-48 space-y-2 overflow-y-auto">
          {teams.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Nenhuma equipe ainda.
            </p>
          ) : (
            teams.map((team) => (
              <li
                key={team.id}
                className="rounded-lg border border-border/60 px-3 py-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{team.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {team.members.length}{" "}
                      {team.members.length === 1 ? "membro" : "membros"}
                    </p>
                  </div>
                  {canManage ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => void handleDelete(team.id)}
                      aria-label={`Excluir ${team.name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {team.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5"
                      title={member.email}
                    >
                      <UserStatusAvatar
                        userId={member.id}
                        name={member.name}
                        avatarUrl={member.avatar_url}
                        size="sm"
                        className="size-4"
                        fallbackClassName="text-[8px]"
                      />
                      <span className="max-w-20 truncate text-[11px]">
                        {member.name}
                      </span>
                    </div>
                  ))}
                </div>
              </li>
            ))
          )}
        </ul>

        {canManage ? (
          <form
            onSubmit={handleCreate}
            className="space-y-3 border-t border-border/60 pt-3"
          >
            <div className="space-y-2">
              <Label htmlFor="team-name">Nova equipe</Label>
              <Input
                id="team-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Design"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Membros</Label>
              <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-border/60 p-2">
                {workspaceMembers.map((member) => {
                  const selected = selectedIds.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleMember(member.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                        selected
                          ? "bg-muted font-medium"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <UserStatusAvatar
                        userId={member.id}
                        name={member.name}
                        avatarUrl={member.avatar_url}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {member.name}
                      </span>
                      {selected ? (
                        <Badge variant="secondary" className="text-[10px]">
                          OK
                        </Badge>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={loading} className="gap-1.5">
                {loading ? (
                  <Spinner className="text-primary-foreground" />
                ) : (
                  <Plus className="size-3.5" />
                )}
                Criar equipe
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <p className="text-xs text-muted-foreground">
            Apenas donos/admins podem criar equipes.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
