import { Skeleton } from "@/components/ui/skeleton";

export function KanbanSkeleton() {
  return (
    <div className="flex min-w-[48rem] gap-3 px-6 py-5">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex min-h-[28rem] flex-1 flex-col gap-3 rounded-2xl border border-border/50 bg-card/55 p-3 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-6 rounded-lg" />
          </div>
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <Skeleton className="h-10 w-full rounded-xl" />
      <Skeleton className="h-16 w-3/4 rounded-xl" />
      <Skeleton className="ml-auto h-16 w-2/3 rounded-xl" />
      <Skeleton className="h-16 w-3/4 rounded-xl" />
      <div className="mt-auto space-y-2">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <aside className="glass-panel flex h-full w-[15.5rem] shrink-0 flex-col border-y-0 border-l-0 p-3">
      <Skeleton className="mb-4 h-8 w-28 rounded-xl" />
      <Skeleton className="mb-3 h-9 w-full rounded-xl" />
      <Skeleton className="mb-2 h-3 w-16" />
      <Skeleton className="mb-1 h-8 w-full rounded-xl" />
      <Skeleton className="mb-1 h-8 w-full rounded-xl" />
      <Skeleton className="mb-1 h-8 w-5/6 rounded-xl" />
      <div className="mt-auto border-t border-border/40 pt-3">
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </aside>
  );
}
