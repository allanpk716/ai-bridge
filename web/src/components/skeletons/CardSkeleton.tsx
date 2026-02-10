
/**
 * CardSkeleton - Card loading skeleton
 *
 * Displays a placeholder card while card content is loading.
 */
export interface CardSkeletonProps {
  className?: string;
}

export function CardSkeleton({ className }: CardSkeletonProps) {
  return (
    <div className={className ?? "p-4 border rounded-lg space-y-3"}>
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
          <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-6 w-16 bg-muted animate-pulse rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-muted animate-pulse rounded" />
        <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 w-20 bg-muted animate-pulse rounded" />
        <div className="h-8 w-20 bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
}
