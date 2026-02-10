# Phase 07: SDK & Integration - Research

**Researched:** 2025-02-10
**Domain:** JavaScript/TypeScript SDK for iframe embedding with postMessage communication
**Confidence:** HIGH

## Summary

This phase involves creating a JavaScript/TypeScript SDK that enables external applications to embed the ai-bridge-web application via iframe and communicate through the postMessage API. The SDK will provide a simple, type-safe API for external apps to send messages to Claude, receive responses, and handle connection state with automatic error recovery.

Based on comprehensive research of existing iframe communication SDKs (Stripe.js, Whop, @veriff/incontext-sdk, @sanity/comlink), postMessage best practices from MDN, and modern TypeScript package development patterns, the standard approach is clear:

1. **Build as separate npm package** using Vite library mode or tsup for bundling
2. **Use TypeScript with Zod** for runtime type safety on postMessage messages
3. **Implement request-response pattern** with Promise-based API over postMessage
4. **Provide automatic iframe management** with origin validation and error recovery
5. **Support both ESM and CJS** formats for maximum compatibility

**Primary recommendation:** Build `@ai-bridge/sdk` as a standalone TypeScript npm package using Vite library mode, implementing a bidirectional postMessage bridge with Zod schema validation, automatic iframe lifecycle management, and connection state tracking.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **TypeScript** | ~5.9.3 | Type safety and definitions | Project already uses TS; industry standard for SDKs |
| **Vite** | ^7.2.4 | Library mode bundling | Already in project; excellent library mode with zero-config |
| **Zod** | ^4.3.6 | Runtime schema validation | Already in project; best-in-class for postMessage type safety |
| **esbuild** | (via Vite/tsup) | Fast compilation | Vite uses esbuild under the hood; fastest build times |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **tsup** | ^8.0.0 | Alternative bundler | If Vite library mode proves insufficient (unlikely) |
| **@types/node** | ^24.10.1 | Node.js types | For SDK server-side compatibility testing |
| **vitest** | (with Vite) | Unit testing | Already in Vite ecosystem; use for SDK tests |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| **Vite library mode** | tsup | tsup is faster (37ms vs 1.4s) but Vite already in project, better integration |
| **Zod** | io-ts, yup | Zod has better TypeScript inference, already in project |
| **Custom postMessage** | @sanity/comlink | Comlink is mature but overkill; our needs are simpler |
| **Standalone SDK** | Monorepo with web | Monorepo adds complexity; SDK has separate release cycle |

**Installation (SDK package):**
```bash
# In new SDK package directory
npm install typescript zod
npm install -D vite @types/node

# For testing
npm install -D vitest @vitest/ui
```

## Architecture Patterns

### Recommended Project Structure

```
sdk/
├── src/
│   ├── index.ts                 # Main SDK entry point
│   ├── types/
│   │   ├── messages.ts          # Message type definitions
│   │   ├── config.ts            # SDK configuration types
│   │   └── events.ts            # Event types
│   ├── core/
│   │   ├── Bridge.ts            # Core postMessage bridge
│   │   ├── IframeManager.ts     # iframe lifecycle management
│   │   ├── Connection.ts        # Connection state tracking
│   │   └── MessageHandler.ts    # Message routing/handling
│   ├── validation/
│   │   └── schemas.ts           # Zod schemas for runtime validation
│   ├── utils/
│   │   ├── logger.ts            # Internal logging
│   │   └── reconnection.ts      # Reconnection logic
│   └── client.ts                # Public API client class
├── test/
│   ├── unit/
│   └── integration/
├── examples/
│   └── react/                   # React integration example
├── package.json
├── tsconfig.json
├── vite.config.ts               # Library mode configuration
└── README.md
```

**Web app modifications:**
```
web/src/
├── sdk-bridge/                  # New: SDK integration in web app
│   ├── messages/
│   │   ├── handlers.ts          # Handle messages from SDK
│   │   └── types.ts             # Shared message types (import from SDK)
│   ├── SdkMessageListener.tsx   # React component to listen for SDK messages
│   └── index.ts                 # Setup SDK bridge on app mount
```

### Pattern 1: Bidirectional postMessage with Request-Response

**What:** Parent window and iframe communicate via postMessage with a promise-based API that supports both simple messages and request-response pairs.

**When to use:** When you need to send commands from parent to iframe and receive responses asynchronously (e.g., sendMessage(text) → response).

**Example (SDK side - parent):**
```typescript
// Source: Based on @stripe/stripe-js, @whop-apps/iframe, MDN postMessage
import { z } from 'zod';

// Message schemas for runtime validation
const SendMessageSchema = z.object({
  type: z.literal('sendMessage'),
  payload: z.object({
    text: z.string(),
    sessionId: z.string().optional(),
  }),
});

const MessageResponseSchema = z.object({
  type: z.literal('messageResponse'),
  payload: z.object({
    success: z.boolean(),
    data: z.object({
      messageId: z.string(),
      content: z.string(),
    }).optional(),
    error: z.string().optional(),
  }),
});

export class AIBridgeSDK {
  private iframe: HTMLIFrameElement | null = null;
  private messageQueue: Map<string, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();
  private messageId = 0;

  constructor(config: SDKConfig) {
    this.initializeIframe(config);
  }

  async sendMessage(text: string): Promise<MessageResponse> {
    if (!this.iframe?.contentWindow) {
      throw new Error('Iframe not ready');
    }

    const messageId = `msg_${Date.now()}_${this.messageId++}`;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.messageQueue.delete(messageId);
        reject(new Error('Message timeout'));
      }, 30000); // 30 second timeout

      this.messageQueue.set(messageId, { resolve, reject, timeout });

      // Send message to iframe
      this.iframe.contentWindow.postMessage({
        type: 'sendMessage',
        payload: { text, messageId },
      }, this.config.targetOrigin);
    });
  }

  private handleMessage = (event: MessageEvent) => {
    // Validate origin
    if (event.origin !== this.config.targetOrigin) {
      return;
    }

    // Validate message structure with Zod
    try {
      const message = MessageResponseSchema.parse(event.data);

      // Resolve pending request
      const pending = this.messageQueue.get(message.payload.messageId);
      if (pending) {
        clearTimeout(pending.timeout);
        this.messageQueue.delete(message.payload.messageId);
        pending.resolve(message.payload);
      }
    } catch (error) {
      // Invalid message format, ignore
      console.warn('Invalid message received:', error);
    }
  };
}
```

**Example (Web app side - iframe):**
```typescript
// web/src/sdk-bridge/handlers.ts
import { z } from 'zod';

const SendMessageSchema = z.object({
  type: z.literal('sendMessage'),
  payload: z.object({
    text: z.string(),
    sessionId: z.string().optional(),
    messageId: z.string(),
  }),
});

export function setupSdkMessageListener() {
  window.addEventListener('message', async (event: MessageEvent) => {
    // Validate origin - only accept from configured parent
    if (event.origin !== allowedParentOrigin) {
      return;
    }

    try {
      const message = SendMessageSchema.parse(event.data);

      // Handle the message
      if (message.type === 'sendMessage') {
        const response = await handleSendMessage(message.payload);

        // Send response back to parent
        event.source?.postMessage({
          type: 'messageResponse',
          payload: {
            messageId: message.payload.messageId,
            ...response,
          },
        }, event.origin);
      }
    } catch (error) {
      console.error('Error handling SDK message:', error);
    }
  });
}
```

### Pattern 2: Connection State Management with Heartbeat

**What:** Track connection state (connected, disconnected, error) with automatic reconnection using heartbeat messages.

**When to use:** When iframe can lose connection (network issues, parent page refresh) and needs automatic recovery.

**Example:**
```typescript
// Source: Based on Twilio TaskRouter, PubNub connection management
export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

export class ConnectionManager {
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private missedHeartbeats = 0;
  private readonly MAX_MISSED_HEARTBEATS = 3;

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 5000); // Every 5 seconds

    // Listen for heartbeat responses
    window.addEventListener('message', this.handleHeartbeatResponse);
  }

  private sendHeartbeat() {
    this.iframe?.contentWindow?.postMessage({
      type: 'heartbeat',
      timestamp: Date.now(),
    }, this.targetOrigin);

    this.missedHeartbeats++;
    if (this.missedHeartbeats > this.MAX_MISSED_HEARTBEATS) {
      this.handleDisconnection();
    }
  }

  private handleHeartbeatResponse = (event: MessageEvent) => {
    if (event.data.type === 'heartbeatAck') {
      this.missedHeartbeats = 0;
      if (this.state !== ConnectionState.CONNECTED) {
        this.setState(ConnectionState.CONNECTED);
      }
    }
  };

  private handleDisconnection() {
    this.setState(ConnectionState.DISCONNECTED);
    this.stopHeartbeat();

    // Attempt reconnection with exponential backoff
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    setTimeout(() => this.reconnect(), delay);
  }
}
```

### Pattern 3: Context Injection on Initialization

**What:** Pass initial configuration/context when creating iframe (URL params or postMessage handshake).

**When to use:** When iframe needs initial data (sessionId, API config, theme) before first user interaction.

**Example:**
```typescript
// URL-based context injection (simpler, one-way)
const sdk = new AIBridgeSDK({
  url: 'https://ai-bridge.example.com/embed',
  context: {
    sessionId: 'sess_123',
    theme: 'dark',
    locale: 'en-US',
    initialMessage: 'Help me debug this code',
  },
});

// SDK constructs iframe URL
const iframeUrl = new URL(config.url);
iframeUrl.searchParams.set('sessionId', context.sessionId);
iframeUrl.searchParams.set('theme', context.theme);
this.iframe.src = iframeUrl.toString();

// Or handshake-based (more secure, two-way)
private performHandshake() {
  return new Promise((resolve, reject) => {
    const handler = (event: MessageEvent) => {
      if (event.data.type === 'handshakeAck') {
        window.removeEventListener('message', handler);
        resolve(event.data.payload);
      }
    };

    window.addEventListener('message', handler);

    // Send handshake with context
    this.iframe.contentWindow?.postMessage({
      type: 'handshake',
      payload: this.config.context,
    }, this.config.targetOrigin);

    // Timeout
    setTimeout(() => {
      window.removeEventListener('message', handler);
      reject(new Error('Handshake timeout'));
    }, 5000);
  });
}
```

### Anti-Patterns to Avoid

- **Using '*' as targetOrigin:** Major security vulnerability. Always specify exact origin.
- **No origin validation:** Allows malicious sites to send messages to your iframe. Always validate `event.origin`.
- **No message type validation:** Runtime errors from malformed messages. Use Zod schemas.
- **Blocking main thread with heavy computation:** Freeze iframe UI. Use Web Workers for heavy processing.
- **No timeout on requests:** Infinite promises if iframe crashes. Always implement timeouts.
- **Leaking event listeners:** Memory leaks. Always remove listeners in cleanup methods.
- **Assuming iframe is ready:** Race conditions. Wait for iframe 'load' event before communicating.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| **postMessage request-response** | Custom Promise wrapper with message ID tracking | Study @whop-apps/iframe, @sanity/comlink patterns | Message correlation, timeout handling, cleanup are complex |
| **Runtime type validation** | Custom type guards | **Zod** | Type inference, error messages, composability are superior |
| **Library bundling** | Rollup config from scratch | **Vite library mode** | Zero-config, dual ESM/CJS, TypeScript integration |
| **Reconnection logic** | Custom setTimeout loops | Study Twilio TaskRouter, PubNub patterns | Exponential backoff, heartbeat monitoring, state management are tricky |
| **iframe lifecycle** | Manual createElement/remove | Study @veriff/incontext-sdk | Load detection, error handling, cleanup are edge-case heavy |

**Key insight:** postMessage looks simple (send/receive), but building a production-ready SDK with error handling, type safety, and connection management is 80% edge cases. Use established patterns from Stripe.js, Whop, and Sanity rather than inventing your own.

## Common Pitfalls

### Pitfall 1: Missing Origin Validation

**What goes wrong:** Malicious websites can embed your iframe and send/receive messages, leading to data theft or unauthorized actions.

**Why it happens:** Developers copy-paste examples using `*` as targetOrigin or skip origin checks.

**How to avoid:**
```typescript
// BAD - accepts messages from ANY origin
window.addEventListener('message', (event) => {
  // Process event.data without checking event.origin
});

// GOOD - only accepts from trusted origin
const ALLOWED_ORIGINS = ['https://trusted-domain.com'];

window.addEventListener('message', (event) => {
  if (!ALLOWED_ORIGINS.includes(event.origin)) {
    console.warn('Message from untrusted origin:', event.origin);
    return;
  }
  // Process event.data
});

// Also validate on send
iframe.contentWindow.postMessage(
  message,
  'https://specific-origin.com' // NOT '*'
);
```

**Warning signs:** Using `*` as targetOrigin, no origin check in message handler.

### Pitfall 2: No Runtime Type Validation

**What goes wrong:** TypeScript types are compile-time only. Malicious or buggy sender sends invalid data → runtime errors, crashes.

**Why it happens:** Developers assume TypeScript types protect at runtime (they don't).

**How to avoid:**
```typescript
// Use Zod for runtime validation
import { z } from 'zod';

const MessageSchema = z.object({
  type: z.literal('sendMessage'),
  payload: z.object({
    text: z.string().max(1000),
  }),
});

window.addEventListener('message', (event) => {
  try {
    const message = MessageSchema.parse(event.data);
    // Now `message` is properly typed and validated
  } catch (error) {
    console.error('Invalid message:', error);
    return; // Skip invalid messages
  }
});
```

**Warning signs:** Type assertions (`as Message`), `any` types, no validation before accessing properties.

### Pitfall 3: Memory Leaks from Event Listeners

**What goes wrong:** Event listeners accumulate → memory grows → performance degrades, browser crashes.

**Why it happens:** Adding listeners but never removing them, especially on singletons/global objects.

**How to avoid:**
```typescript
class AIBridgeSDK {
  private messageHandler: (event: MessageEvent) => void;

  constructor() {
    // Bind handler to instance for easy removal
    this.messageHandler = this.handleMessage.bind(this);
    window.addEventListener('message', this.messageHandler);
  }

  destroy() {
    // IMPORTANT: Remove listener
    window.removeEventListener('message', this.messageHandler);
    this.messageQueue.clear();
    this.iframe?.remove();
  }
}
```

**Warning signs:** No `destroy()` or `cleanup()` method, listeners added without storing reference.

### Pitfall 4: Race Conditions on Iframe Load

**What goes wrong:** Trying to send messages before iframe is ready → messages lost, "no response" errors.

**Why it happens:** Assuming iframe is ready immediately after setting `src`.

**How to avoid:**
```typescript
// BAD
iframe.src = url;
iframe.contentWindow.postMessage(message, origin); // FAILS

// GOOD
await new Promise((resolve) => {
  iframe.addEventListener('load', resolve, { once: true });
  iframe.src = url;
});
iframe.contentWindow.postMessage(message, origin); // WORKS

// BETTER - with timeout
await Promise.race([
  new Promise((resolve) => {
    iframe.addEventListener('load', resolve, { once: true });
    iframe.src = url;
  }),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Iframe load timeout')), 10000)
  ),
]);
```

**Warning signs:** No 'load' event listener, immediate postMessage after setting src.

### Pitfall 5: Inadequate Error Recovery

**What goes wrong:** One network hiccup → SDK stuck in error state forever, requires page refresh.

**Why it happens:** Treating errors as fatal instead of transient.

**How to avoid:**
```typescript
class ConnectionManager {
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;

  async handleError(error: Error) {
    // Distinguish between fatal and transient errors
    if (this.isFatalError(error)) {
      this.setState(ConnectionState.ERROR);
      this.onError?.(error);
      return;
    }

    // Transient error - attempt reconnection
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      await this.delay(delay);
      await this.reconnect();
    } else {
      this.setState(ConnectionState.ERROR);
      this.onError?.(new Error('Max reconnection attempts reached'));
    }
  }
}
```

**Warning signs:** No reconnection logic, all errors treated as fatal, no exponential backoff.

### Pitfall 6: Ignoring Same-Site Cookie Restrictions

**What goes wrong:** Third-party cookie blocking (Safari ITP, Firefox ETP) breaks authentication → users logged out unexpectedly.

**Why it happens:** Assuming cookies work across iframe boundaries unconditionally.

**How to avoid:**
```typescript
// Detect if third-party cookies are blocked
async checkThirdPartyCookies(): Promise<boolean> {
  const testResult = await this.iframe?.contentWindow?.postMessage({
    type: 'checkCookies',
  }, this.targetOrigin);

  // If cookies blocked, warn user or use alternative auth
  if (!testResult.cookiesWork) {
    console.warn('Third-party cookies blocked. Some features may not work.');
    return false;
  }
  return true;
}
```

**Warning signs:** No cookie detection, auth failures in iframe only, Safari/Firefox specific issues.

## Code Examples

Verified patterns from official sources:

### Vite Library Mode Configuration

```typescript
// Source: https://vitejs.dev/guide/build.html#library-mode
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'AIBridgeSDK',
      fileName: (format) => `ai-bridge-sdk.${format}.js`,
      formats: ['es', 'umd'] // ESM for modern, UMD for CDN
    },
    rollupOptions: {
      external: ['react', 'react-dom'], // Don't bundle React
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
});
```

### Package.json for SDK

```json
// Source: Vite library mode docs + Stripe.js package.json
{
  "name": "@ai-bridge/sdk",
  "version": "1.0.0",
  "type": "module",
  "files": ["dist"],
  "main": "./dist/ai-bridge-sdk.umd.cjs",
  "module": "./dist/ai-bridge-sdk.es.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/ai-bridge-sdk.es.js",
      "require": "./dist/ai-bridge-sdk.umd.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch",
    "test": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": ">=19.0.0",
    "react-dom": ">=19.0.0"
  },
  "dependencies": {
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "vite": "^7.2.4",
    "typescript": "~5.9.3",
    "vitest": "^2.0.0"
  }
}
```

### Strongly-Typed Message Definitions

```typescript
// Source: Based on @stripe/stripe-js types, Zod docs
import { z } from 'zod';

// Define message types
export const SendMessagePayloadSchema = z.object({
  text: z.string().min(1).max(10000),
  sessionId: z.string().uuid().optional(),
  context: z.record(z.any()).optional(),
});

export const MessageResponseSchema = z.object({
  messageId: z.string(),
  success: z.boolean(),
  content: z.string().optional(),
  error: z.string().optional(),
  metadata: z.object({
    model: z.string(),
    tokensUsed: z.number(),
  }).optional(),
});

export type SendMessagePayload = z.infer<typeof SendMessagePayloadSchema>;
export type MessageResponse = z.infer<typeof MessageResponseSchema>;

// Union type for all messages
export const SdkMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('init'),
    payload: z.object({
      sessionId: z.string().optional(),
      theme: z.enum(['light', 'dark']).optional(),
    }),
  }),
  z.object({
    type: z.literal('sendMessage'),
    payload: SendMessagePayloadSchema,
  }),
  z.object({
    type: z.literal('disconnect'),
  }),
]);

export type SdkMessage = z.infer<typeof SdkMessageSchema>;
```

### Complete SDK Usage Example

```typescript
// External application using the SDK
import { AIBridgeSDK } from '@ai-bridge/sdk';

// Initialize SDK
const sdk = new AIBridgeSDK({
  // URL where ai-bridge-web is hosted
  url: 'https://ai-bridge.example.com',

  // Trusted origin (security)
  targetOrigin: 'https://ai-bridge.example.com',

  // Initial configuration
  context: {
    sessionId: 'sess_abc123',
    theme: 'dark',
  },

  // Event listeners
  onMessage: (message) => {
    console.log('Received:', message);
  },

  onStateChange: (state) => {
    console.log('Connection state:', state);
  },

  onError: (error) => {
    console.error('SDK error:', error);
  },
});

// Mount iframe to DOM
document.getElementById('ai-bridge-container')?.appendChild(sdk.iframe);

// Send a message
try {
  const response = await sdk.sendMessage({
    text: 'Help me debug this React component',
    sessionId: 'sess_abc123',
  });

  console.log('Claude response:', response.content);
  console.log('Tokens used:', response.metadata?.tokensUsed);
} catch (error) {
  console.error('Failed to send message:', error);
}

// Cleanup when done
sdk.destroy();
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| **Manual Rollup/Webpack config** | Vite library mode / tsup | 2023-2024 | 10x faster builds, zero-config |
| **Type assertions for runtime** | Zod schemas | 2022-2023 | Type-safe runtime validation |
| **Callback-based messaging** | Promise-based with async/await | 2020-2021 | Cleaner code, better error handling |
| **Cookie-based auth only** | Token injection + cookie fallback | 2024-2025 | Works with ITP/ETP enabled |
| **No reconnection** | Heartbeat + auto-reconnect | 2021-2022 | Resilient to network issues |

**Deprecated/outdated:**
- **Manual iframe polling:** Use postMessage events instead
- **`window.frames[]` access:** Blocked by cross-origin; use postMessage
- **JSON.stringify/parse without validation:** Use Zod schemas
- **Wildcards (`*`) in postMessage:** Security vulnerability; always specify origin
- **Synchronous cross-origin requests:** Blocked by browsers; use postMessage async

## Open Questions

1. **Authentication Strategy for Embedded Iframes**
   - **What we know:** Third-party cookie blocking (Safari ITP, Firefox ETP) breaks cookie-based auth in cross-origin iframes.
   - **What's unclear:** Whether ai-bridge backend has token-based auth that can be injected via URL params or postMessage.
   - **Recommendation:** Investigate existing auth mechanism in Phase 1. If cookie-only, need to add token-based auth for iframe use case. Consider using short-lived tokens passed via URL params during handshake.

2. **Message Size Limits**
   - **What we know:** postMessage has practical size limits (varies by browser, ~32MB+ theoretical, but fragmentation issues above 1MB).
   - **What's unclear:** Maximum expected message size for Claude responses (code blocks, file contents).
   - **Recommendation:** Test with large Claude responses. If >1MB, implement chunking protocol or switch to sending only message IDs and fetching content via HTTP API.

3. **Multiple Iframe Instances**
   - **What we know:** Some implementations (whop, sanity) support multiple iframes on same page.
   - **What's unclear:** Whether ai-bridge needs to support multiple concurrent instances (e.g., multiple Claude sessions embedded).
   - **Recommendation:** Start with single-instance SDK. If use cases emerge for multiple instances, design message protocol to include instance IDs (all postMessage libraries do this).

4. **Browser Compatibility Targets**
   - **What we know:** postMessage is widely supported (IE8+), modern ES features have less coverage.
   - **What's unclear:** Project's browser support requirements (IE11? Only evergreen browsers?).
   - **Recommendation:** Since project uses Vite with ES2015 target, assume modern browsers. If older browser support needed, adjust Vite config and avoid newer features (optional chaining, nullish coalescing).

## Sources

### Primary (HIGH confidence)

- **[/vitejs/vite](https://vitejs.dev/)** - Library mode configuration, build setup, TypeScript integration
- **[MDN Web Docs - Window.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)** (Updated Nov 30, 2025) - Official postMessage API documentation, security best practices
- **[@stripe/stripe-js](https://github.com/stripe/stripe-js)** - Industry-standard iframe SDK pattern, TypeScript types, Promise-based API
- **Zod Documentation** - Runtime schema validation, TypeScript type inference

### Secondary (MEDIUM confidence)

- **[@whop-apps/iframe](https://www.npmjs.com/package/@whop-apps/iframe)** - Request-response pattern over postMessage
- **[@veriff/incontext-sdk](https://www.npmjs.com/package/@veriff/incontext-sdk)** - iframe lifecycle management, event handling
- **[@sanity/comlink](https://github.com/sanity-io/visual-editing/tree/main/packages/comlink)** - Connection state management, heartbeat pattern
- **Twilio TaskRouter Reconnect Logic** - WebSocket reconnection patterns applicable to postMessage
- **PubNub Connection Management** - Connection status tracking, error recovery
- **[tsup Documentation](https://tsup.egoist.dev/)** - Alternative to Vite library mode

### Tertiary (LOW confidence)

- **WebSearch results on iframe communication patterns 2025** - General best practices, community patterns
- **[PostMessage Vulnerabilities - Medium](https://medium.com/@instatunnel/postmessage-vulnerabilities-when-cross-window-communication-goes-wrong-4c82a5e8da63)** (Nov 3, 2025) - Security considerations
- **[Strongly-Typed IFrame Messaging - Nick White](https://nickwhite.cc/blog/strongly-typed-iframe-messaging/)** (Dec 29, 2021) - TypeScript patterns for postMessage
- **[Mastering the `<iframe>` Tag in React with TypeScript - DEV.to](https://dev.to/serifcolakel/mastering-the-tag-in-react-with-typescript-a-comprehensive-guide-27m6)** (Feb 23, 2025) - iframe best practices
- **[@ticatec/iframe-message-bridge](https://www.npmjs.com/package/@ticatec/iframe-message-bridge)** - postMessage wrapper library
- **[Penpal - npm](https://www.npmjs.com/package/penpal)** (488,400 weekly downloads) - Promise-based postMessage library

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH - Vite, TypeScript, Zod are industry standards with excellent documentation
- **Architecture:** HIGH - Patterns from Stripe.js, Whop, Sanity are proven in production at scale
- **Pitfalls:** HIGH - MDN documentation and security articles provide authoritative guidance
- **Integration specifics:** MEDIUM - Web app structure understood, but exact auth mechanism needs verification

**Research date:** 2025-02-10
**Valid until:** 2025-03-10 (30 days - stable domain, but check for new Vite/Zod versions)

**Key assumptions to verify:**
1. ai-bridge backend authentication mechanism (cookie vs token)
2. Expected maximum message/response sizes
3. Browser support requirements
4. Whether multiple concurrent iframe instances are needed
