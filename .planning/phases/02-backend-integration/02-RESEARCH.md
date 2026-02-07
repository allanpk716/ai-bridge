# Phase 2: Backend Integration - Research

**Researched:** 2026-02-07
**Domain:** Frontend-backend communication layer with REST API and WebSocket real-time events
**Confidence:** HIGH

## Summary

Phase 02 focuses on establishing a secure, performant communication layer between the React 19.2 frontend and the AI-Bridge Go backend. This phase implements **TanStack Query v5** for REST API management with automatic caching, retries, and background updates, plus **Socket.IO client** for real-time bidirectional events. The implementation prioritizes **type safety** with Zod validation, **connection resilience** with exponential backoff reconnection, and **user feedback** through toast notifications and status indicators.

**Primary recommendation:** Use TanStack Query for all REST API calls (no manual fetch/axios), Zustand for connection state management, and Socket.IO singleton pattern for WebSocket. These technologies integrate seamlessly with React 19, Vite, and shadcn/ui already present in the project.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **@tanstack/react-query** | v5.71+ | Async server state management | Industry standard for REST API caching, deduplication, background updates; superior to useEffect+fetch patterns |
| **socket.io-client** | v4.x | WebSocket real-time events | Official Socket.IO client with built-in reconnection, automatic fallback to polling, TypeScript support |
| **zod** | v3.24+ | Runtime schema validation | TypeScript-first validation with automatic type inference; ensures API responses match expectations |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **zustand** | v5.x | Global connection state | For managing Socket.IO connection status (online/offline/reconnecting); simpler than Redux, more performant than Context |
| **sonner** | latest | Toast notifications | shadcn/ui recommended toast library; provides success/error/info toasts with minimal boilerplate |
| **react-error-boundary** | v4.x | Error boundary component | Modern React error boundary library with hooks API; easier than class-based boundaries |
| **@types/node** | v20.x | TypeScript ambient types | Required for `import.meta.env` type definitions in Vite |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TanStack Query | SWR, RTK Query, custom fetch | TanStack Query has best TypeScript support, React 19 compatibility, and largest ecosystem. SWR is simpler but less powerful. RTK Query is Redux-ecosystem locked. |
| Zustand | React Context, Redux Toolkit, Jotai | Context causes unnecessary re-renders for connection status (updates frequently). Redux Toolkit is overkill for single boolean state. Jotai is atomic but more complex than needed. Zustand is minimal (1KB) and performant. |
| Socket.IO client | raw WebSocket, SockJS | Socket.IO provides automatic reconnection, room management, and fallback to HTTP long-polling. Raw WebSocket requires manual reconnection logic. SockJS lacks TypeScript support. |
| Zod | Yup, Joi, io-ts | Zod has best TypeScript type inference (zero duplication). Yup has less precise types. Joi has no type inference. io-ts is more complex FP-style API. |

**Installation:**
```bash
npm install @tanstack/react-query socket.io-client zod zustand sonner react-error-boundary
npm install -D @types/node
```

**Additional shadcn/ui components needed:**
```bash
npx shadcn@latest add sonner tooltip
# Note: sonner is a standalone component, not part of radix-ui
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── api/                 # API service layer
│   │   ├── client.ts        # Axios/fetch client configuration
│   │   ├── sessions.ts      # Session endpoints
│   │   ├── messages.ts      # Message endpoints with pagination
│   │   ├── permissions.ts   # Permission approval endpoints
│   │   └── commands.ts      # Slash command endpoints
│   ├── socket/              # Socket.IO singleton manager
│   │   ├── socket.ts        # Socket.IO client singleton
│   │   ├── events.ts        # Typed event definitions
│   │   └── hooks.ts         # Custom hooks for socket usage
│   └── stores/              # Global state (Zustand)
│       └── connection.ts    # Connection status store
├── components/
│   ├── connection/          # Connection status UI
│   │   ├── StatusIndicator.tsx  # Badge with color + tooltip
│   │   └── ConnectionDialog.tsx  # Modal for connection failure
│   └── providers/
│       ├── QueryProvider.tsx     # TanStack Query setup
│       └── SocketProvider.tsx    # Socket.IO initialization
├── hooks/
│   ├── useApi.ts            # Custom hooks for API calls
│   └── useConnection.ts     # Connection status hooks
└── types/
    ├── api.ts               # API response types (from Zod)
    ├── socket.ts            # Socket event types
    └── config.ts            # Environment variable types
```

### Pattern 1: TanStack Query Default Configuration

**What:** Centralized QueryClient with retry strategy, error callbacks, and cache management
**When to use:** Application initialization in main.tsx or dedicated provider
**Example:**
```typescript
// src/lib/api/client.ts
import { QueryClient, QueryCache } from '@tanstack/react-query'
import { toast } from 'sonner'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // 5 minutes
      gcTime: 1000 * 60 * 30,          // 30 minutes (was cacheTime)
      retry: 3,                        // Retry failed requests 3 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,     // Don't refetch on window focus
      refetchOnReconnect: true,        // Refetch when reconnecting
      networkMode: 'onlineFirst',      // Require network for requests
    },
    mutations: {
      retry: 0,                        // Don't retry mutations by default
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      // Global error handler for all queries
      toast.error(`Request failed: ${(error as Error).message}`)
    },
  }),
})

// Source: Context7 /tanstack/query
```

### Pattern 2: API Service Layer with Zod Validation

**What:** Service functions per resource with Zod schema validation
**When to use:** All API endpoint calls; separates data fetching from UI
**Example:**
```typescript
// src/lib/api/sessions.ts
import { z } from 'zod'
import { queryClient } from './client'
import { useQuery, useMutation } from '@tanstack/react-query'

// Zod schema for type safety
export const SessionSchema = z.object({
  id: z.string(),
  status: z.enum(['active', 'idle', 'error']),
  createdAt: z.string(),
  metadata: z.record(z.unknown()).optional(),
})

export type Session = z.infer<typeof SessionSchema>

export const SessionListSchema = z.array(SessionSchema)

// Service function
export async function fetchSessions(): Promise<Session[]> {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
  const response = await fetch(`${API_URL}/api/v1/sessions`)

  if (!response.ok) {
    throw new Error(`Failed to fetch sessions: ${response.statusText}`)
  }

  const data = await response.json()
  return SessionListSchema.parse(data) // Runtime validation + type inference
}

// React hook
export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
  })
}

// Mutation with invalidation
export function useCreateSession() {
  const queryClient = queryClient // Get client instance

  return useMutation({
    mutationFn: async (data: { workingDir: string }) => {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
      const response = await fetch(`${API_URL}/api/v1/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to create session')
      return SessionSchema.parse(await response.json())
    },
    onSuccess: () => {
      // Invalidate and refetch sessions list
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Session created successfully')
    },
    onError: (error) => {
      toast.error(`Failed to create session: ${error.message}`)
    },
  })
}

// Source: Context7 /tanstack/query + /websites/zod_dev
```

### Pattern 3: Socket.IO Singleton with Typed Events

**What:** ES6 module singleton (not class) to ensure single Socket.IO instance
**When to use:** Real-time bidirectional communication; connection lifecycle management
**Example:**
```typescript
// src/lib/socket/socket.ts
import { io, Socket } from 'socket.io-client'

// Define event types for type safety
export type ServerToClientEvents = {
  message: (data: { sessionId: string; message: string }) => void
  'session:status': (data: { sessionId: string; status: string }) => void
}

export type ClientToServerEvents = {
  subscribe: (sessionId: string) => void
  unsubscribe: (sessionId: string) => void
}

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null

export function initSocket(url: string) {
  if (socket?.connected) return socket

  // Auto-derive WebSocket URL from HTTP URL
  const wsUrl = url.replace(/^http/, 'ws')

  socket = io(wsUrl, {
    autoConnect: false, // Connect manually after setup
    reconnection: true,
    reconnectionDelay: 1000,        // Start with 1 second
    reconnectionDelayMax: 30000,    // Max 30 seconds between attempts
    reconnectionAttempts: 10,       // Stop after 10 attempts
    timeout: 3000,                  // Initial connection timeout (3 seconds)
  })

  return socket
}

export function getSocket() {
  if (!socket) {
    throw new Error('Socket not initialized. Call initSocket() first.')
  }
  return socket
}

export function connectSocket() {
  const socket = getSocket()
  if (!socket.connected) {
    socket.connect()
  }
}

export function disconnectSocket() {
  const socket = getSocket()
  socket.disconnect()
}

// Source: Context7 /websites/socket_io_v4_client-api + Dev.to research
```

**Custom hooks for Socket.IO:**
```typescript
// src/lib/socket/hooks.ts
import { useEffect, useState } from 'react'
import { getSocket, type ServerToClientEvents } from './socket'

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socket = getSocket()

    function onConnect() {
      setIsConnected(true)
    }

    function onDisconnect() {
      setIsConnected(false)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [])

  return { isConnected, socket: getSocket() }
}

// Generic event listener hook
export function useSocketEvent<K extends keyof ServerToClientEvents>(
  event: K,
  callback: ServerToClientEvents[K]
) {
  const { socket } = useSocket()

  useEffect(() => {
    socket.on(event, callback)
    return () => {
      socket.off(event, callback)
    }
  }, [event, callback])
}
```

### Pattern 4: Zustand Store for Connection State

**What:** Minimal global state for connection status (online/offline/reconnecting)
**When to use:** State that updates frequently (connection status) and needs app-wide access
**Example:**
```typescript
// src/lib/stores/connection.ts
import { create } from 'zustand'

export type ConnectionStatus = 'online' | 'offline' | 'reconnecting' | 'error'

interface ConnectionStore {
  status: ConnectionStatus
  setStatus: (status: ConnectionStatus) => void
  reset: () => void
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  status: 'offline',
  setStatus: (status) => set({ status }),
  reset: () => set({ status: 'offline' }),
}))

// Usage in components
function StatusIndicator() {
  const status = useConnectionStore((state) => state.status)

  return (
    <div className={`status-dot status-${status}`}>
      {status === 'online' && <span>Connected</span>}
      {status === 'offline' && <span>Offline</span>}
      {status === 'reconnecting' && <span>Reconnecting...</span>}
      {status === 'error' && <span>Connection Error</span>}
    </div>
  )
}

// Source: 2026 state management research (Zustand best for frequently-updated global state)
```

**Why Zustand over React Context:**
- Context causes all consuming components to re-render on any state change
- Zustand uses selector-based subscriptions (only components using specific state update)
- Zero boilerplate (no providers, actions, reducers)
- 1KB bundle size vs Redux Toolkit's ~10KB
- Perfect for connection status (single value, updates frequently)

### Pattern 5: Environment Variables in Vite

**What:** Type-safe environment variable configuration
**When to use:** API URLs, feature flags, environment-specific settings
**Example:**
```typescript
// vite-env.d.ts (already in project)
interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  // Add other env vars here
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// src/lib/config.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  apiBasePath: '/api/v1',
  wsUrl: (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/^http/, 'ws'),
}

// Usage
const response = await fetch(`${config.apiUrl}${config.apiBasePath}/sessions`)

// Source: Vite documentation + multiple Medium articles on Vite env variables
```

**Environment files (create these):**
```bash
# .env.local (gitignored - for local development)
VITE_API_URL=http://localhost:8080

# .env.production (for production builds)
VITE_API_URL=https://api.production.com
```

### Anti-Patterns to Avoid

- **Anti-pattern:** Calling `useQuery` directly in components without service layer
  - **Why:** Mixes data fetching with UI, hard to test, duplicates fetch logic
  - **Do instead:** Create service functions in `src/lib/api/`, then call in hooks

- **Anti-pattern:** Creating multiple Socket.IO instances
  - **Why:** Multiple connections waste resources, cause race conditions
  - **Do instead:** Use ES6 module singleton (export single `socket` instance)

- **Anti-pattern:** Storing connection status in React Context
  - **Why:** All consumers re-render on every status change (happens frequently)
  - **Do instead:** Use Zustand for frequently-updated global state

- **Anti-pattern:** Manual fetch with useEffect for API calls
  - **Why:** No caching, no deduplication, no retry logic, race conditions
  - **Do instead:** Use TanStack Query for all server state

- **Anti-pattern:** Using class-based Error Boundaries
  - **Why:** Verbose, requires lifecycle methods, harder to test
  - **Do instead:** Use `react-error-boundary` library with hooks API

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| API request caching | Custom useEffect + useState + localStorage | TanStack Query | Cache invalidation, background refetch, retry logic, deduplication (handling all these correctly requires 1000+ lines) |
| Socket reconnection | Manual setTimeout + reconnect counter | Socket.IO built-in reconnection | Exponential backoff, transport fallback (polling), packet buffering, authentication handling |
| Type validation | Manual if-checks + typeof guards | Zod schemas | Runtime validation + TypeScript type inference in one, composable schemas, error messages |
| Toast notifications | Custom Portal + CSS animations | Sonner (via shadcn/ui) | Auto-positioning, stacking, accessibility, promise handling, action buttons |
| Global state | React Context + useState | Zustand | Selector-based re-renders (no unnecessary updates), devtools, no providers needed |
| Error boundaries | Class component with componentDidCatch | react-error-boundary | Fallback variants, reset mechanisms, error logging hooks, test utilities |

**Key insight:** Each of these problems appears trivial ("just a few lines of code") but production use reveals edge cases: race conditions in cache invalidation, memory leaks in event listeners, accessibility in toasts, re-render performance in state management. Battle-tested libraries have solved these over years of real-world usage.

## Common Pitfalls

### Pitfall 1: TanStack Query Callback Confusion
**What goes wrong:** Using `onError`/`onSuccess` in `useQuery` (removed in v5), causing TypeScript errors
**Why it happens:** TanStack Query v5 removed these callbacks from `useQuery` to prevent misuse
**How to avoid:** Use global `QueryCache` callbacks for logging, handle `error` state in components for UI
**Warning signs:** TypeScript errors on `onError` prop in `useQuery`
```typescript
// ❌ WRONG (v5 removed this)
const { data } = useQuery({
  queryKey: ['sessions'],
  queryFn: fetchSessions,
  onError: (error) => toast.error(error.message), // TypeScript error
})

// ✅ CORRECT (handle in component)
const { data, error } = useQuery({
  queryKey: ['sessions'],
  queryFn: fetchSessions,
})

if (error) {
  toast.error(error.message)
}

// ✅ CORRECT (global logging in QueryClient)
queryCache: new QueryCache({
  onError: (error) => console.error('Query failed:', error),
})
```

### Pitfall 2: Socket.IO Event Listener Memory Leaks
**What goes wrong:** Event listeners accumulate, causing memory leaks and duplicate handlers
**Why it happens:** Calling `socket.on()` in useEffect without cleanup or calling multiple times
**How to avoid:** Always return cleanup function that calls `socket.off()`
**Warning signs:** Same event triggering multiple times, increasing memory usage over time
```typescript
// ❌ WRONG (no cleanup)
useEffect(() => {
  socket.on('message', handleMessage)
}, [])

// ✅ CORRECT (cleanup on unmount)
useEffect(() => {
  socket.on('message', handleMessage)
  return () => {
    socket.off('message', handleMessage)
  }
}, [])
```

### Pitfall 3: Zod Schema Mismatch with Backend
**What goes wrong:** Runtime validation errors, "ZodError: Invalid" in console
**Why it happens:** Frontend schema doesn't match backend response structure
**How to avoid:** Keep Zod schemas in sync with backend types, use `.partial()` for optional fields
**Warning signs:** All API calls failing validation, TypeScript types not matching runtime data
```typescript
// Backend returns: { id: string, status: string, createdAt: string }
// Frontend expects: { id: string, status: 'active' | 'idle', createdAt: string }

// ❌ WRONG (too strict)
const schema = z.object({
  status: z.enum(['active', 'idle']), // Fails if backend returns other values
})

// ✅ CORRECT (flexible validation)
const schema = z.object({
  status: z.string(), // Validate it's a string, narrow type later
}).transform((data) => ({
  ...data,
  status: data.status as 'active' | 'idle', // Type assertion after validation
}))
```

### Pitfall 4: Environment Variables Not Loading
**What goes wrong:** `import.meta.env.VITE_API_URL` is undefined, defaults to localhost
**Why it happens:** Variable name missing `VITE_` prefix or not in `.env.local` (Vite ignores `.env`)
**How to avoid:** Always use `VITE_` prefix, create `.env.local`, restart dev server after changes
**Warning signs:** API calls to wrong URL, CORS errors, connection refused

### Pitfall 5: Query Invalidation Race Conditions
**What goes wrong:** UI shows stale data after mutation, old data briefly flashes
**Why it happens:** Mutation `onSuccess` runs before invalidation completes
**How to avoid:** Use `await` with `invalidateQueries` or rely on automatic refetch
**Warning signs:** User sees brief flash of old data after create/update/delete
```typescript
// ❌ WRONG (no await)
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['sessions'] })
  toast.success('Created') // Toast shows but data not refetched yet
}

// ✅ CORRECT (wait for refetch)
onSuccess: async () => {
  await queryClient.invalidateQueries({ queryKey: ['sessions'] })
  toast.success('Created') // Only shows after data is fresh
}
```

## Code Examples

Verified patterns from official sources:

### TanStack Query with Pagination
```typescript
// Source: Context7 /tanstack/query
export function useMessages(sessionId: string, options?: { since?: number; limit?: number }) {
  return useQuery({
    queryKey: ['messages', sessionId, options],
    queryFn: () => fetchMessages(sessionId, options),
    enabled: !!sessionId, // Only fetch when sessionId exists
  })
}

// Infinite scroll (for future use)
import { useInfiniteQuery } from '@tanstack/react-query'

export function useInfiniteMessages(sessionId: string) {
  return useInfiniteQuery({
    queryKey: ['messages', sessionId, 'infinite'],
    queryFn: ({ pageParam = 0 }) =>
      fetchMessages(sessionId, { limit: 50, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < 50) return undefined // No more pages
      return lastPage[lastPage.length - 1].seq // Use last message seq
    },
  })
}
```

### Socket.IO Connection Status Tracking
```typescript
// Source: /websites/socket_io_v4_client-api
import { getSocket } from './socket'
import { useConnectionStore } from '@/lib/stores/connection'

export function initConnectionManager() {
  const socket = getSocket()
  const setStatus = useConnectionStore.getState().setStatus

  socket.io.on('reconnect', (attemptNumber) => {
    console.log(`Reconnected after ${attemptNumber} attempts`)
    setStatus('online')
    toast.success('Reconnected to server')
  })

  socket.io.on('reconnect_attempt', (attemptNumber) => {
    setStatus('reconnecting')
    console.log(`Reconnection attempt ${attemptNumber}`)
  })

  socket.io.on('reconnect_failed', () => {
    setStatus('error')
    toast.error('Connection failed. Please check your network.')
  })

  socket.io.on('error', (error) => {
    console.error('Socket error:', error)
    setStatus('error')
  })
}
```

### Error Boundary with Fallback UI
```typescript
// Source: react-error-boundary npm documentation
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert" className="p-4 bg-destructive/10 rounded-lg">
      <h2 className="text-lg font-semibold text-destructive">Something went wrong</h2>
      <pre className="mt-2 text-sm">{error.message}</pre>
      <button
        onClick={resetErrorBoundary}
        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded"
      >
        Try again
      </button>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error) => console.error('Error caught by boundary:', error)}
      onReset={() => {
        // Reset app state if needed
        window.location.reload()
      }}
    >
      <QueryProvider>
        <SocketProvider>
          <RootLayout />
        </SocketProvider>
      </QueryProvider>
    </ErrorBoundary>
  )
}
```

### Toast Notifications with Sonner
```typescript
// Source: shadcn/ui Sonner documentation
import { toast } from 'sonner'

// Basic toast
toast('Event has been created')

// With types
toast.success('Changes saved successfully')
toast.error('Failed to save changes')
toast.info('New message received')
toast.warning('Connection unstable')

// With description and action
toast('Session created', {
  description: 'You can start chatting now',
  action: {
    label: 'View',
    onClick: () => router.push(`/sessions/${id}`),
  },
})

// Promise handling (auto-loading/success/error)
toast.promise(createSession(data), {
  loading: 'Creating session...',
  success: 'Session created',
  error: 'Failed to create session',
})
```

### Connection Status Indicator (shadcn/ui Badge)
```typescript
// Source: shadcn/ui Badge component + Custom state management
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useConnectionStore } from '@/lib/stores/connection'

export function ConnectionStatusIndicator() {
  const status = useConnectionStore((state) => state.status)

  const statusConfig = {
    online: { color: 'bg-green-500', label: 'Online', description: 'Connected to backend' },
    offline: { color: 'bg-gray-500', label: 'Offline', description: 'Not connected' },
    reconnecting: {
      color: 'bg-yellow-500 animate-pulse',
      label: 'Reconnecting',
      description: 'Attempting to reconnect...',
    },
    error: { color: 'bg-red-500', label: 'Error', description: 'Connection failed' },
  }

  const config = statusConfig[status]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${config.color}`} />
            <span className="text-sm text-muted-foreground">{config.label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| useEffect + fetch for API | TanStack Query | 2019+ | Automatic caching, deduplication, retries |
| Class-based Error Boundaries | react-error-boundary library | 2021+ | Hooks API, easier testing, better DX |
| Redux for state management | Zustand (for simple global state) | 2020+ | 10x smaller bundle, zero boilerplate |
| Manual WebSocket handling | Socket.IO | 2014+ | Auto-reconnection, fallback to polling |
| onSuccess/onError in useQuery | Global QueryCache callbacks | 2023 (v5) | Clearer separation of concerns |

**Deprecated/outdated:**
- **onSuccess/onError in useQuery**: Removed in TanStack Query v5, causes confusion about when callbacks run
- **Class-based Error Boundaries**: Still valid but verbose; prefer react-error-boundary library
- **Context API for frequently-updating state**: Causes performance issues due to unnecessary re-renders; use Zustand instead
- **fetch + useEffect for server state**: Misses caching, deduplication, retries; TanStack Query is standard in 2026

## Open Questions

1. **SSE vs Socket.IO for real-time updates**
   - **What we know:** Backend supports both SSE stream (`GET /messages/stream`) and Socket.IO WebSocket
   - **What's unclear:** Which to use as primary real-time mechanism
   - **Recommendation:** Use Socket.IO for bidirectional events (commands, permissions), SSE for unidirectional message streaming. This matches HAPI architecture where SSE handles incremental message sync and Socket.IO handles control events. Test both in Phase 02, measure performance, decide based on actual usage patterns.

2. **Error reporting scope**
   - **What we know:** Global QueryCache onError callback can log all query errors
   - **What's unclear:** Should all errors be reported (noisy) or only certain types (filtering needed)?
   - **Recommendation:** Implement error categorization in Phase 02:
     - Network errors → Log + toast
     - Validation errors → Toast only
     - 4xx errors → Toast with user-friendly message
     - 5xx errors → Log + generic error toast
     - Evaluate noise level after 1 week of usage, adjust filtering.

3. **Connection retry UX**
   - **What we know:** Socket.IO will auto-retry with exponential backoff (10 attempts max)
   - **What's unclear:** Should user be able to cancel retries? Force immediate retry?
   - **Recommendation:** Implement as per CONTEXT.md decisions (10 max attempts, then show "connection failed" toast with retry button). Defer advanced retry controls until user feedback indicates need. Most users prefer automatic retries with final error notification over manual retry management.

## Sources

### Primary (HIGH confidence)
- **/tanstack/query** - QueryClient setup, default options, useQuery/useMutation hooks, pagination patterns, error handling, cache configuration
- **/websites/socket_io_v4_client-api** - Socket.IO client initialization, reconnection configuration, event handling, TypeScript types, Manager API
- **/websites/zod_dev** - Schema definition, type inference, runtime validation, parsing, error handling
- **Vite official documentation** (via WebFetch) - Environment variables with VITE_ prefix, import.meta.env usage
- **React Error Boundaries** (reactjs.org via WebFetch) - Error boundary lifecycle methods, componentDidCatch, getDerivedStateFromError

### Secondary (MEDIUM confidence)
- **Multiple 2026 articles on state management** (verified against official docs) - Zustand vs Redux vs Context comparison, decision framework for React 19
- **Axios vs Fetch guides** (verified against TanStack Query patterns) - Service layer organization, API client structure
- **Shadcn/ui Sonner documentation** (official website) - Toast notification patterns, configuration, TypeScript support
- **react-error-boundary npm package** - Error boundary component API, FallbackProps, resetErrorBoundary

### Tertiary (LOW confidence)
- **Medium/dev.to articles on project structure** - Folder organization patterns (feature-based vs type-based), should be validated against team preferences
- **Socket.IO singleton pattern examples** - Multiple approaches (class-based vs ES6 module), validated against official recommendations (ES6 module preferred)
- **GitHub StackOverflow discussions** - Edge cases and gotchas, cross-referenced with official docs

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** - All libraries are industry standards with official Context7 documentation
- Architecture: **HIGH** - Patterns verified against official docs and 2026 best practices
- Pitfalls: **HIGH** - All pitfalls documented in official sources or common issue trackers
- Project structure: **MEDIUM** - Based on 2026 articles, should be validated against team preferences

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (30 days - TanStack Query and Socket.IO are stable, but React 19 ecosystem is evolving)

**Key researcher decisions:**
- **Zustand over Context**: Confirmed via multiple 2026 articles that Context causes performance issues for frequently-updating state
- **ES6 module over class singleton**: Validated against modern JavaScript best practices (Dev.to 2024)
- **Global QueryCache over per-query onError**: Verified in TanStack Query v5 breaking changes documentation
- **Sonner over other toast libraries**: shadcn/ui official recommendation, integrates with existing component system
