"use client";

import { useState } from "react";
import {
  Download,
  Eye,
  FileIcon,
  FileText,
  ImageIcon,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { deleteProjectFile } from "@/actions/files";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { canPreviewFile, isImageFile } from "@/lib/files";
import { getSignedFileUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { ProjectFile } from "@/types/database";

type FileListProps = {
  files: ProjectFile[];
  projectId: string;
  currentUserId?: string;
  onRemoved?: (fileId: string) => void;
  compact?: boolean;
};

function FileTypeIcon({ name }: { name: string }) {
  if (isImageFile(name)) {
    return <ImageIcon className="size-4 text-muted-foreground" />;
  }
  if (name.toLowerCase().endsWith(".pdf")) {
    return <FileText className="size-4 text-muted-foreground" />;
  }
  return <FileIcon className="size-4 text-muted-foreground" />;
}

export function FileList({
  files,
  projectId,
  currentUserId,
  onRemoved,
  compact = false,
}: FileListProps) {
  const [preview, setPreview] = useState<{
    file: ProjectFile;
    url: string;
  } | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function openPreview(file: ProjectFile) {
    setLoadingId(file.id);
    const { url, error } = await getSignedFileUrl(file.file_url);
    setLoadingId(null);

    if (error || !url) {
      toast.error(error ?? "Não foi possível abrir o arquivo.");
      return;
    }

    if (canPreviewFile(file.name)) {
      setPreview({ file, url });
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function download(file: ProjectFile) {
    setLoadingId(file.id);
    const { url, error } = await getSignedFileUrl(file.file_url);
    setLoadingId(null);

    if (error || !url) {
      toast.error(error ?? "Download indisponível.");
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  async function remove(file: ProjectFile) {
    const result = await deleteProjectFile(file.id, projectId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    onRemoved?.(file.id);
    toast.success("Arquivo removido.");
  }

  if (files.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Nenhum arquivo anexado.
      </p>
    );
  }

  return (
    <>
      <ul className={cn("space-y-1.5", compact && "space-y-1")}>
        {files.map((file) => {
          const busy = loadingId === file.id;
          return (
            <li
              key={file.id}
              className={cn(
                "flex items-center gap-2 rounded-lg border border-border/50 bg-background/80 px-2.5 py-2 dark:bg-black/25",
                compact && "px-2 py-1.5"
              )}
            >
              <FileTypeIcon name={file.name} />
              <span className="min-w-0 flex-1 truncate text-sm">
                {file.name}
              </span>
              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => openPreview(file)}
                  disabled={busy}
                  aria-label="Visualizar ou abrir"
                >
                  {busy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Eye className="size-3.5" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => download(file)}
                  disabled={busy}
                  aria-label="Baixar"
                >
                  <Download className="size-3.5" />
                </Button>
                {currentUserId && file.uploaded_by === currentUserId ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => remove(file)}
                    aria-label="Remover"
                  >
                    <X className="size-3.5" />
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog
        open={!!preview}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">
              {preview?.file.name}
            </DialogTitle>
          </DialogHeader>
          {preview ? (
            <div className="space-y-3">
              {isImageFile(preview.file.name) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.url}
                  alt={preview.file.name}
                  className="max-h-[70vh] w-full rounded-lg object-contain bg-muted/40"
                />
              ) : preview.file.name.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={preview.url}
                  title={preview.file.name}
                  className="h-[70vh] w-full rounded-lg border border-border/60"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Preview não disponível para este tipo.
                </p>
              )}
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => download(preview.file)}
                >
                  <Download data-icon="inline-start" />
                  Baixar
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
