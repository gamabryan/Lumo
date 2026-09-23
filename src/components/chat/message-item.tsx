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

  const tag = message.priority_tag;

  const tagStyles = {
    normal: "bg-muted text-muted-foreground",
    important:
      "bg-sky-100 text-sky-900 ring-1 ring-sky-300/60 dark:bg-sky-500/20 dark:text-sky-100 dark:ring-sky-400/30",
    urgent:
      "bg-rose-100 text-rose-900 ring-1 ring-rose-300/70 dark:bg-rose-500/25 dark:text-rose-50 dark:ring-rose-400/40",
  } as const;

  const bubbleStyles = {
    normal: isOwn
      ? "border-brand/25 bg-brand/15 text-foreground dark:border-brand/35 dark:bg-brand/25"
      : "border-border/60 bg-muted/60 text-foreground dark:bg-muted/40",
    important: isOwn
      ? "border-sky-400/40 bg-sky-100 text-sky-950 dark:border-sky-400/40 dark:bg-sky-950 dark:text-sky-50"
      : "border-sky-300/50 bg-sky-50 text-sky-950 dark:border-sky-500/30 dark:bg-sky-950/80 dark:text-sky-50",
    urgent: isOwn
      ? "border-rose-400/50 bg-rose-100 text-rose-950 dark:border-rose-400/40 dark:bg-rose-950 dark:text-rose-50"
      : "border-rose-300/60 bg-rose-50 text-rose-950 dark:border-rose-500/35 dark:bg-rose-950/85 dark:text-rose-50",
  } as const;

  const files = message.files ?? [];

  return (
    <div
      className={cn(
        "flex gap-2",
        isOwn ? "flex-row-reverse" : "flex-row",
        muted && "opacity-50"
      )}
    >
      <Avatar size="sm" className="mt-0.5 shrink-0">
        {message.sender.avatar_url ? (
          <AvatarImage
            src={message.sender.avatar_url}
            alt={message.sender.name}
          />
        ) : null}
        <AvatarFallback className="bg-brand/15 text-[10px] font-semibold text-brand">
          {getInitials(message.sender.name) || "U"}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "max-w-[85%] space-y-1.5 rounded-2xl border px-3.5 py-2.5 shadow-sm",
          bubbleStyles[tag],
          isOwn && "rounded-tr-md",
          !isOwn && "rounded-tl-md"
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold opacity-90">
            {isOwn ? "Você" : message.sender.name}
          </span>
          {tag !== "normal" ? (
            <Badge
              variant="secondary"
              className={cn(
                "rounded-md px-1.5 py-0 text-[10px] font-semibold",
                tagStyles[tag]
              )}
            >
              {getMessagePriorityLabel(tag)}
            </Badge>
          ) : null}
          <span className="text-[10px] opacity-60">
            {formatTime(message.created_at)}
          </span>
        </div>

        {muted ? (
          <p className="text-xs italic opacity-70">
            Mensagem silenciada no Modo Concentração
          </p>
        ) : (
          <>
            {message.content && message.content !== "Arquivo anexado" ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
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
              <p className="text-sm opacity-70">Arquivo anexado</p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
