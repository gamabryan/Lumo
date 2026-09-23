import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SpinnerProps = {
  className?: string;
  label?: string;
};

export function Spinner({ className, label = "Carregando" }: SpinnerProps) {
  return (
    <Loader2
      className={cn("size-4 animate-spin text-muted-foreground", className)}
      aria-label={label}
      role="status"
    />
  );
}
