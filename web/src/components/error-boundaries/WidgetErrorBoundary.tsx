/**
 * WidgetErrorBoundary - Component-level error boundary
 *
 * Isolates errors to specific components, preventing them from crashing
 * the entire application. Used for widgets, cards, and other isolated UI parts.
 */

import { ComponentProps } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * WidgetErrorFallback - Fallback UI for component errors
 */
export function WidgetErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="p-4 border border-destructive/50 bg-destructive/10 rounded">
      <div className="flex items-center gap-2 text-destructive mb-2">
        <AlertTriangle className="h-4 w-4" />
        <span className="font-medium">组件加载失败</span>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        {import.meta.env.DEV ? error.message : "组件暂时无法加载"}
      </p>
      <Button size="sm" variant="outline" onClick={resetErrorBoundary}>
        重试
      </Button>
    </div>
  );
}

/**
 * WidgetErrorBoundary - Component-level error boundary wrapper
 *
 * Use this to wrap individual components that should fail independently:
 * - Session list
 * - Chat messages
 * - Permission cards
 * - Command palette
 *
 * @example
 * ```tsx
 * <WidgetErrorBoundary>
 *   <SessionList />
 * </WidgetErrorBoundary>
 * ```
 */
export function WidgetErrorBoundary({
  children,
  onError,
}: {
  children: React.ReactNode;
  onError?: (error: Error) => void;
}) {
  return (
    <ErrorBoundary
      FallbackComponent={WidgetErrorFallback}
      onError={(error) => {
        console.error("组件错误:", error);
        onError?.(error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
