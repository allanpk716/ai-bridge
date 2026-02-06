# Architecture Research

**Domain:** React PWA with Real-Time Communication
**Researched:** 2026-02-06
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Pages      │  │   Layouts    │  │  Features    │          │
│  │  (Routes)    │  │ (App Shell)  │  │ (Business)   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
├─────────┼─────────────────┼──────────────────┼───────────────────┤
│         │         ┌───────┴────────┐         │                   │
│         │         │  UI Components│         │                   │
│         │         │  (shadcn/ui)  │         │                   │
│         │         └───────────────┘         │                   │
├─────────┴───────────────────────────────────┴───────────────────┤
│                        State Management Layer                    │
│  ┌──────────────────┐          ┌──────────────────┐             │
│  │  TanStack Query  │          │    Zustand       │             │
│  │  (Server State)  │          │  (Client State)  │             │
│  └────────┬─────────┘          └────────┬─────────┘             │
│           │                             │                        │
├───────────┴─────────────┬───────────────┴───────────────────────┤
│                       │ Real-Time Layer     │                      │
│                       │ (Socket.IO Client)  │                      │
│                       └────────────────────┘                      │
├─────────────────────────────────────────────────────────────────┤
│                        Data Layer                                │
│  ┌──────────────────┐          ┌──────────────────┐             │
│  │   API Services   │          │  Socket Manager  │             │
│  │  (REST Calls)    │          │  (WebSocket)     │             │
│  └────────┬─────────┘          └────────┬─────────┘             │
├───────────┴─────────────────────────────┴───────────────────────┤
│                        Backend Integration                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              AI-Bridge Backend (Go + Gin)                 │   │
│  │  REST API + Socket.IO Server (HAPI-compatible)          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Pages** | Route-level components, define URL structure | File-based routing (React Router) |
| **Layouts** | App shell, navigation, persistent UI | Shell components with Outlet |
| **Features** | Business logic, domain-specific functionality | Feature modules with co-located code |
| **UI Components** | Reusable presentational elements | shadcn/ui primitives |
| **API Services** | HTTP client abstraction, request/response transformation | Axios/fetch wrappers |
| **Socket Manager** | WebSocket connection lifecycle, event handling | Socket.IO client singleton |
| **TanStack Query** | Server state caching, synchronization, mutations | React Query hooks |
| **Zustand Store** | Client-side UI state, preferences, modal states | Small store slices |

## Recommended Project Structure

```
src/
├── assets/                    # Static assets (images, fonts, icons)
│   ├── images/
│   ├── fonts/
│   └── icons/
│
├── components/                # Shared UI components
│   ├── ui/                    # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   └── layout/                # Layout components
│       ├── app-shell.tsx      # Main app wrapper
│       ├── sidebar.tsx
│       └── header.tsx
│
├── features/                  # Feature-based modules (CORE)
│   ├── auth/                  # Authentication feature
│   │   ├── components/        # Auth-specific components
│   │   │   ├── login-form.tsx
│   │   │   └── logout-button.tsx
│   │   ├── hooks/             # Auth custom hooks
│   │   │   └── use-auth.ts
│   │   ├── api/               # Auth API calls
│   │   │   └── auth-api.ts
│   │   ├── types/             # TypeScript types
│   │   │   └── auth.types.ts
│   │   └── index.ts           # Feature exports
│   │
│   ├── sessions/              # Session management
│   │   ├── components/
│   │   │   ├── session-list.tsx
│   │   │   ├── session-card.tsx
│   │   │   └── create-session-dialog.tsx
│   │   ├── hooks/
│   │   │   ├── use-sessions.ts
│   │   │   └── use-session-messages.ts
│   │   ├── api/
│   │   │   └── sessions-api.ts
│   │   └── types/
│   │       └── session.types.ts
│   │
│   ├── chat/                  # Real-time chat feature
│   │   ├── components/
│   │   │   ├── message-list.tsx
│   │   │   ├── message-input.tsx
│   │   │   └── typing-indicator.tsx
│   │   ├── hooks/
│   │   │   ├── use-chat.ts
│   │   │   ├── use-messages.ts
│   │   │   └── use-typing.ts
│   │   ├── api/
│   │   │   └── chat-api.ts
│   │   └── types/
│   │       └── chat.types.ts
│   │
│   └── permissions/           # Permission handling
│       ├── components/
│       │   ├── permission-request.tsx
│       │   └── permission-dialog.tsx
│       ├── hooks/
│       │   └── use-permissions.ts
│       └── api/
│           └── permissions-api.ts
│
├── lib/                       # Core library code
│   ├── api/                   # API client infrastructure
│   │   ├── client.ts          # Axios/base client configuration
│   │   └── endpoints.ts       # API endpoint constants
│   ├── socket/                # Socket.IO infrastructure
│   │   ├── socket-manager.ts  # Singleton socket client
│   │   ├── socket-events.ts   # Event type definitions
│   │   └── socket-hooks.ts    # Custom socket hooks
│   ├── query/                 # TanStack Query setup
│   │   ├── query-client.ts    # Query client configuration
│   │   └── query-keys.ts      # Query key factory
│   ├── store/                 # Zustand stores
│   │   ├── ui-store.ts        # UI state (modals, sidebars)
│   │   └── prefs-store.ts     # User preferences
│   └── utils/                 # Utility functions
│       ├── cn.ts              # Class name utility (clsx + tailwind-merge)
│       └── format.ts          # Formatting helpers
│
├── hooks/                     # Shared custom hooks
│   ├── use-online.ts          # Network status detection
│   ├── use-debounce.ts
│   └── use-local-storage.ts
│
├── pages/                     # Page components (routes)
│   ├── home/
│   │   └── page.tsx
│   ├── sessions/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx       # Dynamic session route
│   └── settings/
│       └── page.tsx
│
├── services/                  # Business logic layer
│   ├── message-service.ts     # Message CRUD + sync logic
│   ├── session-service.ts     # Session lifecycle management
│   └── permission-service.ts  # Permission workflow
│
├── types/                     # Global TypeScript types
│   ├── api.types.ts           # API response/request types
│   ├── socket.types.ts        # Socket event types
│   └── hapi.types.ts          # HAPI protocol types
│
├── App.tsx                    # Root component
├── main.tsx                   # Application entry point
└── vite-env.d.ts              # Vite type declarations
```

### Structure Rationale

- **`features/`**: Organized by business domain (auth, sessions, chat) NOT by technical role. Each feature is self-contained with its own components, hooks, API calls, and types. This enables parallel development and easy feature extraction.
- **`components/ui/`**: Contains shadcn/ui primitives. These are presentational, reusable components with no business logic. They depend only on props and styling.
- **`components/layout/`**: App shell components that persist across routes (shell, sidebar, header). These provide structure but not feature logic.
- **`lib/api/`**: HTTP client abstraction layer. Centralizes axios configuration, interceptors, error handling, and endpoint definitions.
- **`lib/socket/`**: Socket.IO singleton manager. Wraps connection lifecycle, reconnection logic, and provides typed event emitters/listeners.
- **`lib/query/`**: TanStack Query infrastructure. Query client configuration with sensible defaults, query key factories for cache management.
- **`lib/store/`**: Zustand stores for client-only state (UI state, preferences). Small, focused stores separate from server state.
- **`services/`**: Business logic layer that coordinates between API calls, socket events, and state updates. Implements workflows like "send message → optimistic update → socket emit → rollback on error".
- **`types/`**: Shared TypeScript definitions. Prevents circular dependencies and ensures type safety across modules.

## Architectural Patterns

### Pattern 1: Feature-Based Architecture

**What:** Group code by business capability rather than technical role (components, hooks, utils).

**When to use:**
- Medium to large applications (20+ components)
- Teams larger than 2-3 developers
- Applications with distinct business domains

**Trade-offs:**
- **Pros:** Easier to find related code, enables parallel development, clearer boundaries for testing
- **Cons:** Can lead to code duplication if not careful, requires discipline to keep features independent

**Example:**
```typescript
// ❌ AVOID: Type-based organization (hard to scale)
src/
├── components/
│   ├── LoginButton.tsx
│   ├── SessionList.tsx
│   ├── MessageInput.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useSessions.ts
│   └── useChat.ts

// ✅ RECOMMENDED: Feature-based organization
src/features/
├── auth/
│   ├── components/LoginButton.tsx
│   ├── hooks/useAuth.ts
│   └── api/auth-api.ts
├── sessions/
│   ├── components/SessionList.tsx
│   ├── hooks/useSessions.ts
│   └── api/sessions-api.ts
└── chat/
    ├── components/MessageInput.tsx
    ├── hooks/useChat.ts
    └── api/chat-api.ts
```

### Pattern 2: Server State vs Client State Separation

**What:** Use TanStack Query for server state (API data) and Zustand for client state (UI state, preferences).

**When to use:**
- Any application with API integration
- Applications requiring optimistic updates
- When data can be modified by other users

**Trade-offs:**
- **Pros:** Automatic cache invalidation, background refetching, optimistic updates, reduced boilerplate
- **Cons:** Learning curve for developers unfamiliar with server state concepts

**Example:**
```typescript
// ✅ Server state: Use TanStack Query
// src/features/sessions/hooks/use-sessions.ts
export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: sessionsApi.fetchAll,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ✅ Client state: Use Zustand
// src/lib/store/ui-store.ts
interface UIState {
  sidebarOpen: boolean;
  selectedSessionId: string | null;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  selectedSessionId: null,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  selectSession: (id) => set({ selectedSessionId: id }),
}));

// ❌ AVOID: Putting server data in Zustand
// Don't do this - TanStack Query handles caching better
// export const useSessionsStore = create((set) => ({
//   sessions: [],
//   fetchSessions: async () => { ... }
// }));
```

### Pattern 3: Socket.IO Integration with State Synchronization

**What:** Centralized Socket.IO manager with typed events + TanStack Query cache invalidation.

**When to use:**
- Real-time features (chat, notifications)
- Multiple components need socket events
- Need to coordinate socket events with REST API data

**Trade-offs:**
- **Pros:** Single connection instance, type-safe events, coordinated cache updates, easier testing
- **Cons:** Requires careful event naming, can be complex with many event types

**Example:**
```typescript
// src/lib/socket/socket-manager.ts
import { io, Socket } from 'socket.io-client';

class SocketManager {
  private socket: Socket | null = null;
  private readonly URL = import.meta.env.VITE_SOCKET_URL;

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(this.URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.connect();
  }

  disconnect() {
    this.socket?.disconnect();
  }

  // Typed event emitters
  emitMessage(sessionId: string, content: string) {
    this.socket?.emit('message:send', { sessionId, content });
  }

  emitTyping(sessionId: string) {
    this.socket?.emit('message:typing', { sessionId });
  }

  // Typed event listeners
  onMessage(callback: (message: Message) => void) {
    this.socket?.on('message:new', callback);
  }

  onTyping(callback: (data: { userId: string; sessionId: string }) => void) {
    this.socket?.on('message:typing', callback);
  }
}

export const socketManager = new SocketManager();

// src/features/chat/hooks/use-chat-messages.ts
export function useChatMessages(sessionId: string) {
  const queryClient = useQueryClient();

  // Initial data load via REST API
  const { data, isLoading, error } = useQuery({
    queryKey: ['messages', sessionId],
    queryFn: () => chatApi.fetchMessages(sessionId),
  });

  // Real-time updates via Socket.IO
  useEffect(() => {
    const handleMessage = (message: Message) => {
      if (message.sessionId === sessionId) {
        // Optimistically update cache
        queryClient.setQueryData(
          ['messages', sessionId],
          (old: Message[] = []) => [...old, message]
        );
      }
    };

    socketManager.onMessage(handleMessage);
    return () => socketManager.offMessage(handleMessage);
  }, [sessionId, queryClient]);

  return { messages: data, isLoading, error };
}
```

### Pattern 4: Incremental Message Sync (Performance Optimization)

**What:** Load messages incrementally using pagination + real-time append-only updates. Critical for handling 10,000+ message sessions.

**When to use:**
- Chat applications with long message history
- Infinite scroll requirements
- Memory-constrained environments

**Trade-offs:**
- **Pros:** Fast initial load, low memory usage, smooth scrolling, handles large datasets
- **Cons:** More complex state management, requires careful cache updates

**Example:**
```typescript
// src/features/chat/hooks/use-infinite-messages.ts
export function useInfiniteMessages(sessionId: string) {
  const queryClient = useQueryClient();

  // Infinite scroll for historical messages
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['messages', sessionId, 'infinite'],
    queryFn: ({ pageParam = 0 }) =>
      chatApi.fetchMessagesPaginated(sessionId, {
        limit: 50,
        offset: pageParam,
      }),
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
  });

  // Real-time new messages (append only)
  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      if (message.sessionId === sessionId) {
        // Append to first page (most recent)
        queryClient.setQueryData(
          ['messages', sessionId, 'infinite'],
          (old: InfiniteData<Message[]>) => {
            if (!old) return old;
            return {
              ...old,
              pages: [
                [message, ...old.pages[0]],
                ...old.pages.slice(1),
              ],
            };
          }
        );
      }
    };

    socketManager.onMessage(handleNewMessage);
    return () => socketManager.offMessage(handleNewMessage);
  }, [sessionId, queryClient]);

  return {
    messages: data?.pages.flat() || [],
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
```

### Pattern 5: Optimistic UI Updates

**What:** Update UI immediately, rollback on error. Provides instant feedback.

**When to use:**
- User-generated content (messages, comments)
- Write operations where latency is noticeable
- When server is eventually consistent

**Trade-offs:**
- **Pros:** Perceived performance, better UX, no loading spinners
- **Cons:** Requires error handling, can show temporary incorrect data

**Example:**
```typescript
// src/features/chat/hooks/use-send-message.ts
export function useSendMessage(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) =>
      chatApi.sendMessage(sessionId, content),

    // Optimistic update
    onMutate: async (content) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', sessionId] });

      // Snapshot previous value
      const previousMessages =
        queryClient.getQueryData(['messages', sessionId]);

      // Optimistically update to the new value
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        sessionId,
        content,
        role: 'user',
        createdAt: new Date().toISOString(),
        status: 'sending',
      };

      queryClient.setQueryData(
        ['messages', sessionId],
        (old: Message[] = []) => [...old, tempMessage]
      );

      // Return context with previous value and temp message
      return { previousMessages, tempMessage };
    },

    // If mutation fails, use context returned from onMutate
    onError: (err, content, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ['messages', sessionId],
          context.previousMessages
        );
      }
      toast.error('Failed to send message');
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', sessionId] });
    },
  });
}
```

## Data Flow

### Request Flow (REST API)

```
[User Action]
    ↓
[Component] → [Event Handler]
    ↓
[Mutation Hook] → [API Service]
    ↓              ↓
[Response] ← [HTTP Request]
    ↓
[Query Cache Update]
    ↓
[UI Re-render]
```

**Example:**
```typescript
// Component
function CreateSessionButton() {
  const createSession = useCreateSession(); // Mutation hook

  return (
    <Button onClick={() => createSession.mutate({ name: 'New Session' })}>
      Create Session
    </Button>
  );
}

// Hook
function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => sessionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

// Service
export const sessionsApi = {
  create: (data) => apiClient.post('/api/v1/sessions', data),
};
```

### Real-Time Event Flow (Socket.IO)

```
[Backend Event]
    ↓
[Socket Manager]
    ↓
[Event Listener]
    ↓
[Query Cache Update]
    ↓
[UI Re-render]
```

**Example:**
```typescript
// Backend emits: message:new

// Socket Manager
socketManager.onMessage((message) => {
  // Update query cache
  queryClient.setQueryData(
    ['messages', message.sessionId],
    (old: Message[] = []) => [...old, message]
  );
});

// Component auto-renders with new message
```

### State Management Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Component Layer                         │
│  (Consumes data, dispatches actions)                         │
└──────────┬──────────────────────────────────────┬───────────┘
           │                                      │
           ↓ (read)                              ↓ (write)
┌──────────────────────┐              ┌──────────────────────┐
│  Server State        │              │  Client State        │
│  (TanStack Query)    │              │  (Zustand)           │
│                      │              │                      │
│  - Sessions          │              │  - Sidebar open      │
│  - Messages          │              │  - Theme             │
│  - Permissions       │              │  - Selected ID       │
│  - Commands          │              │  - Modal states      │
└──────────┬───────────┘              └──────────┬───────────┘
           │                                     │
           ↓ (fetch/update)                      ↓ (direct access)
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                              │
│  (API Services + Socket Manager)                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Principles:**
1. **Server state** = data from API, cached by TanStack Query, can be stale, needs synchronization
2. **Client state** = UI-only state, lives only in frontend, never persisted to server
3. **Unidirectional flow:** Components read from state, dispatch actions to update state
4. **Real-time:** Socket events update server state (Query cache), never directly update UI

### Key Data Flows

1. **Session List Load:** Component → useQuery → sessionsApi.fetch() → Cache → UI Render
2. **Send Message:** Component → useMutation → chatApi.sendMessage() → Socket emit → Optimistic Update → Server Response → Cache Update
3. **Receive Message:** Socket event → Query Cache Update → UI Auto-Render
4. **Infinite Scroll:** User scrolls → IntersectionObserver → fetchNextPage → API call → Append to cache → UI Render

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Monolith is fine. Focus on feature development. Single TanStack Query client. Basic error handling. |
| 1k-100k users | Optimize bundle size (code splitting). Add request deduplication. Implement infinite scroll for large datasets. Add loading skeletons. Basic error boundaries. |
| 100k+ users | Consider splitting into micro-frontends. Implement advanced caching strategies (stale-while-revalidate). Add service worker for offline support. Optimize images (lazy load, responsive). Monitor performance with RUM (Real User Monitoring). |

### Scaling Priorities

1. **First bottleneck: Bundle size**
   - Fix: Code splitting with React.lazy, route-based splitting, tree-shaking unused dependencies
   - Use `vite-plugin-pwa` with precache manifest for assets

2. **Second bottleneck: Memory usage (large message lists)**
   - Fix: Virtualization with `react-window` for 1000+ message lists
   - Implement incremental sync (load 50 messages, paginate rest)
   - Use TanStack Query's cache time limits to garbage collect old data

3. **Third bottleneck: Network requests**
   - Fix: Request deduplication (TanStack Query does this automatically)
   - Implement optimistic updates to mask latency
   - Use HTTP/2 or HTTP/3 for multiplexing

## Anti-Patterns

### Anti-Pattern 1: Fetching Data in useEffect

**What people do:**
```typescript
useEffect(() => {
  fetch('/api/sessions')
    .then(res => res.json())
    .then(data => setSessions(data));
}, []);
```

**Why it's wrong:**
- No caching (fetches on every component mount)
- No error handling
- Race conditions
- No loading states
- Stale data issues

**Do this instead:**
```typescript
const { data: sessions, isLoading, error } = useQuery({
  queryKey: ['sessions'],
  queryFn: () => fetch('/api/sessions').then(res => res.json()),
});
```

### Anti-Pattern 2: Mixing Server State and Client State

**What people do:**
```typescript
// Putting API data in Zustand/Redux
const useSessionsStore = create((set) => ({
  sessions: [],
  fetchSessions: async () => {
    const data = await api.fetchSessions();
    set({ sessions: data });
  },
}));
```

**Why it's wrong:**
- Reinventing caching (TanStack Query already does this)
- No background refetching
- No stale-while-revalidate
- Manual cache invalidation
- More boilerplate

**Do this instead:**
```typescript
// Server state in TanStack Query
const { data: sessions } = useQuery({
  queryKey: ['sessions'],
  queryFn: api.fetchSessions,
});

// Client state in Zustand (UI-only)
const useUIStore = create((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
```

### Anti-Pattern 3: Multiple Socket Connections

**What people do:**
```typescript
// Component A
const socket = io('http://localhost:8080');

// Component B
const socket = io('http://localhost:8080'); // Creates SECOND connection!
```

**Why it's wrong:**
- Wastes server connections
- Race conditions between connections
- Event handlers fire multiple times
- Memory leaks

**Do this instead:**
```typescript
// lib/socket/socket-manager.ts
class SocketManager {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io('http://localhost:8080');
    }
    return this.socket;
  }
}

export const socketManager = new SocketManager();

// Use everywhere
const socket = socketManager.connect();
```

### Anti-Pattern 4: Props Drilling for Global State

**What people do:**
```typescript
function App() {
  const [theme, setTheme] = useState('dark');
  return <Layout theme={theme} setTheme={setTheme} />;
}

function Layout({ theme, setTheme }) {
  return <Sidebar theme={theme} setTheme={setTheme} />;
}

function Sidebar({ theme, setTheme }) {
  return <Button onClick={() => setTheme('light')}>Toggle</Button>;
}
```

**Why it's wrong:**
- Props passed through multiple layers that don't use them
- Hard to maintain (change = update many files)
- Coupled component tree

**Do this instead:**
```typescript
// lib/store/prefs-store.ts
export const usePrefsStore = create((set) => ({
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
}));

// Use directly where needed
function Sidebar() {
  const { theme, setTheme } = usePrefsStore();
  return <Button onClick={() => setTheme('light')}>Toggle</Button>;
}
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **AI-Bridge Backend (REST)** | API Service Layer + TanStack Query | Use axios/fetch wrapper with interceptors for auth, error handling. Query keys for caching. |
| **AI-Bridge Backend (Socket.IO)** | Singleton Socket Manager + Event Listeners | Centralized connection management, typed events, coordinate with Query cache. |
| **PWA Service Worker** | vite-plugin-pwa with Workbox | Auto-precaching of assets, runtime caching for API calls, offline fallback UI. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Features ↔ Components** | Props (parent → child), Events (child → parent) | Features are parent components, UI components are dumb/presentational. Keep UI components reusable. |
| **Features ↔ API Layer** | Service calls (features import services) | Features don't call fetch directly. Services abstract HTTP, handle errors, transform data. |
| **Socket ↔ Query Cache** | Socket events update Query cache | Socket listeners call `queryClient.setQueryData()` to trigger UI re-renders. |
| **Server State ↔ Client State** | Minimal coupling | Server state (Query) shouldn't depend on client state (Zustand). Client state can read server state but not vice versa. |

## PWA Integration Patterns

### Service Worker Strategy

**Use `vite-plugin-pwa` with generateSW strategy (default):**

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Auto-update on new version
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'AI-Bridge Web',
        short_name: 'AIBridge',
        description: 'Remote access to Claude Code CLI',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./i,
            handler: 'NetworkFirst', // Try network, fallback to cache
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst', // Serve from cache, update in background
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
    }),
  ],
});
```

### Offline Strategy

**Three-tier approach:**

1. **App Shell (Shell Architecture):**
   - Precache critical assets (HTML, CSS, JS bundle)
   - Always serve from cache (CacheFirst strategy)
   - User sees basic UI immediately

2. **API Data:**
   - NetworkFirst for REST API calls
   - Show cached data if offline, toast notification "Working offline"
   - Queue mutations when offline, sync when reconnected

3. **Real-Time (Socket.IO):**
   - Graceful degradation: Show "Disconnected" banner
   - Auto-reconnect with exponential backoff
   - Cache outgoing messages in IndexedDB, send on reconnect

```typescript
// src/components/offline-banner.tsx
export function OfflineBanner() {
  const isOnline = useOnline();

  if (!isOnline) {
    return (
      <div className="bg-yellow-500 text-white px-4 py-2 text-center">
        You're offline. Some features may be limited.
      </div>
    );
  }

  return null;
}
```

## Build Order (Dependencies)

**Phase 1: Foundation (Week 1)**
1. Project setup (Vite + React + TypeScript)
2. Configure Tailwind CSS
3. Install and configure shadcn/ui (base components: Button, Input, Card)
4. Set up routing (React Router)
5. Create base layout (AppShell, Header, Sidebar)

**Phase 2: Data Layer (Week 2)**
1. Configure TanStack Query (QueryClient, providers)
2. Create API service layer (axios client, endpoints)
3. Set up Socket.IO manager (singleton, connection lifecycle)
4. Create TypeScript types (API responses, Socket events, HAPI protocol)

**Phase 3: Authentication (Week 2-3)**
1. Build login page
2. Create auth feature (hooks, API, components)
3. Set up auth context/provider
4. Implement protected routes

**Phase 4: Sessions (Week 3-4)**
1. Session list page (useQuery for data)
2. Create session dialog (useMutation)
3. Session detail page (route with dynamic ID)
4. Session card components

**Phase 5: Real-Time Chat (Week 4-6)**
1. Message list component (infinite scroll)
2. Message input component (mutation + socket emit)
3. Socket event listeners (message:new, message:typing)
4. Optimistic updates
5. Typing indicators
6. Permission handling UI

**Phase 6: PWA Features (Week 6-7)**
1. Configure vite-plugin-pwa
2. Create service worker registration
3. Add offline detection and banner
4. Install prompt (PWA install UI)
5. Test offline scenarios

**Phase 7: Polish & Testing (Week 7-8)**
1. Error boundaries
2. Loading skeletons
3. Toast notifications (success/error)
4. Accessibility audit
5. Performance optimization (code splitting, lazy loading)
6. E2E tests (Playwright)

**Dependencies:**
- Phase 1 is independent (can run in parallel with backend)
- Phase 2 requires Phase 1 (needs layout/shell to exist)
- Phase 3 requires Phase 2 (needs data layer)
- Phase 4 requires Phase 3 (needs auth to create sessions)
- Phase 5 requires Phase 4 (needs sessions to chat)
- Phase 6 requires Phase 5 (needs basic features first)
- Phase 7 runs throughout (add polish as features are built)

## Sources

### HIGH Confidence (Context7 + Official Documentation)
- TanStack Query Documentation - https://tanstack.com/query/v5/docs/react/overview
- vite-plugin-pwa Documentation - https://vite-pwa-org.netlify.app/
- Socket.IO Documentation - https://socket.io/docs/v4/
- shadcn/ui Documentation - https://ui.shadcn.com/

### MEDIUM Confidence (Verified with Official Sources)
- "Building Real-time Chat with Socket.io and React Query" - https://dev.to/krifiz/building-real-time-chat-with-socketio-and-react-query-39kd
- "Mastering Modern React + Vite Folder Structure" - https://sandeshrathnayake.medium.com/mastering-modern-react-vite-folder-structure-a-production-ready-guide-for-scalable-applications-9ad8e233f8b9
- "React Best Practices for Folder Structure" - https://javascript.plainenglish.io/react-best-practices-for-folder-structure-system-design-architecture-8fc2f09e3fff

### LOW Confidence (Community Articles - Patterns Verified)
- "Stop Fetching Data in useEffect: Managing Server State with TanStack Query" - https://silverskytechnology.com/stop-fetching-data-in-useeffect-managing-server-state-with-tanstack-query/
- "React Architecture: A Complete Guide" - https://medium.com/@rohitkuwar/react-architecture-a-complete-guide-for-scalable-front-end-applications-05e2ab8a79d7
- "Shadcn UI Best Practices" - https://cursorrules.org/article/shadcan-cursor-mdc-file

---
*Architecture research for: React PWA with Real-Time Socket.IO*
*Researched: 2026-02-06*
