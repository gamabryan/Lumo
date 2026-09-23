"use client";

import { useRef, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { sendMessage } from "@/actions/messages";
import {
  FileUpload,
  uploadPendingFiles,
} from "@/components/files/file-upload";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { MESSAGE_PRIORITY_TAGS } from "@/lib/messages";
import { cn } from "@/lib/utils";
import type {
  MessagePriorityTag,
  MessageWithSender,
} from "@/types/database";

type MessageComposerProps = {
  projectId: string;
  onSent: (message: MessageWithSender) => void;
};

export function MessageComposer({ projectId, onSent }: MessageComposerProps) {
  const [content, setContent] = useState("");
  const [priorityTag, setPriorityTag] =
    useState<MessagePriorityTag>("normal");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const uploadKey = useRef(0);
  const [uploadReset, setUploadReset] = useState(0);

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    if (loading) return;
    if (!content.trim() && pendingFiles.length === 0) return;

    setLoading(true);

    const result = await sendMessage({
      projectId,
      content,
      priorityTag,
      allowEmptyContent: pendingFiles.length > 0,
    });

    if (result.error || !result.message) {
      setLoading(false);
      toast.error(result.error ?? "Erro ao enviar.");
      return;
    }

    let message = result.message;

    if (pendingFiles.length > 0) {
      const uploaded = await uploadPendingFiles(pendingFiles, {
        type: "message",
        messageId: message.id,
        projectId,
      });

      if (uploaded.errors.length) {
        toast.error(`Alguns anexos falharam: ${uploaded.errors[0]}`);
      }

      message = { ...message, files: uploaded.files };
    }

    onSent(message);
    setContent("");
    setPriorityTag("normal");
    setPendingFiles([]);
    uploadKey.current += 1;
    setUploadReset(uploadKey.current);
    setLoading(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2.5 border-t border-border/40 bg-card/70 p-3.5 backdrop-blur-sm"
    >
      <div className="flex flex-wrap gap-1">
        {MESSAGE_PRIORITY_TAGS.map((tag) => {
          const selected = priorityTag === tag.value;
          return (
            <Button
              key={tag.value}
              type="button"
              size="xs"
              variant={selected ? "default" : "outline"}
              className={cn(
                "rounded-lg text-xs",
                selected &&
                  tag.value === "urgent" &&
                  "bg-rose-600 text-white hover:bg-rose-600/90",
                selected &&
                  tag.value === "important" &&
                  "bg-sky-600 text-white hover:bg-sky-600/90"
              )}
              onClick={() => setPriorityTag(tag.value)}
            >
              {tag.label}
            </Button>
          );
        })}
      </div>

      <FileUpload
        key={uploadReset}
        context={null}
        pendingOnly
        compact
        label="Anexar à mensagem"
        onPendingChange={setPendingFiles}
        disabled={loading}
      />

      <div className="flex items-end gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva uma mensagem…"
          rows={2}
          className="min-h-[64px] flex-1 resize-none rounded-xl border-border/60 bg-background/80 shadow-sm"
        />
        <Button
          type="submit"
          size="icon"
          className="size-9 shrink-0 rounded-xl shadow-[0_4px_14px_-6px_oklch(0.45_0.1_195/0.55)]"
          disabled={
            loading || (!content.trim() && pendingFiles.length === 0)
          }
          aria-label="Enviar mensagem"
        >
          {loading ? (
            <Spinner className="text-primary-foreground" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>
    </form>
  );
}
