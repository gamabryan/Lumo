"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setPresenceStatus } from "@/actions/presence";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PRESENCE_DOT_CLASS,
  PRESENCE_LABELS,
  PRESENCE_STATUSES,
  normalizePresenceStatus,
} from "@/lib/presence";
import { cn } from "@/lib/utils";
import type { PresenceStatus } from "@/types/database";

type PresenceStatusMenuProps = {
  initialStatus?: PresenceStatus | string | null;
};

export function PresenceStatusMenu({
  initialStatus,
}: PresenceStatusMenuProps) {
  const router = useRouter();
  const [status, setStatus] = useState<PresenceStatus>(
    normalizePresenceStatus(initialStatus)
  );
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setStatus(normalizePresenceStatus(initialStatus));
  }, [initialStatus]);

  function handleChange(next: string) {
    const value = normalizePresenceStatus(next);
    const previous = status;
    setStatus(value);

    startTransition(async () => {
      const result = await setPresenceStatus(value);
      if (result.error) {
        setStatus(previous);
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            aria-label={`Status: ${PRESENCE_LABELS[status]}`}
            title={PRESENCE_LABELS[status]}
            className="text-muted-foreground hover:text-foreground"
          />
        }
      >
        <span
          className={cn(
            "size-2.5 rounded-full ring-2 ring-background",
            PRESENCE_DOT_CLASS[status]
          )}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="min-w-40">
        <DropdownMenuRadioGroup value={status} onValueChange={handleChange}>
          <DropdownMenuLabel>Seu status</DropdownMenuLabel>
          {PRESENCE_STATUSES.map((item) => (
            <DropdownMenuRadioItem key={item} value={item}>
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  PRESENCE_DOT_CLASS[item]
                )}
              />
              {PRESENCE_LABELS[item]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
