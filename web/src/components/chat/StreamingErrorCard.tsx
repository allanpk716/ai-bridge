/**
 * StreamingErrorCard Component
 *
 * Error card displayed when streaming fails.
 * Shows error message with retry button for user recovery.
 *
 * Features:
 * - Error icon with AlertCircle from lucide-react
 * - Truncated error message for long errors
 * - Retry button with RefreshCw icon
 * - Red/danger theme for error visibility
 * - Compact height (not full message bubble)
 * - Dismiss button to clear error
 *
 * @see .planning/phases/04-real-time-chat/04-06-PLAN.md > Task 4
 */

import { AlertCircle, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { clsx } from "clsx";

export interface StreamingErrorCardProps {
  /** Error object or error message string */
  error: Error | string;
  /** Callback when retry button is clicked */
  onRetry: () => void;
  /** Optional callback when dismiss button is clicked */
  onDismiss?: () => void;
  /** Optional CSS class name for styling */
  className?: string;
  /** Optional loading state during retry */
  isRetrying?: boolean;
}

/**
 * Get user-friendly error message from error
 */
function getErrorMessage(error: Error | string): string {
  if (typeof error === "string") {
    return error;
  }

  // Network errors
  if (error.name === "NetworkError" || error.message.includes("network")) {
    return "Connection lost. Retry?";
  }

  // Timeout errors
  if (error.name === "TimeoutError" || error.message.includes("timeout")) {
    return "Request timed out. Retry?";
  }

  // Abort errors (user cancelled)
  if (error.name === "AbortError" || error.message.includes("abort")) {
    return "Stream cancelled";
  }

  // Generic error - truncate if too long
  const message = error.message || "Something went wrong";
  return message.length > 50
    ? `${message.substring(0, 50)}...`
    : message;
}

/**
 * Error card with retry button
 *
 * Displays at position where streaming failed:
 * - Left: Error icon + truncated error message
 * - Right: Retry button and optional dismiss button
 */
export function StreamingErrorCard({
  error,
  onRetry,
  onDismiss,
  className,
  isRetrying = false,
}: StreamingErrorCardProps) {
  const errorMessage = getErrorMessage(error);
  const isAbortError =
    typeof error === "string"
      ? error.toLowerCase().includes("cancel")
      : error.name === "AbortError" || error.message.includes("abort");

  return (
    <div className="flex justify-start my-2">
      <Card
        className={clsx(
          "max-w-[80%] border-destructive/50 bg-destructive/10",
          className
        )}
      >
        <div className="p-3">
          <div className="flex items-center gap-3">
            {/* Error icon */}
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-destructive" />

            {/* Error message */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-destructive truncate">
                {errorMessage}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-shrink-0">
              {/* Retry button (not shown for abort errors) */}
              {!isAbortError && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  disabled={isRetrying}
                  className="h-7 text-xs px-3"
                >
                  <RefreshCw
                    className={clsx(
                      "w-3 h-3 mr-1",
                      isRetrying && "animate-spin"
                    )}
                  />
                  {isRetrying ? "Retrying..." : "Retry"}
                </Button>
              )}

              {/* Dismiss button (optional) */}
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="h-7 w-7 p-0"
                  title="Dismiss"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
