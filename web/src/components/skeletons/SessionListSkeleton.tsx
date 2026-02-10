/**
 * SessionListSkeleton Component
 *
 * Skeleton loading state for session list page.
 * Shows placeholder cards while sessions are loading.
 *
 * Features:
 * - Multiple skeleton cards in a list
 * - Animated shimmer effect
 * - Matches SessionListItem layout
 *
 * @see .planning/phases/06-polish-advanced-features/06-06-PLAN.md
 */

export interface SessionListSkeletonProps {
  className?: string;
}

export function SessionListSkeleton({ className }: SessionListSkeletonProps) {
  return (
    <div className={className ?? "space-y-3"}>
      {/* Show 5 skeleton cards */}
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-24 w-full bg-muted animate-pulse rounded-md" />
      ))}
    </div>
  );
}
