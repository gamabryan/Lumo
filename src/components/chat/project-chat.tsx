"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, PanelRightClose } from "lucide-react";
import { MessageComposer } from "@/components/chat/message-composer";
import { MessageItem } from "@/components/chat/message-item";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";
import {
  isFocusModeActive,
  useFocusStore,
} from "@/stores/focus-store";
import type {
  Message,
  MessageWithSender,
  ProjectFile,
  User,
} from "@/types/database";

type Member = Pick<User, "id" | "name" | "avatar_url">;

type ProjectChatProps = {
  projectId: string;
  currentUserId: string;
  members: Member[];
  initialMessages: MessageWithSender[];
  onMinimize?: () => void;
};

export function ProjectChat({
  projectId,
  currentUserId,
  members,
  initialMessages,
  onMinimize,
}: ProjectChatProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [realtimeReady, setRealtimeReady] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const membersRef = useRef(members);
  const focusModeUntil = useFocusStore((s) => s.focusModeUntil);

  membersRef.current = members;

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    let active = true;
    const pendingTimeouts = new Set<ReturnType<typeof setTimeout>>();
    const supabase = createClient();

    async function toMessageWithSender(
      row: Message
    ): Promise<MessageWithSender> {
      const cached = membersRef.current.find(
        (member) => member.id === row.sender_id
      );
      const { data: files } = await supabase
        .from("files")
        .select("*")
        .eq("message_id", row.id)
        .order("created_at", { ascending: true });

      if (cached) {
        return {
          ...row,
          sender: cached,
          files: (files ?? []) as ProjectFile[],
        };
      }

      const { data } = await supabase
        .from("users")
        .select("id, name, avatar_url")
        .eq("id", row.sender_id)
        .maybeSingle();

      return {
        ...row,
        sender: data ?? {
          id: row.sender_id,
          name: "Membro",
          avatar_url: null,
        },
        files: (files ?? []) as ProjectFile[],
      };
    }

    const channelName = `project-messages:${projectId}:${crypto.randomUUID()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const timeoutId = setTimeout(() => {
            pendingTimeouts.delete(timeoutId);
            void (async () => {
              if (!active) return;
              const row = payload.new as Message;
              const enriched = await toMessageWithSender(row);
              if (!active) return;

              setMessages((current) => {
                const existing = current.find((item) => item.id === enriched.id);
                if (existing) {
                  return current.map((item) =>
                    item.id === enriched.id
                      ? {
                          ...item,
                          files:
                            (enriched.files?.length ?? 0) >
                            (item.files?.length ?? 0)
                              ? enriched.files
                              : item.files,
                        }
                      : item
                  );
                }
                return [...current, enriched];
              });
            })();
          }, 400);
          pendingTimeouts.add(timeoutId);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "files",
        },
        (payload) => {
          if (!active) return;
          const file = payload.new as ProjectFile;
          if (!file.message_id) return;

          setMessages((current) =>
            current.map((message) => {
              if (message.id !== file.message_id) return message;
              if (message.files?.some((item) => item.id === file.id)) {
                return message;
              }
              return {
                ...message,
                files: [...(message.files ?? []), file],
              };
            })
          );
        }
      )
      .subscribe((status) => {
        if (!active) return;
        setRealtimeReady(status === "SUBSCRIBED");
      });

    return () => {
      active = false;
      pendingTimeouts.forEach((id) => clearTimeout(id));
      pendingTimeouts.clear();
      setRealtimeReady(false);
      void supabase.removeChannel(channel);
    };
  }, [projectId]);

  function handleSent(message: MessageWithSender) {
    setMessages((current) => {
      const existing = current.find((item) => item.id === message.id);
      if (existing) {
        return current.map((item) =>
          item.id === message.id
            ? { ...item, files: message.files ?? item.files }
            : item
        );
      }
      return [...current, message];
    });
  }

  const focusActive = isFocusModeActive(focusModeUntil);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2.5 border-b border-border/40 px-4 py-3.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-brand/10 text-brand ring-1 ring-brand/15">
          <MessageCircle className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-sm font-semibold tracking-tight">
            Chat do projeto
          </h2>
          <p className="text-xs text-muted-foreground">
            {focusActive
              ? "Concentração ativa — só urgentes aparecem"
              : realtimeReady
                ? "Mensagens em tempo real"
                : "Conectando ao chat…"}
          </p>
        </div>
        {!realtimeReady ? <Spinner className="size-3.5" /> : null}
        {onMinimize ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onMinimize}
            aria-label="Minimizar chat"
            title="Minimizar chat"
            className="hidden text-muted-foreground hover:text-foreground lg:inline-flex"
          >
            <PanelRightClose className="size-3.5" />
          </Button>
        ) : null}
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="flex flex-col gap-3 py-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground ring-1 ring-border/50">
                <MessageCircle className="size-4" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Nenhuma mensagem ainda
              </p>
              <p className="max-w-[14rem] text-xs leading-relaxed text-muted-foreground">
                Comece a conversa da equipe. Use tags de prioridade quando
                precisar de atenção.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                isOwn={message.sender_id === currentUserId}
                projectId={projectId}
                currentUserId={currentUserId}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <MessageComposer projectId={projectId} onSent={handleSent} />
    </div>
  );
}
