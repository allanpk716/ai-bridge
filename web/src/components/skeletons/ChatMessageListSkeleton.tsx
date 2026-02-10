/**
 * ChatMessageListSkeleton Component
 *
 * Skeleton loading state for chat message list.
 * Shows placeholder messages while loading.
 *
 * Features:
 * - Multiple skeleton messages
 * - User/assistant message layout
 * - Animated shimmer effect
 *
 * @see .planning/phases/06-polish-advanced-features/06-06-PLAN.md
 */

import { CardSkeleton } from "./CardSkeleton";

export function ChatMessageListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Show 3 skeleton messages */}
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className={`flex ${index % 2 === 0 ? "justify-end" : "justify-start"}`}
        >
          <CardSkeleton className="h-20 w-3/4 max-w-md" />
        </div>
      ))}
    </div>
  );
}
