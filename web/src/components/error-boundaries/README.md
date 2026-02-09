# Error Handling System

## Overview

The error handling system provides comprehensive error management with user-friendly messages and recovery options. It consists of:

1. **Global Error Boundary** - Catches all React rendering errors
2. **Component-Level Error Boundaries** - Isolates errors to specific widgets
3. **API Error Handler** - Converts technical errors to user-friendly messages
4. **Retry Hooks** - Automatic and manual retry functionality
5. **Network Status Detection** - Offline detection and user notification

## Architecture

```
AppErrorBoundary (Global)
├── QueryProvider (with smart retry)
│   ├── WidgetErrorBoundary (Session List)
│   ├── WidgetErrorBoundary (Chat Messages)
│   └── WidgetErrorBoundary (Permission Cards)
└── NetworkStatusError (Offline detection)
```

## Components

### 1. AppErrorBoundary

**Location:** `src/components/error-boundaries/AppErrorBoundary.tsx`

**Purpose:** Global error boundary that catches all React rendering errors.

**Features:**
- User-friendly Chinese error messages
- Development mode shows detailed error info
- Production mode shows generic message
- Retry and reload options
- Console logging (extensible to Sentry)

**Usage:**
```tsx
import { AppErrorBoundary } from "@/components/error-boundaries";

// In main.tsx
<AppErrorBoundary>
  <App />
</AppErrorBoundary>
```

### 2. WidgetErrorBoundary

**Location:** `src/components/error-boundaries/WidgetErrorBoundary.tsx`

**Purpose:** Component-level error boundary for isolating errors.

**Features:**
- Prevents component errors from crashing entire app
- Shows inline error UI with retry button
- Optional error callback for logging
- Development/production mode awareness

**Usage:**
```tsx
import { WidgetErrorBoundary } from "@/components/error-boundaries";

<WidgetErrorBoundary
  onError={(error) => {
    console.error("Component failed:", error);
    // Sentry.captureException(error);
  }}
>
  <SessionList />
</WidgetErrorBoundary>
```

### 3. API Error Handler

**Location:** `src/lib/api/errorHandler.ts`

**Purpose:** Converts technical errors to user-friendly Chinese messages.

**Classes:**
- `APIError` - Enhanced error with user-friendly message
- `NetworkError` - Network-specific error type

**Functions:**
- `handleAPIError(error)` - Converts any error to APIError
- `getStatusMessage(status)` - Maps HTTP status to message
- `isNetworkError(error)` - Checks if error is network-related
- `isRetryWorthy(status)` - Determines if error should be retried

**Usage:**
```tsx
import { handleAPIError } from "@/lib/api/errorHandler";

try {
  await fetchData();
} catch (error) {
  const apiError = handleAPIError(error);
  toast.error(apiError.message); // User-friendly Chinese message
}
```

### 4. Retry Hooks

**Location:** `src/hooks/useRetry.ts`

**Purpose:** Provides automatic and manual retry functionality.

**Hooks:**
- `useRetry(fn, options)` - Automatic retry with delay
- `useManualRetry(fn, options)` - Manual retry only

**Usage:**
```tsx
import { useRetry } from "@/hooks/useRetry";

const { retry, attempt, isLoading } = useRetry(
  async () => {
    await sendMessage(message);
  },
  { maxAttempts: 3, delay: 1000 }
);

// User clicks retry button
<button onClick={retry} disabled={isLoading}>
  重试
</button>
```

### 5. Network Status Error

**Location:** `src/components/NetworkStatusError.tsx`

**Purpose:** Detects and notifies user when network goes offline.

**Features:**
- Uses browser's `navigator.onLine` API
- Shows persistent toast notification when offline
- Auto-dismisses when back online
- Retry button to reload page

**Usage:**
```tsx
import { NetworkStatusError } from "@/components/NetworkStatusError";

// In App.tsx
<NetworkStatusError />
```

## Integration Points

### 1. Query Provider (TanStack Query)

**Location:** `src/providers/QueryProvider.tsx`

**Enhanced with:**
- Smart retry logic (network errors retry 3x, client errors no retry)
- User-friendly Chinese toast notifications
- Error type detection for retry decisions

**Configuration:**
```tsx
retry: (failureCount, error) => {
  // Network errors retry up to 3 times
  if (isNetworkError(error)) {
    return failureCount < 3;
  }

  // Retry-worthy status codes (408, 429, 500+)
  if ("status" in error) {
    return isRetryWorthy(error.status) && failureCount < 3;
  }

  // Don't retry other errors
  return false;
}
```

### 2. Message Sending (Optimistic Updates)

**Location:** `src/lib/api/messages.ts`

**Already implements:**
- Optimistic UI updates (message appears immediately)
- Rollback on error (message removed if send fails)
- Success invalidation (refetch to get server-confirmed message)

**Flow:**
1. User sends message
2. Message appears immediately with "sending" status
3. If error: message removed, toast shown
4. If success: SSE will deliver real message

### 3. Component Isolation

**Recommended components to wrap with WidgetErrorBoundary:**
- `SessionList` - Can fail if API is down
- `ChatMessageList` - Can fail on malformed markdown
- `PermissionCards` - Can fail if permission data is invalid
- `CommandPalette` - Can fail if command discovery fails
- `ExportPreviewModal` - Can fail on markdown rendering

## Error Messages (Chinese)

| HTTP Status | Message |
|-------------|---------|
| 0 (Network) | 网络连接失败,请检查您的网络 |
| 400 | 请求参数错误 |
| 401 | 未授权,请重新登录 |
| 403 | 没有权限访问 |
| 404 | 请求的资源不存在 |
| 408 | 请求超时,请稍后重试 |
| 422 | 请求数据验证失败 |
| 429 | 请求过于频繁,请稍后重试 |
| 500 | 服务器错误,请稍后重试 |
| 502 | 网关错误 |
| 503 | 服务暂时不可用 |
| Default | 发生了未知错误,请稍后重试 |

## Testing

### Manual Testing

1. **Test AppErrorBoundary:**
   - Throw error in component: `throw new Error("Test error")`
   - Verify error UI shows with retry button
   - Verify reload button works

2. **Test WidgetErrorBoundary:**
   - Throw error in wrapped component
   - Verify inline error UI shows
   - Verify rest of app still works

3. **Test API Error Handler:**
   - Disable backend server
   - Try fetching data
   - Verify "网络连接失败" message shows

4. **Test Network Status:**
   - Open DevTools → Network tab
   - Select "Offline" throttling
   - Verify "网络连接已断开" toast shows
   - Go back online
   - Verify toast dismisses

5. **Test Optimistic Updates:**
   - Send message
   - Verify message appears immediately
   - Simulate error (disconnect network)
   - Verify message rolls back with error toast

### Automated Testing (Future)

```tsx
// Example: Testing ErrorBoundary
import { render, screen } from '@testing-library/react';
import { AppErrorBoundary } from '@/components/error-boundaries';

function ThrowError() {
  throw new Error('Test error');
}

test('AppErrorBoundary catches errors', () => {
  render(
    <AppErrorBoundary>
      <ThrowError />
    </AppErrorBoundary>
  );

  expect(screen.getByText(/应用遇到了问题/)).toBeInTheDocument();
});
```

## Best Practices

1. **Always use WidgetErrorBoundary for:**
   - Data fetching components (API calls)
   - Complex rendering (markdown, syntax highlighting)
   - Third-party integrations

2. **Never use WidgetErrorBoundary for:**
   - Simple UI components (buttons, inputs)
   - Layout components (headers, footers)
   - Error boundaries themselves (avoid nesting)

3. **Error logging:**
   - Use `onError` callback for logging
   - Send to Sentry in production
   - Include user context (session ID, action)

4. **User messages:**
   - Always use Chinese for user-facing messages
   - Be specific about what went wrong
   - Provide actionable next steps (retry, reload)

5. **Development vs Production:**
   - Development: Show detailed error info
   - Production: Show generic messages
   - Never expose stack traces to users

## Extension Points

### Adding Sentry Integration

```tsx
// In AppErrorBoundary.tsx
import * as Sentry from "@sentry/react";

onError={(error) => {
  console.error("应用错误:", error);
  Sentry.captureException(error);
}}

// In WidgetErrorBoundary
<WidgetErrorBoundary
  onError={(error) => {
    console.error("组件错误:", error);
    Sentry.captureException(error);
  }}
>
```

### Custom Error Types

```tsx
// In errorHandler.ts
export class ValidationError extends APIError {
  constructor(field: string, message: string) {
    super(`${field}: ${message}`, 422);
    this.name = "ValidationError";
  }
}
```

### Custom Retry Strategies

```tsx
// In useRetry.ts
export function useExponentialRetry(fn, options) {
  // Custom exponential backoff logic
  const delay = Math.min(1000 * 2 ** attempt, 30000);
  // ...
}
```

## Related Files

- `src/providers/QueryProvider.tsx` - TanStack Query error handling
- `src/providers/ErrorBoundary.tsx` - Legacy error boundary (can be removed)
- `src/lib/api/client.ts` - API client with ApiError class
- `src/lib/api/messages.ts` - Optimistic update implementation
- `src/hooks/useChatMessages.ts` - Chat message state management
