/**
 * StreamingErrorCard Component
 *
 * Displays an error card when streaming message fails.
 * Shows error message and provides retry functionality.
 *
 * Features:
 * - Error message display
 * - Retry button to resend last message
 * - Dismiss button to clear error
 * - Warning icon for visual feedback
 */

import { AlertTriangle, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface StreamingErrorCardProps {
  /** Error to display */
  error: Error;
  /** Retry callback */
  onRetry: () => void;
  /** Dismiss callback */
  onDismiss: () => void;
}

/**
 * Streaming error card component
 */
export function StreamingErrorCard({ error, onRetry, onDismiss }: StreamingErrorCardProps) {
  return (
    <div className="flex justify-start my-2">
      <Card className="max-w-[80%] border-destructive/50 bg-destructive/10">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-destructive mb-1">
                Streaming Error
              </h4>
              <p className="text-sm text-muted-foreground break-words">
                {error.message || "Failed to stream message. The connection may have been interrupted."}
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="h-7 text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="h-7 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
