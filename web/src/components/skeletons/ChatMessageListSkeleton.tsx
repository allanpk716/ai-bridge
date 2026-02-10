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

export interface ChatMessageListSkeletonProps {
  className?: string;
}

export function ChatMessageListSkeleton({ className }: ChatMessageListSkeletonProps) {
  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Show 3 skeleton messages */}
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className={`flex ${index % 2 === 0 ? "justify-end" : "justify-start"}`}
          >
            <div className="h-20 w-3/4 max-w-md bg-muted animate-pulse rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
