import { FolderKanban } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Seu espaço de trabalho Lumo",
};

export default function DashboardPage() {
  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,oklch(0.9_0.05_195/0.35),transparent_55%)]" />
      <div className="animate-fade-up relative max-w-md">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,oklch(0.94_0.04_195),oklch(0.98_0.01_95))] shadow-[0_8px_30px_-12px_oklch(0.45_0.08_195/0.45)] ring-1 ring-brand/15">
          <FolderKanban className="size-6 text-brand" />
        </div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Selecione um projeto
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Escolha um projeto na barra lateral ou crie um novo para organizar
          tarefas, chat e arquivos da sua microequipe.
        </p>
      </div>
    </div>
  );
}
