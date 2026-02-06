# Pitfalls Research

**Domain:** React PWA with Socket.IO Real-time Communication
**Researched:** 2026-02-06
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Socket.IO Memory Leaks in React Components

**What goes wrong:**
Socket.IO event listeners accumulate in React components, causing memory leaks and duplicate event handlers. Each component remount or re-render adds new listeners without cleaning up old ones. Symptoms include:
- Multiple identical event handlers firing for single events
- Memory continuously growing over time
- Performance degradation after navigating between routes
- "Possible EventEmitter memory leak detected" warnings

**Why it happens:**
Developers place `socket.on()` in useEffect without proper cleanup functions or dependencies. Socket.IO connections persist across component lifecycle, but React components mount/unmount frequently. Without cleanup, each mount adds new listeners to the persistent socket.

**Consequences:**
- Memory leaks cause app crashes after extended use
- Events fire multiple times (once per attached listener)
- Network traffic increases from duplicate subscriptions
- Mobile devices become sluggish and battery drains faster

**How to avoid:**
```typescript
useEffect(() => {
  const handleMessage = (data: MessageEvent) => {
    // Handle event
  };

  socket.on('message', handleMessage);

  // CRITICAL: Cleanup function
  return () => {
    socket.off('message', handleMessage);
  };
}, [socket]); // Include socket in dependencies
```

**Warning signs:**
- Console shows "EventEmitter memory leak detected" with 11+ listeners
- Same event handler executes multiple times per event
- Chrome DevTools Memory profiler shows growing heap
- Task Manager shows increasing RAM usage over time

**Phase to address:**
**Phase 2: Core Integration** - Establish socket connection lifecycle patterns before building features on top. Create custom hooks that enforce cleanup.

---

### Pitfall 2: useEffect Stale Closures with Socket.IO

**What goes wrong:**
Event handlers reference stale state from previous renders. Socket.IO callbacks capture variables from when they were registered, not current values. Common manifestations:
- Sending messages with old user IDs
- UI showing outdated session state
- Authentication tokens expiring in callbacks
- Permissions using stale data

**Why it happens:**
JavaScript closures capture variables from their enclosing scope. When `socket.on()` is registered in useEffect, the callback function captures current state/props values. But when those values change, the already-registered callback still references the old values.

**Consequences:**
- Critical bugs in user sessions and authentication
- Data corruption in message handling
- Security vulnerabilities from stale auth tokens
- Impossible-to-debug state inconsistencies

**How to avoid:**
```typescript
// BAD: Stale closure
useEffect(() => {
  socket.on('message', (msg) => {
    // Always references userId from first render
    sendMessage(msg, userId);
  });
}, []); // Missing dependency

// GOOD: Use refs for frequently updated values
const userIdRef = useRef(userId);
useEffect(() => {
  userIdRef.current = userId; // Update ref
}, [userId]);

useEffect(() => {
  socket.on('message', (msg) => {
    // Always reads current value
    sendMessage(msg, userIdRef.current);
  });
  return () => socket.off('message');
}, [socket]);

// BEST: Use functional updates or socket instance pattern
useEffect(() => {
  const handleMessage = (msg: Message) => {
    setState((prev) => updateWithMessage(prev, msg));
  };
  socket.on('message', handleMessage);
  return () => socket.off('message', handleMessage);
}, [socket]);
```

**Warning signs:**
- Event handlers use old state values
- Console.log in callbacks shows outdated data
- State updates don't reflect in Socket.IO callbacks
- ESLint warnings: "React Hook useEffect has missing dependencies"

**Phase to address:**
**Phase 2: Core Integration** - Establish state management patterns for Socket.IO integration. Create custom hooks that handle closure issues automatically.

---

### Pitfall 3: Large Message List Rendering Without Virtualization

**What goes wrong:**
Rendering 10,000+ messages in a standard React list causes:
- Initial page load takes 10+ seconds
- Scrolling becomes extremely laggy
- Browser tab freezes or crashes
- Mobile devices become unresponsive

**Why it happens:**
React creates a DOM node for each list item. With 10,000 messages, that's 10,000+ DOM elements. Each re-render (every new message) reconciles the entire list. The browser layout engine must calculate positions for thousands of elements.

**Consequences:**
- App becomes unusable after ~1000 messages
- New message arrival causes visible UI freeze
- Poor mobile performance (critical for PWA)
- Users abandon due to sluggishness
- Negative reviews mentioning performance

**How to avoid:**
Use **list virtualization** - only render visible items:
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function MessageList({ messages }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated message height
    overscan: 5, // Render 5 extra items above/below viewport
  });

  return (
    <div ref={parentRef} style={{ height: '800px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <Message message={messages[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Warning signs:**
- Chrome DevTools Performance shows long tasks (>50ms)
- Scrolling through messages drops frames (visible in DevTools FPS meter)
- React DevTools Profiler shows 1000+ components rendered
- "Rendered X nodes" count in React DevTools is extremely high
- Initial load time increases linearly with message count

**Phase to address:**
**Phase 3: UI Components** - Implement virtualization before loading real data. Use virtualized lists from day one for any potentially-large datasets.

---

### Pitfall 4: PWA Service Worker Cache Staleness

**What goes wrong:**
Users continue using old JavaScript bundles after deployments:
- New features don't appear for existing users
- Bugs supposedly fixed still occur
- Hard refresh required to see updates
- Inconsistent app versions across users

**Why it happens:**
Service workers cache assets aggressively (by design). When a new version deploys, the old service worker continues serving cached content. The new service worker installs but waits in "waiting" state until all tabs close.

**Consequences:**
- Support team wastes time debugging "fixed" bugs
- Users confused about missing features
- A/B testing contaminated by version skew
- Emergency hotfixes don't reach users promptly
- User frustration from force-refresh instructions

**How to avoid:**
```typescript
// service-worker.js
self.addEventListener('install', (event) => {
  // Skip waiting and activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of all clients immediately
  event.waitUntil(self.clients.claim());
});

// In React app - notify user of update
navigator.serviceWorker.addEventListener('controllerchange', () => {
  // Show "New version available" toast or auto-reload
  window.location.reload();
});

// Or use skipWaiting() on demand
navigator.serviceWorker.ready.then((registration) => {
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    newWorker?.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New version available, notify user
        showUpdateNotification(() => {
          newWorker.postMessage({ type: 'SKIP_WAITING' });
        });
      }
    });
  });
});
```

**Warning signs:**
- Users report issues from older versions
- Deployments don't seem to "take effect"
- Different users see different app versions simultaneously
- Hard refresh (Ctrl+Shift+R) temporarily "fixes" issues

**Phase to address:**
**Phase 4: PWA Features** - Implement service worker update flow in first PWA iteration. Test update mechanism manually before deployment.

---

### Pitfall 5: Socket.IO Reconnection Failure in Offline/Online Transitions

**What goes wrong:**
After losing internet connection, Socket.IO fails to reconnect when network returns:
- App shows "disconnected" indefinitely
- Users must refresh page to restore connection
- Background reconnection doesn't work
- Mobile app switching breaks connection

**Why it happens:**
Socket.IO's default reconnection logic doesn't handle all network scenarios. Browser online/offline events fire inconsistently. Socket.IO doesn't automatically retry after certain timeout patterns. Mobile browsers throttle background connections.

**Consequences:**
- App appears broken after brief network interruption
- Poor mobile experience (network transitions common)
- Users assume app has bugs
- Lost messages during disconnection
- Requires manual page reload (bad UX)

**How to avoid:**
```typescript
const useSocketReconnection = (socket: Socket) => {
  useEffect(() => {
    const handleOnline = () => {
      if (!socket.connected) {
        socket.connect();
      }
    };

    const handleOffline = () => {
      // Optional: Show offline indicator
      showOfflineBanner();
    };

    const handleReconnectAttempt = (attemptNumber: number) => {
      console.log(`Reconnection attempt ${attemptNumber}`);
    };

    const handleReconnectFailed = () => {
      showReconnectFailedNotification();
    };

    const handleReconnect = () => {
      hideOfflineBanner();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('reconnect_failed', handleReconnectFailed);
    socket.on('reconnect', handleReconnect);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('reconnect_failed', handleReconnectFailed);
      socket.off('reconnect', handleReconnect);
    };
  }, [socket]);
};
```

**Warning signs:**
- Connection status indicator shows "disconnected" after network returns
- Manual page reload restores connection
- Browser DevTools shows socket.io polling errors
- Mobile users report more connection issues than desktop

**Phase to address:**
**Phase 2: Core Integration** - Implement reconnection handling immediately after basic Socket.IO integration. Test with airplane mode toggling.

---

### Pitfall 6: TypeScript Type Safety Lost with Socket.IO Events

**What goes wrong:**
Socket.IO event handlers use `any` types or lose type information:
- Runtime errors from mismatched event data
- No autocomplete for event payloads
- Refactoring breaks event handlers silently
- Impossible to track event contracts

**Why it happens:**
Socket.IO's default TypeScript setup is verbose. Developers skip proper typing for convenience. Client-side event types must match server-side, but no enforcement exists. Dynamic event names bypass TypeScript's type checking.

**Consequences:**
- Runtime type errors in production
- Broken event handlers after server changes
- No IDE support for event payloads
- Difficult to refactor event schemas
- Team confusion about event contracts

**How to avoid:**
```typescript
// types/socket.ts
export interface ServerToClientEvents {
  message: (data: { seq: number; content: string; timestamp: number }) => void;
  error: (error: { message: string; code: string }) => void;
  session_update: (update: { status: string; metadata: Record<string, unknown> }) => void;
}

export interface ClientToServerEvents {
  send_message: (content: string) => void;
  subscribe: (filter: { since_seq?: number }) => void;
  approve_permission: (requestId: string, scope: string[]) => void;
}

// In component
import { Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents } from '@/types/socket';

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io();

// Now fully type-safe
socket.on('message', (data) => {
  // data is automatically typed as { seq: number; content: string; ... }
  console.log(data.seq); // TypeScript knows this exists
});

socket.emit('send_message', 'hello'); // TypeScript validates args

// For dynamic event names
type EventMap = ServerToClientEvents;
type EventName = keyof EventMap;

function listenToEvent<T extends EventName>(
  event: T,
  handler: EventMap[T]
) {
  socket.on(event, handler);
}
```

**Warning signs:**
- Event handlers use `(data: any)` or `(data: unknown)`
- TypeScript errors when accessing event properties
- No autocomplete for event data fields
- `@ts-ignore` comments around Socket.IO code

**Phase to address:**
**Phase 1: Foundation** - Set up TypeScript event types before any Socket.IO implementation. Create shared types file that can be synchronized with backend.

---

### Pitfall 7: Infinite Loops from useEffect Dependencies

**What goes wrong:**
useEffect triggers repeatedly, causing infinite loops:
- CPU usage spikes to 100%
- Browser tab freezes
- Console floods with logs
- App becomes unresponsive

**Why it happens:**
Updating state inside useEffect while including that state in dependency array creates a loop: Effect runs → Updates state → Dependency changed → Effect runs again. Common with Socket.IO message handlers that update component state.

**Consequences:**
- App crashes completely
- Browser shows "page unresponsive" dialog
- Infinite API calls or socket messages
- Server overload from repeated requests
- Data corruption from rapid updates

**How to avoid:**
```typescript
// BAD: Infinite loop
useEffect(() => {
  socket.on('message', (msg) => {
    setMessages((prev) => [...prev, msg]); // Updates messages
  });
}, [messages]); // messages in deps → infinite loop

// GOOD: Remove state from dependencies
useEffect(() => {
  const handleMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]); // Functional update
  };
  socket.on('message', handleMessage);
  return () => socket.off('message', handleMessage);
}, [socket]); // Only socket in deps

// OR: Use reducer for complex state
useEffect(() => {
  socket.on('message', (msg) => {
    dispatch({ type: 'ADD_MESSAGE', payload: msg }); // Reducer doesn't change deps
  });
  return () => socket.off('message');
}, [socket]);

// AVOID: Empty array when you need fresh data
useEffect(() => {
  // This won't update when userId changes
  socket.emit('subscribe', { userId });
}, []); // Missing userId dependency

// CORRECT: Include all dependencies
useEffect(() => {
  socket.emit('subscribe', { userId });
}, [userId, socket]);
```

**Warning signs:**
- Console logs repeat infinitely
- Chrome DevTools Performance shows continuous script execution
- Network tab shows identical requests repeating
- State updates happening continuously in React DevTools
- ESLint: "React Hook useEffect has a missing dependency"

**Phase to address:**
**Phase 1: Foundation** - Train team on useEffect dependency rules during initial React setup. Use ESLint react-hooks plugin. Code review must check all useEffect deps.

---

## Moderate Pitfalls

### Pitfall 8: Bundle Size Bloat from Socket.IO

**What goes wrong:**
Socket.IO client library adds significant bundle size:
- Initial load time increases by 2-3 seconds on mobile
- Bundle exceeds 500KB (unzipped)
- Poor First Contentful Paint (FCP) metrics
- Users on slow connections abandon before load

**Why it happens:**
Socket.IO includes reconnection logic, fallback transports (polling), and extra features. For simple WebSocket use cases, this overhead is unnecessary. The library isn't tree-shakeable.

**Consequences:**
- Poor Lighthouse performance scores
- Slow mobile load times
- High data usage for mobile users
- PWA install prompt doesn't appear (page too slow)
- Lower user engagement from slow loads

**How to avoid:**
```bash
# Analyze bundle first
npm install -D webpack-bundle-analyzer

# In webpack config
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
    }),
  ],
};

# Consider alternatives if bundle size is critical
- Native WebSocket API (lightest)
- socket.io-client ESM build (smaller than CommonJS)
- ws library (Node.js only, lighter than Socket.IO)
```

**Warning signs:**
- Bundle report shows Socket.IO > 100KB
- Lighthouse Performance score < 70
- Initial bundle > 200KB gzipped
- FCP > 2 seconds on 4G mobile

**Phase to address:**
**Phase 5: Performance Optimization** - Analyze bundle size after feature complete. Consider Socket.IO alternatives if size is prohibitive.

---

### Pitfall 9: CORS Configuration Issues with Socket.IO

**What goes wrong:**
Cross-origin requests blocked between frontend and backend:
- Socket.IO connection fails
- Console shows CORS errors
- Development works but production fails
- Mobile app can't connect to backend

**Why it happens:**
Socket.IO v3+ requires explicit CORS configuration. Frontend and backend on different origins (ports/domains). Development (localhost) vs production (different domains) mismatch. Socket.IO uses HTTP long-polling fallback, which has stricter CORS.

**Consequences:**
- App completely non-functional in production
- Wasted time debugging CORS errors
- Security risks from overly permissive CORS
- Inconsistent behavior across environments

**How to avoid:**
```typescript
// Backend (Go with gin-socket.io)
import "github.com/gin-gonic/gin"
import "github.com/googollee/go-socket.io"

corsOrigins := []string{
  "http://localhost:3000",       // Dev
  "https://app.example.com",     // Production
  "https://staging.example.com", // Staging
}

opts := socketio.Options{
  CORS: &socketio.CORS{
    Origins: corsOrigins,
    Headers: []string{"Authorization", "Content-Type"},
    Methods: []string{"GET", "POST"},
  },
}

// Frontend (React)
import { io } from 'socket.io-client';

const socket = io('https://api.example.com', {
  withCredentials: true,
  extraHeaders: {
    'Authorization': `Bearer ${token}`,
  },
});
```

**Warning signs:**
- Console: "CORS policy: No 'Access-Control-Allow-Origin' header"
- Socket.IO connection errors in browser
- Works on same machine but not across devices
- Production deployment breaks connectivity

**Phase to address:**
**Phase 2: Core Integration** - Configure CORS during initial backend setup. Test cross-origin connections before merging to main.

---

### Pitfall 10: Missing PWA Install Prompt

**What goes wrong:**
PWA doesn't show "Install App" prompt:
- Users can't install to home screen
- No offline capability
- Poor mobile engagement
- Users close tab, don't return

**Why it happens:**
PWA install criteria not met:
- Service worker not registered
- No manifest.json or misconfigured
- Site not served over HTTPS
- Performance too poor (FCP > ~1.8s)
- User hasn't engaged with site (browse multiple pages)
- Install prompt not manually triggered

**Consequences:**
- Lower user retention
- No mobile home screen presence
- Users forget about app
- Competitor apps with better UX win

**How to avoid:**
```typescript
// 1. Check install criteria
// - HTTPS deployed
// - Service worker registered
// - manifest.json with icons, start_url, display: standalone
// - Good performance (FCP < 1.8s, LCP < 2.5s)

// 2. Listen for install prompt
let deferredPrompt: BeforeInstallPromptEvent | null = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e as BeforeInstallPromptEvent;
  // Show custom "Install App" button
  showInstallButton();
});

// 3. Handle install button click
async function handleInstallClick() {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;

  if (outcome === 'accepted') {
    hideInstallButton();
  }
}

// 4. Detect if already installed
window.addEventListener('appinstalled', () => {
  hideInstallButton();
});
```

**Warning signs:**
- beforeinstallprompt event never fires
- Lighthouse PWA audit score < 90
- No "Add to Home Screen" option in mobile browser menu
- Manifest.json missing or invalid (check DevTools Application tab)

**Phase to address:**
**Phase 4: PWA Features** - Run Lighthouse PWA audit. Fix all issues. Test install flow on real mobile devices.

---

## Performance Traps

### Trap 1: Unnecessary Re-renders from Socket Context

**Symptoms:**
- Every message triggers re-render of entire app tree
- Chat lags even with virtualization
- CPU usage spikes during message bursts

**Prevention:**
```typescript
// BAD: Entire app re-renders on every message
function App() {
  const [messages, setMessages] = useState([]);
  const socket = useSocket(); // socket instance changes → re-render

  return <Chat messages={messages} />;
}

// GOOD: Split context to minimize re-renders
const SocketContext = createContext<Socket>(null);
const MessagesContext = createContext<Message[]>([]);

function App() {
  const socket = useMemo(() => io(), []); // Stable instance
  const [messages, setMessages] = useState([]);

  // Split contexts
  return (
    <SocketContext.Provider value={socket}>
      <MessagesContext.Provider value={messages}>
        <Chat />
      </MessagesContext.Provider>
    </SocketContext.Provider>
  );
}

// Components only subscribe to what they need
function Chat() {
  const messages = useContext(MessagesContext);
  // Doesn't re-render when socket emits events
}
```

**When it breaks:**
At ~50 messages/second with 100+ components in tree.

---

### Trap 2: Accumulating Messages in State

**Symptoms:**
- App gets slower over time (memory leak pattern)
- State serialization slows down
- React DevTools takes minutes to inspect state

**Prevention:**
```typescript
// BAD: Keep all messages in state (grows forever)
const [messages, setMessages] = useState([]);

// GOOD: Only keep recent messages, fetch older on scroll
const [recentMessages, setRecentMessages] = useState([]);
const [seqCursor, setSeqCursor] = useState(0);

useEffect(() => {
  // Subscribe to incremental updates
  socket.emit('subscribe', { since_seq: seqCursor });

  const handleNewMessage = (msg: Message) => {
    setRecentMessages((prev) => [...prev.slice(-100), msg]); // Max 100
    setSeqCursor(msg.seq);
  };

  socket.on('message', handleNewMessage);
  return () => socket.off('message', handleNewMessage);
}, [seqCursor]);
```

**When it breaks:**
At 10,000+ messages in React state.

---

### Trap 3: Missing React.memo on Message Components

**Symptoms:**
- New message causes all previous messages to re-render
- Scrolling through history is slow
- Virtualization doesn't help

**Prevention:**
```typescript
// GOOD: Memo expensive message components
export const Message = React.memo(({ message }: { message: Message }) => {
  // Expensive rendering (markdown, syntax highlighting, etc.)
  return <div className="message">{renderContent(message)}</div>;
}, (prev, next) => {
  // Custom comparison: only re-render if content changed
  return prev.message.seq === next.message.seq &&
         prev.message.content === next.message.content;
});
```

**When it breaks:**
At 1000+ messages with expensive rendering per message.

---

## Security Mistakes

### Mistake 1: Exposed JWT Tokens in Socket.IO

**Risk:**
Token interception via URL parameters or logging
 attackers can impersonate users

**Prevention:**
```typescript
// BAD: Token in URL (logged, visible)
const socket = io(`https://api.example.com?token=${token}`);

// GOOD: Token in auth header (not logged)
const socket = io('https://api.example.com', {
  auth: {
    token: token,
  },
  transports: ['websocket'], // Avoids URL-based polling
});

// GOOD: Refresh token before expiration
useEffect(() => {
  const refreshInterval = setInterval(() => {
    refreshToken().then(newToken => {
      socket.auth = { token: newToken };
      socket.disconnect().connect();
    });
  }, 5 * 60 * 1000); // Every 5 minutes

  return () => clearInterval(refreshInterval);
}, [socket]);
```

---

### Mistake 2: Missing Input Validation on Client-Side

**Risk:**
XSS attacks from malicious messages
UI breaking from unexpected data

**Prevention:**
```typescript
// Validate message structure
const MessageSchema = z.object({
  seq: z.number().int().positive(),
  content: z.string().max(10000),
  timestamp: z.number(),
  type: z.enum(['user', 'assistant', 'system']),
});

socket.on('message', (raw) => {
  const result = MessageSchema.safeParse(raw);
  if (!result.success) {
    console.error('Invalid message', result.error);
    return;
  }
  addMessage(result.data);
});
```

---

### Mistake 3: Origin Validation Missing

**Risk:**
Malicious sites can connect to your Socket.IO server
CSRF attacks

**Prevention:**
```typescript
// Backend: Validate origin
server.on('connection', (socket) => {
  const origin = socket.handshake.headers.origin;
  if (!ALLOWED_ORIGINS.includes(origin)) {
    socket.disconnect();
    console.warn('Blocked connection from:', origin);
    return;
  }
  // ... rest of connection logic
});
```

---

## Integration Gotchas

### Integration 1: React 19 + Socket.IO

**Common mistake:**
Using legacy Context APIs that conflict with React 19's use() API

**Correct approach:**
```typescript
// React 19 way
import { use } from 'react';

function Chat() {
  const socket = use(SocketContext);
  // Works with React 19's concurrent features
}
```

---

### Integration 2: Vite PWA Plugin + Socket.IO

**Common mistake:**
Service worker caching Socket.IO handshake requests

**Correct approach:**
```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default {
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      // Don't cache Socket.IO endpoints
      manifest: {
        // ...
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.example\.com\/socket\.io\/.*/,
            handler: 'NetworkOnly', // Never cache Socket.IO
            method: 'GET',
          },
        ],
      },
    }),
  ],
};
```

---

### Integration 3: React Router + Socket Lifecycle

**Common mistake:**
Creating new socket on every route change

**Correct approach:**
```typescript
// Create socket once at app root
function App() {
  const socket = useMemo(() => {
    const instance = io({
      transports: ['websocket', 'polling'],
    });
    return instance;
  }, []); // Only create once

  return (
    <SocketProvider socket={socket}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </SocketProvider>
  );
}
```

---

## "Looks Done But Isn't" Checklist

- [ ] **Socket cleanup**: Event listeners removed on unmount — Verify by navigating away and back 10 times, check console for duplicate logs
- [ ] **Reconnection**: App reconnects after network loss — Test with airplane mode toggle, watch connection status indicator
- [ ] **Virtualization**: List handles 10,000 messages — Load test data, scroll smoothly, monitor FPS
- [ ] **PWA updates**: New version loads automatically — Deploy change, verify update notification appears
- [ ] **TypeScript types**: All Socket.IO events typed — Search for `: any` in event handlers
- [ ] **Bundle size**: Socket.IO not > 50% of bundle — Run bundle analyzer, check size report
- [ ] **Offline mode**: Service worker serves cached shell — Disconnect internet, reload page
- [ ] **Mobile performance**: Scrolls smoothly on phone — Test on real device, use Chrome DevTools device mode
- [ ] **Memory leaks**: No growing heap over time — Open DevTools Memory profiler, use app for 10 minutes, take heap snapshots
- [ ] **Install prompt**: "Add to Home Screen" appears — Run Lighthouse PWA audit, test on mobile Chrome/Safari

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Memory leaks | HIGH | 1. Identify leak: Chrome DevTools Memory profiler<br>2. Find component missing cleanup<br>3. Add return () => socket.off()<br>4. Deploy fix<br>5. Existing users must refresh to clear accumulated listeners |
| Stale closures | MEDIUM | 1. Add useRef for frequently-accessed values<br>2. Rewrite useEffects to use refs<br>3. Test with changing data<br>4. Deploy - users see fix immediately |
| Missing virtualization | HIGH | 1. Install @tanstack/react-virtual<br>2. Rewrite message list component<br>3. Test with 10k messages<br>4. Deploy - large session users see immediate improvement |
| Cache staleness | LOW | 1. Implement skipWaiting() in service worker<br>2. Deploy new service worker<br>3. Existing users see update on next navigation |
| Reconnection failure | MEDIUM | 1. Add online/offline event listeners<br>2. Implement retry logic<br>3. Add connection status indicator<br>4. Deploy - users with unstable connection see improvement |
| Type safety | MEDIUM | 1. Create ServerToClientEvents interface<br>2. Refactor all event handlers<br>3. Run TypeScript compiler<br>4. Deploy - prevents future runtime errors |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Socket.IO memory leaks | Phase 2: Core Integration | Run memory profiler for 10 min, heap should stabilize |
| useEffect stale closures | Phase 2: Core Integration | Unit tests with varying state, logs show current values |
| Missing virtualization | Phase 3: UI Components | Load 10k test messages, scroll smoothly at 60 FPS |
| Service worker cache staleness | Phase 4: PWA Features | Deploy new version, update notification appears within 5 min |
| Reconnection failure | Phase 2: Core Integration | Toggle airplane mode 5 times, reconnects automatically each time |
| TypeScript type safety | Phase 1: Foundation | TypeScript compiler has zero `any` in event handlers |
| useEffect infinite loops | Phase 1: Foundation | ESLint react-hooks passes with zero warnings |
| Bundle size bloat | Phase 5: Performance Optimization | Bundle analyzer shows main bundle < 200KB gzipped |
| CORS misconfiguration | Phase 2: Core Integration | Test on mobile device, connection succeeds |
| Missing PWA install prompt | Phase 4: PWA Features | Lighthouse PWA score > 90, install prompt appears |

---

## Sources

### React + Socket.IO Issues
- [Connection leak with a Socket.IO component in React](https://stackoverflow.com/questions/74148013/connection-leak-with-a-socket-io-component-in-react) - StackOverflow
- [This React Bug Breaks Realtime Apps](https://www.instagram.com/reel/DTfxyuoDdBW/) - Instagram (stale closures)
- [Building Real-time Chat with Socket.io and React Query](https://dev.to/krifiz/building-real-time-chat-with-socketio-and-react-query-39kd) - Dev.to (proper socket lifecycle)
- [Socket.IO Memory Leak Issue #3477](https://github.com/socketio/socket.io/issues/3477) - GitHub
- [Socket.IO EventEmitter memory leak #4708](https://github.com/socketio/socket.io/issues/4708) - GitHub

### React Performance
- [Optimizing React App Performance: Top Fixes for 2026](https://www.linkedin.com/posts/md-arshad-khan-b29ba8184_home-md-arshad-khan-full-stack-engineer-activity-7414285718082084864-C7rl) - LinkedIn (TanStack Virtual: 10k rows like 20)
- [15 React Concepts Every Frontend Engineer Must Know in 2026](https://medium.com/codetodeploy/15-react-concepts-every--front-end-engineer-must-know-in-2026-25549bb1656a) - Medium (concurrent rendering)
- [React Performance Optimization: 15 Best Practices for 2025](https://dev.to/alex_bobes/react-performance-optimization-15-best-practices-for-2025-17l9) - Dev.to (10k items crash)
- [How to speed up long lists with TanStack Virtual](https://blog.logrocket.com/speed-up-long-lists-tanstack-virtual/) - LogRocket (livestream chat)
- [List Virtualization — Rendering Millions of Rows](https://ehosseini.info/articles/list-virtualization/) - Technical blog
- [Why React apps feel slow (even after memo)](https://www.reddit.com/r/reactjs/comments/1q2oqjx/why_react_apps_feel_slow_even_after_memo/) - Reddit

### useEffect & Hooks
- [useEffect infinite loop when updating state](https://stackoverflow.com/questions/74953685/useeffect-infinite-loop-when-updating-state-and-including-dependency-array) - StackOverflow
- [Why Updating State in useEffect Can Lead to Infinite Loops](https://medium.com/@conboys111/why-updating-state-in-useeffect-can-lead-to-infinite-loops-and-how-to-fix-it-64fd08dea1e7) - Medium
- [How to Solve the Infinite Loop of React.useEffect()](https://dmitripavlutin.com/react-useeffect-infinite-loop/) - Dmitry Pavlutin
- [Three Ways to Cause Infinite Loops When Using UseEffect](https://dev.to/oyedeletemitope/three-ways-to-cause-infinite-loops-when-using-useeffect-in-react-and-how-to-prevent-them-3ip3) - Dev.to
- [Avoiding Infinite Loops When Utilizing useEffect()](https://blogs.perficient.com/2024/12/16/avoiding-infinite-loops-when-utilizing-useeffect-in-reactjs/) - Perficient

### PWA Service Workers
- [What should I do to update service workers and cached PWA files](https://stackoverflow.com/questions/57372925/what-should-i-do-to-update-service-workers-and-cached-pwa-files) - StackOverflow
- [Invalidate cache by service worker · Issue #3665](https://github.com/facebook/create-react-app/issues/3665) - GitHub
- [Strategies for Service Worker Caching for PWAs](https://hasura.io/blog/strategies-for-service-worker-caching-d66f3c828433) - Hasura
- [Caching Strategies for Performance: Service Workers & PWAs](https://medium.com/@sonali.nogja.08/caching-strategies-for-performance-service-workers-pwas-b9cd808dfbf6) - Medium
- [Cache Busting a React App](https://dev.to/flexdinesh/cache-busting-a-react-app-22lk) - Dev.to
- [Caching - Progressive web apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching) - MDN
- [update cache on new version using skipWaiting()](https://stackoverflow.com/questions/61040426/service-worker-update-cache-on-new-version-using-skipwaiting) - StackOverflow
- [PWA update notifications in a React application](https://medium.com/toplyne-engineering/pwa-update-notifications-in-a-react-application-f5680d51bb2) - Medium
- [ServiceWorkerGlobalScope.skipWaiting()](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting) - MDN
- [Service Worker Lifecycle Explained](https://felixgerschau.com/service-worker-lifecycle-update/) - Felix Gerschau

### Socket.IO + PWA Offline/Online
- [Progressive Web App: How to detect and handle when connection is up again](https://stackoverflow.com/questions/44756154/progressive-web-app-how-to-detect-and-handle-when-connection-is-up-again) - StackOverflow
- [Why socket.io doesn't work after internet reconnection?](https://github.com/socketio/socket.io/issues/3462) - GitHub
- [socket.io doesn't work in offline apps](https://github.com/socketio/socket.io-client/issues/293) - GitHub
- [Socket-io will not reconnect to React Native background apps](https://github.com/feathersjs/feathers/issues/1832) - GitHub
- [Handle users' online-offline status with Socket.io](https://medium.com/@ruveydayilmaz/handle-users-online-offline-status-with-socket-io-e92113c07eac) - Medium

### Socket.IO TypeScript & Auth
- [TypeScript - Socket.IO Docs](https://socket.io/docs/v4/typescript/) - Official docs
- [How to create a simple react hook for stateful events?](https://github.com/socketio/socket.io/discussions/5144) - GitHub Discussion
- [Build a real-time voting app with WebSockets, React & TypeScript](https://wasp.sh/blog/2023/08/09/build-real-time-voting-app-websockets-react-typescript) - Wasp
- [Typescript, React & Socket.io-client Tests](https://stackoverflow.com/questions/71849917/typescript-react-socket-io-client-tests) - StackOverflow

### Bundle Size & Performance
- [React Performance Optimization: From Memoization to Code Splitting](https://medium.com/@dlrnjstjs/react-performance-optimization-from-memoization-to-code-splitting-9b32a7ddd9c0) - Medium
- [Optimize React App Performance By Code Splitting](https://www.velotio.com/engineering-blog/optimize-react-app-performance-by-code-splitting) - Velotio
- [Code-Splitting](https://legacy.reactjs.org/docs/code-splitting.html) - React docs
- [Best Practices for Optimizing React Apps for Mobile](http://www.zigpoll.com/content/what-are-some-best-practices-for-optimizing-react-applications-to-improve-load-performance-on-mobile-devices) - Zigpoll
- [Optimizing Bundle Splitting: A Deep Dive](https://briandouglas.me/posts/2025/08/23/optimizing-bundle-splitting/) - Brian Douglas (1158KB → 204KB case study)
- [A Case Study of React PWA Performance Optimization](https://itnext.io/a-case-study-of-a-react-pwa-performance-optimization-5e7bf26acffb) - ITNext
- [WebSocket vs Socket.IO which one should be preferred](https://www.reddit.com/r/node/comments/1lkzxzb/websocket_vs_socketio_which_one_should_be/) - Reddit
- [Stop Using WebSockets for Everything](https://medium.com/@ppp.mishra124/stop-using-websockets-for-everything-and-other-real-time-mistakes-youre-probably-making-2290394badde) - Medium

### CORS & Integration
- [Socket.IO 跨域问题解决方案与配置详解](https://comate.baidu.com/zh/page/h5kwf2brg2j) - Baidu COMATE (CORS v3+)
- [Can´t resolve React & SOCKET.IO CORS Error](https://stackoverflow.com/questions/50639337/can%25C2%25B4t-resolve-react-socket-io-cors-error) - StackOverflow
- [Common Socket.io Installation Mistakes](https://moldstud.com/articles/p-common-socketio-installation-mistakes-how-to-avoid-them-for-smooth-setup) - MoldStud

---
*Pitfalls research for: React PWA with Socket.IO Real-time Communication*
*Researched: 2026-02-06*
