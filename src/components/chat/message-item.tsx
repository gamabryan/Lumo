"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FileList } from "@/components/files/file-list";
import { getMessagePriorityLabel } from "@/lib/messages";
import { cn } from "@/lib/utils";
import {
  isFocusModeActive,
  useFocusStore,
} from "@/stores/focus-store";
import type { MessageWithSender } from "@/types/database";

type MessageItemProps = {
  message: MessageWithSender;
  isOwn: boolean;
  projectId: string;
  currentUserId: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function MessageItem({
  message,
  isOwn,
  projectId,
  currentUserId,
}: MessageItemProps) {
  const focusModeUntil = useFocusStore((s) => s.focusModeUntil);
  const focusActive = isFocusModeActive(focusModeUntil);
  const muted =
    focusActive && message.priority_tag !== "urgent" && !isOwn;

  const tagStyles = {
    normal: "bg-muted text-muted-foreground",
    important: "bg-sky-50 text-sky-700 ring-1 ring-sky-200/70",
    urgent: "bg-amber-50 text-amber-900 ring-1 ring-amber-300/80",
  } as const;

  const bubbleStyles = {
    normal: isOwn
      ? "bg-brand/8 border-brand/15"
      : "bg-card/90 border-border/50 shadow-[0_1px_2px_oklch(0.3_0.02_250/0.04)]",
    important: "bg-sky-50/90 border-sky-200/70",
    urgent: "bg-rose-50/90 border-rose-200/80",
  } as const;

  const files = message.files ?? [];

  return (
    <div
      className={cn(
        "flex gap-2",
        isOwn ? "flex-row-reverse" : "flex-row",
        muted && "opacity-55"
      )}
    >
      <Avatar size="sm" className="mt-0.5">
        {message.sender.avatar_url ? (
          <AvatarImage
            src={message.sender.avatar_url}
            alt={message.sender.name}
          />
        ) : null}
        <AvatarFallback className="bg-brand/10 text-[10px] text-brand">
          {getInitials(message.sender.name) || "U"}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "max-w-[85%] space-y-1.5 rounded-xl border px-3 py-2",
          bubbleStyles[message.priority_tag],
          isOwn && "rounded-tr-md",
          !isOwn && "rounded-tl-md"
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-foreground">
            {isOwn ? "Você" : message.sender.name}
          </span>
          {message.priority_tag !== "normal" ? (
            <Badge
              variant="secondary"
              className={cn(
                "rounded-md px-1.5 py-0 text-[10px]",
                tagStyles[message.priority_tag],
                message.priority_tag === "urgent" &&
                  "bg-rose-100 text-rose-800 ring-1 ring-rose-200"
              )}
            >
              {getMessagePriorityLabel(message.priority_tag)}
            </Badge>
          ) : null}
          <span className="text-[10px] text-muted-foreground">
            {formatTime(message.created_at)}
          </span>
        </div>

        {muted ? (
          <p className="text-xs italic text-muted-foreground">
            Mensagem silenciada no Modo Concentração
          </p>
        ) : (
          <>
            {message.content && message.content !== "Arquivo anexado" ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                {message.content}
              </p>
            ) : null}
            {files.length > 0 ? (
              <FileList
                files={files}
                projectId={projectId}
                currentUserId={currentUserId}
                compact
              />
            ) : null}
            {message.content === "Arquivo anexado" && files.length === 0 ? (
              <p className="text-sm text-muted-foreground">Arquivo anexado</p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
