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

import { CardSkeleton } from "./CardSkeleton";

export function SessionListSkeleton() {
  return (
    <div className="space-y-3">
      {/* Show 5 skeleton cards */}
      {Array.from({ length: 5 }).map((_, index) => (
        <CardSkeleton key={index} className="h-24 w-full" />
      ))}
    </div>
  );
}
