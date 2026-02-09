/**
 * AppErrorBoundary - Global application error boundary
 *
 * Catches all React rendering errors and provides user-friendly recovery options.
 * Replaces the existing ErrorBoundary with enhanced features.
 */

import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * ErrorFallback - Fallback UI for global errors
 */
function AppErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const errorMessage = error instanceof Error ? error.message : "未知错误";
  const errorStack = error instanceof Error ? error.stack : null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="max-w-md w-full mx-4 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">应用遇到了问题</h1>
        <p className="text-muted-foreground mb-6">
          {import.meta.env.DEV
            ? errorMessage
            : "抱歉,应用遇到了意外错误。请尝试刷新页面或重新加载。"}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={resetErrorBoundary} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            重试
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
          >
            刷新页面
          </Button>
        </div>
        {import.meta.env.DEV && errorStack && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground">
              查看错误详情
            </summary>
            <pre className="mt-2 p-4 bg-muted rounded text-xs overflow-auto">
              {errorStack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

/**
 * AppErrorBoundary - Global error boundary wrapper
 *
 * Provides enhanced error handling with:
 * - User-friendly error messages (Chinese)
 * - Development mode shows detailed error info
 * - Production mode shows generic message
 * - Retry and reload options
 * - Console logging (can be extended to Sentry)
 */
export function AppErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary
      FallbackComponent={AppErrorFallback}
      onError={(error) => {
        console.error("应用错误:", error);
        // 可选:发送到错误监控服务(如Sentry)
        // Sentry.captureException(error);
      }}
      onReset={() => {
        // 清除缓存、重置状态
        window.location.reload();
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
