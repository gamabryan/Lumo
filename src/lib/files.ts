export const STORAGE_BUCKET = "project-files";
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const PREVIEWABLE_MIME_PREFIXES = ["image/"] as const;
export const PREVIEWABLE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".pdf",
] as const;

export function sanitizeFileName(name: string) {
  return name.replace(/[^\w.\-()\s]/g, "_").replace(/\s+/g, "-");
}

export function buildStoragePath(
  projectId: string,
  userId: string,
  fileName: string
) {
  const safe = sanitizeFileName(fileName);
  return `${projectId}/${userId}/${crypto.randomUUID()}-${safe}`;
}

export function getFileExtension(name: string) {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index).toLowerCase() : "";
}

export function canPreviewFile(name: string, mimeType?: string | null) {
  if (mimeType) {
    if (mimeType.startsWith("image/") || mimeType === "application/pdf") {
      return true;
    }
  }

  const ext = getFileExtension(name);
  return PREVIEWABLE_EXTENSIONS.includes(
    ext as (typeof PREVIEWABLE_EXTENSIONS)[number]
  );
}

export function isImageFile(name: string, mimeType?: string | null) {
  if (mimeType?.startsWith("image/")) return true;
  return [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(
    getFileExtension(name)
  );
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
