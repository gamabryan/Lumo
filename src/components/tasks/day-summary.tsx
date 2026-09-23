import { ListTodo } from "lucide-react";

type DaySummaryProps = {
  pendingCount: number;
};

export function DaySummary({ pendingCount }: DaySummaryProps) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-brand/10 bg-gradient-to-br from-brand/10 via-card/80 to-card/90 px-4 py-3.5 shadow-[0_1px_0_oklch(1_0_0/0.6)_inset] dark:from-brand/15 dark:via-card/60 dark:to-card/80 dark:shadow-[0_1px_0_oklch(1_0_0/0.06)_inset]">
      <div className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15">
        <ListTodo className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-brand/80 uppercase">
          Resumo do Dia
        </p>
        <p className="mt-0.5 text-sm text-foreground">
          <span className="font-heading text-base font-semibold tabular-nums">
            {pendingCount}
          </span>{" "}
          {pendingCount === 1 ? "tarefa pendente" : "tarefas pendentes"} neste
          projeto
        </p>
      </div>
    </div>
  );
}
