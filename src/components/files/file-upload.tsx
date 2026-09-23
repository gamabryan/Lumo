"use client";

import { useRef, useState } from "react";
import { Paperclip, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatFileSize, MAX_FILE_SIZE } from "@/lib/files";
import { uploadProjectFile, type FileContext } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { ProjectFile } from "@/types/database";

type FileUploadProps = {
  context: FileContext | null;
  /** When context is null, files stay pending until a message/task exists */
  pendingOnly?: boolean;
  onUploaded?: (file: ProjectFile) => void;
  onPendingChange?: (files: File[]) => void;
  disabled?: boolean;
  compact?: boolean;
  label?: string;
};

export function FileUpload({
  context,
  pendingOnly = false,
  onUploaded,
  onPendingChange,
  disabled,
  compact = false,
  label = "Anexar arquivo",
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  function updatePending(next: File[]) {
    setPending(next);
    onPendingChange?.(next);
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;

    const selected = Array.from(fileList);
    for (const file of selected) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} excede 10 MB.`);
        return;
      }
    }

    if (pendingOnly || !context) {
      updatePending([...pending, ...selected]);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);
    for (const file of selected) {
      const result = await uploadProjectFile(file, context);
      if (result.error || !result.file) {
        toast.error(result.error ?? `Falha ao enviar ${file.name}`);
        continue;
      }
      onUploaded?.(result.file);
      toast.success(`${file.name} anexado.`);
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        onChange={(e) => void handleFiles(e.target.files)}
      />

      <Button
        type="button"
        variant="outline"
        size={compact ? "xs" : "sm"}
        className={cn("gap-1.5", compact && "h-7")}
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Upload className="size-3.5 animate-pulse" />
        ) : (
          <Paperclip className="size-3.5" />
        )}
        {uploading ? "Enviando…" : label}
      </Button>

      {pending.length > 0 ? (
        <ul className="space-y-1">
          {pending.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 rounded-md border border-dashed border-border/70 px-2 py-1.5 text-xs"
            >
              <Paperclip className="size-3 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="text-muted-foreground">
                {formatFileSize(file.size)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() =>
                  updatePending(pending.filter((_, i) => i !== index))
                }
                aria-label="Remover da fila"
              >
                <X className="size-3" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {!context && !pendingOnly ? (
        <p className="text-[11px] text-muted-foreground">
          Vincule a uma tarefa ou mensagem para enviar.
        </p>
      ) : null}
    </div>
  );
}

export async function uploadPendingFiles(
  files: File[],
  context: FileContext
): Promise<{ files: ProjectFile[]; errors: string[] }> {
  const uploaded: ProjectFile[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const result = await uploadProjectFile(file, context);
    if (result.error || !result.file) {
      errors.push(result.error ?? file.name);
      continue;
    }
    uploaded.push(result.file);
  }

  return { files: uploaded, errors };
}
