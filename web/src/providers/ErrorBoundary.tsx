/**
 * ErrorBoundary Provider
 *
 * Global error boundary using react-error-boundary library.
 * Catches React component errors anywhere in the component tree,
 * displays a fallback UI, and provides recovery options.
 *
 * Features:
 * - Catches all React component errors (prevents white screen of death)
 * - Displays user-friendly error message with stack trace
 * - Retry button to recover from errors
 * - Error logging to console (can be extended to error reporting service)
 *
 * @see https://github.com/bvaughn/react-error-boundary
 */

import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { Button } from "@/components/ui/button";

/**
 * ErrorFallback - Fallback UI displayed when an error is caught
 *
 * Shows:
 * - Error message (user-friendly)
 * - Stack trace (for debugging, collapsible)
 * - Retry button (to attempt recovery)
 */
function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="max-w-md w-full p-6 bg-destructive/10 border border-destructive/20 rounded-lg shadow-lg">
        {/* Error icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-destructive/20">
          <svg
            className="w-6 h-6 text-destructive"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Error title */}
        <h2 className="text-xl font-semibold text-destructive mb-2 text-center">
          Something went wrong
        </h2>

        {/* Error message */}
        <p className="text-sm text-muted-foreground mb-4 text-center">
          {error.message || "An unexpected error occurred"}
        </p>

        {/* Stack trace (collapsible for debugging) */}
        {error.stack && (
          <details className="mb-4">
            <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              View technical details
            </summary>
            <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto max-h-32 text-left">
              {error.stack}
            </pre>
          </details>
        )}

        {/* Recovery action */}
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button onClick={resetErrorBoundary} variant="default">
            Try again
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Reload page
          </Button>
        </div>

        {/* Help text */}
        <p className="text-xs text-muted-foreground mt-4 text-center">
          If this problem persists, please refresh the page or contact support.
        </p>
      </div>
    </div>
  );
}

/**
 * AppErrorBoundary - Application-wide error boundary wrapper
 *
 * Wraps the entire application to catch all React component errors.
 * Should be the outermost provider in the component tree.
 *
 * Features:
 * - Catches all React errors in component tree
 * - Logs errors to console
 * - Provides error recovery via reset or page reload
 * - Can be extended to send errors to reporting service (Sentry, etc.)
 *
 * @example
 * ```tsx
 * <AppErrorBoundary>
 *   <App />
 * </AppErrorBoundary>
 * ```
 */
export function AppErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        // Log error to console
        console.error("Error caught by boundary:", error, errorInfo);

        // TODO: Send to error reporting service (Sentry, LogRocket, etc.)
        // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
      }}
      onReset={() => {
        // Reset app state when user clicks "Try again"
        // This can be extended to clear specific app state (e.g., Redux store, query cache)
        console.info("Error boundary reset - attempting recovery");

        // For now, reload the page to ensure clean state
        // In production, you might want to reset specific state instead
        window.location.reload();
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
