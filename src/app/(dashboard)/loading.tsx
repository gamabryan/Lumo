import { SidebarSkeleton } from "@/components/ui/loading-blocks";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="app-canvas flex h-svh overflow-hidden">
      <SidebarSkeleton />
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-6">
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-lg" />
        <Skeleton className="mt-4 h-24 w-full rounded-2xl" />
      </div>
    </div>
  );
}
