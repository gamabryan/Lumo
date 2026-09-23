"use client";

import { useEffect, useState, useTransition } from "react";
import { Brain, Check } from "lucide-react";
import { toast } from "sonner";
import {
  setFocusMode,
  type FocusDuration,
} from "@/actions/focus-mode";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import {
  isFocusModeActive,
  useFocusStore,
} from "@/stores/focus-store";
import { cn } from "@/lib/utils";

type FocusModeButtonProps = {
  initialFocusModeUntil: string | null;
};

function formatRemaining(until: string) {
  const ms = new Date(until).getTime() - Date.now();
  if (ms <= 0) return "expirado";
  if (new Date(until).getFullYear() >= 2099) return "até desligar";

  const totalMinutes = Math.ceil(ms / 60000);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function FocusModeButton({
  initialFocusModeUntil,
}: FocusModeButtonProps) {
  const [pending, startTransition] = useTransition();
  const focusModeUntil = useFocusStore((s) => s.focusModeUntil);
  const setFocusModeUntil = useFocusStore((s) => s.setFocusModeUntil);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setFocusModeUntil(initialFocusModeUntil);
  }, [initialFocusModeUntil, setFocusModeUntil]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const until = useFocusStore.getState().focusModeUntil;
      if (until && new Date(until).getTime() <= Date.now()) {
        setFocusModeUntil(null);
      }
      setTick((value) => value + 1);
    }, 30000);

    return () => window.clearInterval(id);
  }, [setFocusModeUntil]);

  const active = isFocusModeActive(focusModeUntil);
  void tick;

  function apply(duration: FocusDuration) {
    startTransition(async () => {
      const result = await setFocusMode(duration);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      setFocusModeUntil(result.focusModeUntil);
      if (duration === "off") {
        toast.success("Modo Concentração desligado.");
      } else {
        toast.success("Modo Concentração ativado.");
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant={active ? "default" : "outline"}
            size="sm"
            className={cn(
              "gap-1.5 transition-all",
              active &&
                "border-brand/30 bg-brand text-brand-foreground shadow-[0_4px_14px_-6px_oklch(0.45_0.1_195/0.55)] hover:bg-brand/90"
            )}
            disabled={pending}
          />
        }
      >
        <Brain className="size-3.5" />
        {pending ? <Spinner className="size-3.5" /> : null}
        {active ? "Concentração" : "Modo Concentração"}
        {active && focusModeUntil ? (
          <span className="hidden text-[11px] opacity-80 sm:inline">
            · {formatRemaining(focusModeUntil)}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Silenciar não urgentes</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => apply("1h")}>
            Por 1 hora
            {active && focusModeUntil && formatRemaining(focusModeUntil).includes("h") ? (
              <Check className="ml-auto size-3.5" />
            ) : null}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => apply("2h")}>
            Por 2 horas
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => apply("until_off")}>
            Até desligar
            {active &&
            focusModeUntil &&
            new Date(focusModeUntil).getFullYear() >= 2099 ? (
              <Check className="ml-auto size-3.5" />
            ) : null}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {active ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => apply("off")}>
              Desligar agora
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
