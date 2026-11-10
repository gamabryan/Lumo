"use client";

import { useEffect, useState } from "react";
import { UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
import {
  addWorkspaceMemberByEmail,
  removeWorkspaceMember,
} from "@/actions/members";
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
import type { WorkspaceMemberProfile } from "@/types/database";

type WorkspaceMembersDialogProps = {
  workspaceId: string;
  workspaceName: string;
  initialMembers: WorkspaceMemberProfile[];
  currentUserId: string;
  canManage: boolean;
  onMembersChange?: (members: WorkspaceMemberProfile[]) => void;
};

const roleLabel: Record<string, string> = {
  owner: "Dono",
  admin: "Admin",
  member: "Membro",
};

export function WorkspaceMembersDialog({
  workspaceId,
  workspaceName,
  initialMembers,
  currentUserId,
  canManage,
  onMembersChange,
}: WorkspaceMembersDialogProps) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState(initialMembers);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const result = await addWorkspaceMemberByEmail(workspaceId, email);
    setLoading(false);

    if (result.error || !result.member) {
      toast.error(result.error ?? "Não foi possível adicionar.");
      return;
    }

    const next = [...members, result.member];
    setMembers(next);
    onMembersChange?.(next);
    setEmail("");
    toast.success(`${result.member.name} adicionado ao workspace.`);
  }

  async function handleRemove(memberId: string) {
    const result = await removeWorkspaceMember(workspaceId, memberId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    const next = members.filter((member) => member.id !== memberId);
    setMembers(next);
    onMembersChange?.(next);
    toast.success("Membro removido.");
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
        <Users className="size-3.5" />
        Membros
        <Badge variant="secondary" className="ml-auto tabular-nums">
          {members.length}
        </Badge>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Membros do workspace</DialogTitle>
          <DialogDescription>
            Equipe de <span className="font-medium">{workspaceName}</span>.
            Convide pelo email de uma conta já cadastrada no Lumo.
          </DialogDescription>
        </DialogHeader>

        <ul className="max-h-56 space-y-2 overflow-y-auto">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center gap-2 rounded-lg border border-border/60 px-2.5 py-2"
            >
              <UserStatusAvatar
                userId={member.id}
                name={member.name}
                avatarUrl={member.avatar_url}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {member.name}
                  {member.id === currentUserId ? " (você)" : ""}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {member.email}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {roleLabel[member.role] ?? member.role}
              </Badge>
              {canManage &&
              member.id !== currentUserId &&
              member.role !== "owner" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => void handleRemove(member.id)}
                  aria-label={`Remover ${member.name}`}
                >
                  <X className="size-3.5" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>

        {canManage ? (
          <form onSubmit={handleInvite} className="space-y-3 border-t border-border/60 pt-3">
            <div className="space-y-2">
              <Label htmlFor="member-email">Convidar por email</Label>
              <Input
                id="member-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colega@empresa.com"
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading} className="gap-1.5">
                {loading ? (
                  <Spinner className="text-primary-foreground" />
                ) : (
                  <UserPlus className="size-3.5" />
                )}
                Adicionar
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <p className="text-xs text-muted-foreground">
            Apenas donos/admins podem convidar membros.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
