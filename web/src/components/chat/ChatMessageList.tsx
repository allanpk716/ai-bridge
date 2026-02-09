/**
 * ChatMessageList Component
 *
 * Virtualized message list using react-virtuoso for efficient rendering
 * of large conversation histories (10,000+ messages).
 *
 * Features:
 * - Virtualization: Only renders visible messages
 * - Auto-scroll: Automatically scrolls to new messages
 * - Variable height: Handles messages with different content sizes
 * - Bubble layout: User messages right, assistant messages left
 *
 * @see .planning/phases/04-real-time-chat/04-RESEARCH.md > Pattern 1
 */

import { Virtuoso } from "react-virtuoso";
import { type Message } from "@/types/api";
import { clsx } from "clsx";

export interface ChatMessageListProps {
  /** Array of messages to display */
  messages: Message[];
  /** Optional CSS class name for styling */
  className?: string;
  /** Optional callback when user scrolls to top (for pagination) */
  onScrollToTop?: () => void;
  /** Optional loading state */
  isLoading?: boolean;
}

/**
 * Renders a single message bubble with role-based styling
 */
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  // System messages: centered, small, muted
  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="px-3 py-1 text-xs text-muted-foreground bg-muted/50 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  // User messages: right-aligned, blue/primary background
  if (isUser) {
    return (
      <div className="flex justify-end my-2">
        <div className="max-w-[80%] px-4 py-2 bg-primary text-primary-foreground rounded-2xl rounded-br-sm">
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          <span className="text-xs opacity-70 mt-1 block">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    );
  }

  // Assistant messages: left-aligned, gray/secondary background
  return (
    <div className="flex justify-start my-2">
      <div className="max-w-[80%] px-4 py-2 bg-muted text-foreground rounded-2xl rounded-bl-sm">
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <span className="text-xs text-muted-foreground mt-1 block">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

/**
 * Virtualized message list component with auto-scroll behavior
 */
export default function ChatMessageList({
  messages,
  className,
  onScrollToTop,
  isLoading = false,
}: ChatMessageListProps) {
  // Empty state
  if (messages.length === 0) {
    return (
      <div className={clsx("flex items-center justify-center h-full", className)}>
        <p className="text-muted-foreground text-sm">No messages yet</p>
      </div>
    );
  }

  return (
    <div className={clsx("h-full", className)}>
      <Virtuoso
        style={{ height: "100%" }}
        data={messages}
        // Start at bottom (most recent messages)
        initialTopMostItemIndex={Math.max(0, messages.length - 1)}
        // Auto-scroll to new messages smoothly
        followOutput="smooth"
        // Increase viewport for smoother overscroll
        increaseViewportBy={{ top: 100, bottom: 100 }}
        // Handle scroll to top for historical pagination
        endReached={() => {
          if (onScrollToTop) {
            onScrollToTop();
          }
        }}
        // Orientation for endReached (top of list = older messages)
        orientation="vertical"
        // Customize scroll behavior
        followOutput={(isAtBottom) => {
          // Only auto-scroll if we're already at bottom
          // This prevents interrupting users reading history
          return isAtBottom ? "smooth" : false;
        }}
        // Item content renderer
        itemContent={(index, message) => (
          <MessageBubble key={message.seq} message={message} />
        )}
        // Optional: Loading indicator at bottom
        components={
          isLoading
            ? {
                Footer: () => (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ),
              }
            : undefined
        }
      />
    </div>
  );
}
