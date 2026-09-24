import { Skeleton } from "@/components/ui/skeleton";

export default function TimesheetLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="space-y-4 border-b border-border/60 px-6 py-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-9 w-64 rounded-xl" />
      </div>
      <div className="p-6">
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    </div>
  );
}
