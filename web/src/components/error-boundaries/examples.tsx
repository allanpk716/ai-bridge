/**
 * Error Boundary Usage Examples
 *
 * This file demonstrates how to use ErrorBoundary components throughout the app.
 * These are EXAMPLES showing proper integration patterns.
 */

import { WidgetErrorBoundary } from "./index";

/**
 * Example 1: Wrapping Session List
 *
 * Session list can fail independently without crashing the entire app.
 */
export function SessionListWithErrorBoundary() {
  return (
    <WidgetErrorBoundary
      onError={(error) => {
        console.error("Session list failed:", error);
        // Send to error tracking service
        // Sentry.captureException(error);
      }}
    >
      {/* <SessionList /> */}
      <div>Session List Component Here</div>
    </WidgetErrorBoundary>
  );
}

/**
 * Example 2: Wrapping Chat Messages
 *
 * Chat message rendering can fail (e.g., malformed markdown)
 * without affecting the rest of the UI.
 */
export function ChatMessagesWithErrorBoundary() {
  return (
    <WidgetErrorBoundary
      onError={(error) => {
        console.error("Chat messages failed:", error);
      }}
    >
      {/* <ChatMessageList messages={messages} /> */}
      <div>Chat Messages Component Here</div>
    </WidgetErrorBoundary>
  );
}

/**
 * Example 3: Wrapping Permission Cards
 *
 * Permission cards can fail independently.
 */
export function PermissionCardsWithErrorBoundary() {
  return (
    <WidgetErrorBoundary
      onError={(error) => {
        console.error("Permission cards failed:", error);
      }}
    >
      {/* <PermissionCards /> */}
      <div>Permission Cards Component Here</div>
    </WidgetErrorBoundary>
  );
}

/**
 * Example 4: Wrapping Command Palette
 *
 * Command palette can fail without breaking the app.
 */
export function CommandPaletteWithErrorBoundary() {
  return (
    <WidgetErrorBoundary
      onError={(error) => {
        console.error("Command palette failed:", error);
      }}
    >
      {/* <CommandPalette /> */}
      <div>Command Palette Component Here</div>
    </WidgetErrorBoundary>
  );
}

/**
 * Example 5: Multiple Error Boundaries in a Page
 *
 * Shows how to isolate different sections of a page.
 */
export function SessionDetailPageExample() {
  return (
    <div className="flex flex-col h-full">
      {/* Session metadata section */}
      <WidgetErrorBoundary>
        {/* <SessionMetadata session={session} /> */}
        <div>Session Metadata</div>
      </WidgetErrorBoundary>

      {/* Chat messages section */}
      <WidgetErrorBoundary>
        {/* <ChatMessageList messages={messages} /> */}
        <div>Chat Messages</div>
      </WidgetErrorBoundary>

      {/* Chat input section */}
      <WidgetErrorBoundary>
        {/* <ChatInput sessionId={id} /> */}
        <div>Chat Input</div>
      </WidgetErrorBoundary>
    </div>
  );
}

/**
 * Example 6: Error Boundary with Custom Fallback
 *
 * You can provide custom error UI for specific components.
 */
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";

function CustomChatFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
      <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
        消息加载失败
      </p>
      <Button size="sm" onClick={resetErrorBoundary}>
        重试
      </Button>
      {import.meta.env.DEV && (
        <pre className="mt-2 text-xs text-yellow-700 dark:text-yellow-300">
          {error.message}
        </pre>
      )}
    </div>
  );
}

export function ChatWithCustomFallback() {
  return (
    <ErrorBoundary FallbackComponent={CustomChatFallback}>
      {/* <ChatMessageList /> */}
      <div>Chat Messages</div>
    </ErrorBoundary>
  );
}
