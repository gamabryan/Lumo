"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { deleteTimeEntry, saveTimeEntry } from "@/actions/timesheet";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  addDays,
  formatHoursCell,
  formatHoursTotal,
  formatWeekRange,
  getWeekDays,
  parseHoursInput,
  parseISODate,
  toISODate,
} from "@/lib/timesheet";
import { cn } from "@/lib/utils";
import type {
  AllocatedTimesheetProject,
  TimeEntry,
  TimeEntryKind,
} from "@/types/database";

type TimesheetViewProps = {
  workspaceId: string;
  weekStart: string;
  projects: AllocatedTimesheetProject[];
  initialEntries: TimeEntry[];
  setupRequired: boolean;
};

type CellTarget = {
  kind: TimeEntryKind;
  projectId: string | null;
  projectName: string;
  entryDate: string;
  entry?: TimeEntry;
};

function entryKey(kind: TimeEntryKind, projectId: string | null, date: string) {
  return `${kind}:${projectId ?? "admin"}:${date}`;
}

function formatCellDate(iso: string) {
  const date = parseISODate(iso);
  if (!date) return iso;
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

export function TimesheetView({
  workspaceId,
  weekStart,
  projects,
  initialEntries,
  setupRequired,
}: TimesheetViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [entries, setEntries] = useState(initialEntries);
  const [target, setTarget] = useState<CellTarget | null>(null);

  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries, weekStart]);
  const [hoursInput, setHoursInput] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  const startDate = parseISODate(weekStart) ?? new Date();
  const days = useMemo(() => getWeekDays(startDate), [weekStart]);
  const todayIso = toISODate(new Date());

  const entryMap = useMemo(() => {
    const map = new Map<string, TimeEntry>();
    for (const entry of entries) {
      map.set(entryKey(entry.kind, entry.project_id, entry.entry_date), entry);
    }
    return map;
  }, [entries]);

  function goToWeek(nextStart: Date) {
    const params = new URLSearchParams();
    params.set("week", toISODate(nextStart));
    router.push(`${pathname}?${params.toString()}`);
  }

  function openCell(next: CellTarget) {
    setTarget(next);
    setHoursInput(
      next.entry ? String(next.entry.hours).replace(".", ",") : ""
    );
    setNotes(next.entry?.notes ?? "");
  }

  function closeDialog() {
    setTarget(null);
    setHoursInput("");
    setNotes("");
  }

  function upsertLocal(entry: TimeEntry) {
    setEntries((current) => {
      const key = entryKey(entry.kind, entry.project_id, entry.entry_date);
      const without = current.filter(
        (item) =>
          entryKey(item.kind, item.project_id, item.entry_date) !== key
      );
      return [...without, entry];
    });
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!target) return;

    const hours = parseHoursInput(hoursInput);
    if (hours === null || hours <= 0 || hours > 24) {
      toast.error("Informe um valor entre 0,01 e 24 horas (ex.: 6, 6,5 ou 6:30).");
      return;
    }

    startTransition(async () => {
      const result = await saveTimeEntry({
        workspaceId,
        projectId: target.projectId,
        kind: target.kind,
        entryDate: target.entryDate,
        hours,
        notes,
      });

      if (result.error || !result.entry) {
        toast.error(result.error ?? "Erro ao salvar horas.");
        return;
      }

      upsertLocal(result.entry);
      closeDialog();
      toast.success("Horas lançadas.");
      router.refresh();
    });
  }

  function handleDelete() {
    if (!target?.entry) return;

    startTransition(async () => {
      const result = await deleteTimeEntry(target.entry!.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      setEntries((current) =>
        current.filter((item) => item.id !== target.entry!.id)
      );
      closeDialog();
      toast.success("Lançamento removido.");
      router.refresh();
    });
  }

  const dayTotals = days.map((day) =>
    entries
      .filter((entry) => entry.entry_date === day.iso)
      .reduce((sum, entry) => sum + entry.hours, 0)
  );
  const weekTotal = dayTotals.reduce((sum, value) => sum + value, 0);

  const rows: Array<{
    key: string;
    kind: TimeEntryKind;
    projectId: string | null;
    title: string;
    subtitle: string;
  }> = [
    ...projects.map((project) => ({
      key: project.id,
      kind: "project" as const,
      projectId: project.id,
      title: project.name,
      subtitle: `Equipe ${project.teamName}`,
    })),
    {
      key: "admin",
      kind: "admin",
      projectId: null,
      title: "Horas administrativas",
      subtitle:
        "Disponível para todos · licença, treinamento ou reunião interna",
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="animate-fade-in space-y-4 border-b border-border/50 px-6 py-5">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-brand uppercase">
            Workspace
          </p>
          <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight">
            Timesheet
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lance as horas nos projetos em que você está alocado.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 rounded-xl border border-border/60 bg-card/70 px-1 py-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => goToWeek(addDays(startDate, -7))}
              aria-label="Semana anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-[12rem] text-center text-sm font-medium">
              {formatWeekRange(startDate)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => goToWeek(addDays(startDate, 7))}
              aria-label="Próxima semana"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => goToWeek(new Date())}
          >
            Semana atual
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
        {setupRequired ? (
          <div className="mb-4 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm">
            Para habilitar o timesheet, execute{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              supabase/timesheet.sql
            </code>{" "}
            no SQL Editor do Supabase e recarregue a página.
          </div>
        ) : null}

        {projects.length === 0 ? (
          <div className="mb-4 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
            Você só lança horas em projetos cuja equipe você faz parte. Horas
            administrativas continuam disponíveis abaixo.
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70">
          <table className="w-full min-w-[52rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/50 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                <th className="w-[16rem] px-4 py-3 text-left">Posição</th>
                {days.map((day) => (
                  <th
                    key={day.iso}
                    className={cn(
                      "px-2 py-3 text-center",
                      day.iso === todayIso && "text-brand"
                    )}
                  >
                    <div>{day.weekdayLabel}</div>
                    <div className="mt-0.5 font-medium tracking-normal">
                      {day.dayLabel}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const rowTotal = days.reduce((sum, day) => {
                  const entry = entryMap.get(
                    entryKey(row.kind, row.projectId, day.iso)
                  );
                  return sum + (entry?.hours ?? 0);
                }, 0);

                return (
                  <tr
                    key={row.key}
                    className="border-b border-border/40 last:border-b-0"
                  >
                    <td className="px-4 py-3 align-middle">
                      <div className="font-medium">{row.title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {row.subtitle}
                      </div>
                    </td>
                    {days.map((day) => {
                      const entry = entryMap.get(
                        entryKey(row.kind, row.projectId, day.iso)
                      );
                      const weekend = day.date.getDay() === 0 || day.date.getDay() === 6;

                      return (
                        <td key={day.iso} className="px-2 py-2">
                          <button
                            type="button"
                            disabled={setupRequired}
                            onClick={() =>
                              openCell({
                                kind: row.kind,
                                projectId: row.projectId,
                                projectName: row.title,
                                entryDate: day.iso,
                                entry,
                              })
                            }
                            className={cn(
                              "flex h-12 w-full items-center justify-center rounded-xl border text-sm font-medium transition-colors",
                              entry
                                ? "border-transparent bg-brand text-brand-foreground shadow-sm hover:bg-brand/90"
                                : "border-dashed border-border/80 text-muted-foreground hover:border-brand/40 hover:bg-brand/8 hover:text-brand",
                              weekend && !entry && "bg-muted/20",
                              day.iso === todayIso && !entry && "ring-1 ring-brand/20"
                            )}
                            aria-label={
                              entry
                                ? `Editar ${formatHoursCell(entry.hours)} em ${row.title}`
                                : `Lançar horas em ${row.title}`
                            }
                          >
                            {entry ? (
                              formatHoursCell(entry.hours)
                            ) : (
                              <Plus className="size-4 opacity-70" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">
                      {formatHoursTotal(rowTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-muted/35 text-sm font-semibold">
                <td className="px-4 py-3">Total</td>
                {dayTotals.map((total, index) => (
                  <td
                    key={days[index].iso}
                    className="px-2 py-3 text-center tabular-nums"
                  >
                    {formatHoursTotal(total)}
                  </td>
                ))}
                <td className="px-3 py-3 text-right tabular-nums">
                  {formatHoursTotal(weekTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <Dialog open={Boolean(target)} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>
                {target?.entry ? "Editar lançamento" : "Lançar horas"}
              </DialogTitle>
              <DialogDescription>
                {target
                  ? `${target.projectName} · ${formatCellDate(target.entryDate)}`
                  : null}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <div className="space-y-2">
                <Label htmlFor="hours">Horas</Label>
                <Input
                  id="hours"
                  value={hoursInput}
                  onChange={(event) => setHoursInput(event.target.value)}
                  placeholder="Ex.: 6, 6,5 ou 6:30"
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Descrição (opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Descreva o que foi feito neste dia"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className={target?.entry ? "sm:justify-between" : undefined}>
              {target?.entry ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={pending}
                >
                  Remover
                </Button>
              ) : null}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                  disabled={pending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? (
                    <>
                      <Spinner className="text-primary-foreground" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
