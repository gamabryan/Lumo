import { KanbanSkeleton } from "@/components/ui/loading-blocks";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="space-y-4 border-b border-border/60 px-6 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-56" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
      <KanbanSkeleton />
    </div>
  );
}
