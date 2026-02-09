/**
 * StreamingIndicator Component
 *
 * Visual indicator shown during AI message streaming.
 * Displays status text with stop button for user control.
 *
 * Features:
 * - Shows "Claude is thinking..." text during streaming
 * - Stop button with Square icon for interrupting generation
 * - Muted background with border separator
 * - Optional TypingIndicator integration for visual feedback
 *
 * @see .planning/phases/04-real-time-chat/04-06-PLAN.md > Task 2
 */

import { Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clsx } from "clsx";
import TypingIndicator from "./TypingIndicator";

export interface StreamingIndicatorProps {
  /** Whether streaming is active */
  isStreaming: boolean;
  /** Callback when stop button is clicked */
  onStop?: () => void;
  /** Optional CSS class name for styling */
  className?: string;
  /** Optional status text (default: "Claude is thinking...") */
  statusText?: string;
}

/**
 * Streaming indicator with stop button
 *
 * Displays above streaming message with:
 * - Left: Status text + animated typing indicator
 * - Right: Stop button with Square icon
 */
export default function StreamingIndicator({
  isStreaming,
  onStop,
  className,
  statusText = "Claude is thinking...",
}: StreamingIndicatorProps) {
  // Don't render if not streaming
  if (!isStreaming) {
    return null;
  }

  return (
    <div
      className={clsx(
        "flex items-center justify-between px-4 py-2",
        "bg-muted/50 border-b border-border",
        "text-sm text-muted-foreground",
        className
      )}
    >
      {/* Left side: Status text with typing indicator */}
      <div className="flex items-center gap-2">
        <TypingIndicator />
        <span className="text-xs">{statusText}</span>
      </div>

      {/* Right side: Stop button */}
      {onStop && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onStop}
          className="h-7 px-2 text-xs"
          title="Stop generation (Esc)"
        >
          <Square className="w-3 h-3 mr-1" />
          Stop
        </Button>
      )}
    </div>
  );
}
