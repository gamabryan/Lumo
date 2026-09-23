"use client";

import { useState, useTransition } from "react";
import { UsersRound } from "lucide-react";
import { toast } from "sonner";
import { assignTeamToProject } from "@/actions/teams";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { TeamWithMembers } from "@/types/database";

type ProjectTeamSelectProps = {
  projectId: string;
  teams: TeamWithMembers[];
  initialTeamId: string | null;
  onTeamChange?: (teamId: string | null) => void;
};

export function ProjectTeamSelect({
  projectId,
  teams,
  initialTeamId,
  onTeamChange,
}: ProjectTeamSelectProps) {
  const [teamId, setTeamId] = useState(initialTeamId ?? "none");
  const [pending, startTransition] = useTransition();

  function handleChange(value: string | null) {
    if (value == null) return;
    const previous = teamId;
    setTeamId(value);

    startTransition(async () => {
      const nextId = value === "none" ? null : value;
      const result = await assignTeamToProject(projectId, nextId);
      if (result.error) {
        setTeamId(previous);
        toast.error(result.error);
        return;
      }
      onTeamChange?.(nextId);
      toast.success(
        nextId ? "Equipe vinculada ao projeto." : "Equipe removida do projeto."
      );
    });
  }

  const selected = teams.find((team) => team.id === teamId);

  return (
    <div className="flex items-center gap-2">
      <UsersRound className="size-3.5 text-muted-foreground" />
      <Select value={teamId} onValueChange={handleChange} disabled={pending}>
        <SelectTrigger className="h-8 w-[11rem] rounded-xl border-border/60 bg-background/70 sm:w-52">
          <SelectValue placeholder="Equipe do projeto">
            {teamId === "none"
              ? "Sem equipe"
              : (selected?.name ?? "Equipe do projeto")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Sem equipe</SelectItem>
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              {team.name} ({team.members.length})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pending ? <Spinner className="size-3.5" /> : null}
      {selected ? (
        <span className="hidden text-xs text-muted-foreground md:inline">
          {selected.members.length} na equipe
        </span>
      ) : null}
    </div>
  );
}
