---
phase: 02-backend-integration
plan: 03
subsystem: real-time-communication
tags: socket.io, websocket, typescript, react-hooks, singleton

# Dependency graph
requires:
  - phase: 01-foundation-ui-infrastructure
    provides: React 19.2 + Vite + TypeScript + path aliases
provides:
  - Socket.IO client singleton with typed events
  - Custom React hooks for WebSocket integration
  - Automatic reconnection with exponential backoff
  - Memory-leak-free event listener management
affects: [02-04-connection-state, 03-session-management, 04-real-time-chat]

# Tech tracking
tech-stack:
  added:
    - socket.io-client v4.8.3
  patterns:
    - ES6 module singleton (not class-based)
    - Generic TypeScript event types
    - React hooks with automatic cleanup
    - Provider initialization pattern

key-files:
  created:
    - web/src/types/socket.ts (event type definitions)
    - web/src/lib/socket/socket.ts (singleton manager)
    - web/src/lib/socket/events.ts (event type exports)
    - web/src/lib/socket/hooks.ts (React hooks)
    - web/src/providers/SocketProvider.tsx (provider)
  modified:
    - web/package.json (added socket.io-client)
    - web/src/main.tsx (added SocketProvider)

key-decisions:
  - "ES6 module singleton over class-based pattern (modern JavaScript best practice)"
  - "Auto-derive WebSocket URL from HTTP URL (no separate WS_URL env variable needed)"
  - "Generic event types for type-safe Socket.IO integration"

patterns-established:
  - "Pattern 1: ES6 module singleton ensures single Socket.IO instance"
  - "Pattern 2: Generic TypeScript types for Socket.IO event safety"
  - "Pattern 3: React hooks with useEffect cleanup prevent memory leaks"

# Metrics
duration: 12min
completed: 2026-02-07
---

# Phase 2 Plan 3: Socket.IO Client Infrastructure Summary

**Socket.IO singleton with typed events, exponential backoff reconnection (10 attempts, 1s-30s delays), and React hooks with automatic cleanup**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-07T11:34:25Z
- **Completed:** 2026-02-07T11:46:15Z
- **Tasks:** 4
- **Files modified:** 7

## Accomplishments

- **Socket.IO client infrastructure complete**: Installed socket.io-client v4.8.3, created singleton manager with auto-derived WebSocket URL
- **Type-safe event handling**: Defined ServerToClientEvents (message, session:status, permission:request) and ClientToServerEvents (subscribe, unsubscribe) interfaces
- **React integration**: Created useSocket and useSocketEvent hooks with automatic cleanup to prevent memory leaks
- **Provider initialization**: SocketProvider initializes connection on app startup, integrated into main.tsx provider chain

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Socket.IO client and create event type definitions** - `dcd6d00` (feat)
2. **Task 2: Create Socket.IO singleton manager** - `bfe4966` (feat)
3. **Task 3: Create custom React hooks for Socket.IO** - `b7756e6` (feat)
4. **Task 4: Create SocketProvider and integrate into application** - `aa4d2d0` (feat)

## Files Created/Modified

- `web/package.json` - Added socket.io-client v4.8.3 dependency
- `web/src/types/socket.ts` - Type-safe event definitions (ServerToClientEvents, ClientToServerEvents, Message, Permission)
- `web/src/lib/socket/events.ts` - Event type re-exports for clean imports
- `web/src/lib/socket/socket.ts` - ES6 module singleton with initSocket, getSocket, connectSocket, disconnectSocket
- `web/src/lib/socket/hooks.ts` - React hooks (useSocket, useSocketEvent) with automatic cleanup
- `web/src/providers/SocketProvider.tsx` - Provider component for Socket.IO initialization on app startup
- `web/src/main.tsx` - Updated provider chain: StrictMode > QueryProvider > SocketProvider > ThemeProvider

## Socket.IO Configuration Details

**Connection Settings:**
- Auto-derive WebSocket URL from HTTP URL (http://localhost:8080 → ws://localhost:8080)
- Auto-connect on app startup (via SocketProvider useEffect)
- Manual connection control (autoConnect: false, connectSocket() called after init)

**Reconnection Strategy:**
- 10 reconnection attempts with exponential backoff
- Initial delay: 1 second
- Max delay: 30 seconds between attempts
- Initial connection timeout: 3 seconds

**Event Types:**

Server-to-client events:
- `message` - Real-time message updates (sessionId, message)
- `session:status` - Session status changes (sessionId, status)
- `permission:request` - Permission request notifications (sessionId, permission)
- `connect` - Socket.IO built-in connection event
- `disconnect` - Socket.IO built-in disconnect event (with reason)
- `error` - Socket.IO built-in error event

Client-to-server events:
- `subscribe` - Subscribe to session updates (sessionId)
- `unsubscribe` - Unsubscribe from session (sessionId)

## Singleton Pattern Explanation

**ES6 Module Pattern (not class-based):**
- Module-level variable `socket` holds the single instance
- `initSocket()` creates socket if not exists or disconnected, returns existing if connected
- `getSocket()` throws error if not initialized (ensures proper initialization order)
- `connectSocket()` and `disconnectSocket()` provide connection lifecycle control

**Why ES6 module over class:**
- Modern JavaScript best practice (ES6 modules are naturally singleton)
- Simpler API (functions vs class instance methods)
- Better tree-shaking (named exports)
- No need for getInstance() pattern

## Provider Nesting Order

```
StrictMode (React built-in)
  └─ QueryProvider (TanStack Query from 02-01)
      └─ SocketProvider (NEW - WebSocket initialization)
          └─ ThemeProvider (shadcn/ui theming)
              └─ RouterProvider (React Router)
```

**Rationale:**
- QueryProvider outermost: API state management foundation
- SocketProvider middle: Initializes WebSocket, independent of theme/routing
- ThemeProvider before Router: Theme context available to all route components

## Memory Leak Prevention Strategy

**All event listeners have cleanup functions:**

1. **useSocket hook:**
   - Subscribes to connect/disconnect events
   - Cleanup removes both listeners on unmount

2. **useSocketEvent hook:**
   - Generic event listener for any ServerToClientEvents
   - Cleanup removes specific event listener on unmount or callback change

3. **SocketProvider:**
   - Initializes socket on mount
   - Cleanup disconnects socket on provider unmount

**No accumulated listeners:**
- Every useEffect returns cleanup function
- socket.off() called for every socket.on()
- No orphaned event listeners after component unmount

## Decisions Made

None - followed plan exactly as specified.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed without errors. TypeScript compilation passed with no errors.

## User Setup Required

None - no external service configuration required. Socket.IO client auto-connects to backend URL from environment variable or default (localhost:8080).

## Next Phase Readiness

**Ready for Plan 02-04 (Connection State Management):**
- Socket.IO singleton infrastructure complete
- React hooks available for connection state tracking
- Provider initialized on app startup

**Next steps:**
- Implement Zustand store for connection state management
- Create connection status indicator component (status badge + tooltip)
- Add connection failure modal with retry/offline options
- Implement toast notifications for connection events

**Blockers/Concerns:**
- None - Socket.IO infrastructure complete and ready for state management layer

---
*Phase: 02-backend-integration*
*Plan: 03*
*Completed: 2026-02-07*
