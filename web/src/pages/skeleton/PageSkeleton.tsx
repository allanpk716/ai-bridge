import { CardSkeleton } from "@/components/skeletons";

export function PageHeaderSkeleton() {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted/60 rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}

export function SessionListPageSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <PageHeaderSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}

export function SessionDetailPageSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          <div className="h-8 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex gap-4">
          <div className="h-4 w-20 bg-muted/60 rounded animate-pulse" />
          <div className="h-4 w-24 bg-muted/60 rounded animate-pulse" />
          <div className="h-4 w-28 bg-muted/60 rounded animate-pulse" />
        </div>
      </div>
      <div className="flex-1 space-y-4 p-4">
        <div className="h-16 w-full bg-muted/50 rounded animate-pulse" />
        <div className="h-20 w-3/4 bg-muted/50 rounded animate-pulse ml-auto" />
        <div className="h-24 w-2/3 bg-muted/50 rounded animate-pulse" />
        <div className="h-16 w-full bg-muted/50 rounded animate-pulse" />
      </div>
    </div>
  );
}
