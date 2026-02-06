# Project Research Summary

**Project:** AI-Bridge-Web (PWA Frontend for AI-Bridge Backend)
**Domain:** React PWA with Real-Time Socket.IO Communication
**Researched:** 2025-02-06
**Confidence:** HIGH

## Executive Summary

AI-Bridge-Web is a Progressive Web App (PWA) frontend that provides remote access to Claude Code CLI through the existing AI-Bridge Go backend. The product belongs to the well-established "real-time chat interface" domain with specific requirements for AI coding assistant workflows.

**Expert Approach:** Research confirms that modern React PWAs with TanStack Query for server state management and Socket.IO for real-time communication represent the industry-standard architecture for this use case. The recommended stack leverages React 19.2 for latest features, Vite for lightning-fast builds, and shadcn/ui for accessible, customizable components. This combination provides production-ready patterns proven at scale by companies like Vercel, Netflix, and countless startups.

**Critical Success Factors:** The two highest-risk areas are (1) proper Socket.IO lifecycle management to prevent memory leaks—a notorious issue in React apps that causes crashes after extended use—and (2) implementing incremental message sync with virtualization to handle sessions with 10,000+ messages without performance degradation. Research provides concrete prevention patterns for both risks. Additionally, PWA service worker update strategies must be implemented from day one to prevent users from running stale app versions after deployments.

**Differentiation Strategy:** Unlike competitor hapi (React Native) and existing web UIs, AI-Bridge-Web should focus on true PWA-first architecture with offline support, mobile-optimized gestures, and incremental sync optimization. The backend already supports the necessary HAPI-compatible APIs with pagination (`?since=`, `?limit=`), making this approach technically feasible. By avoiding feature creep (no file explorer, git integration, or complex collaboration), the product can deliver a focused, high-performance remote Claude Code experience.

## Key Findings

### Recommended Stack

**Core technologies:**
- **React 19.2** — Latest stable with new features (Activity, useEffectEvent), improved performance, production-ready since December 2024
- **Vite 5.4-6.x** — Lightning-fast HMR with native ESM, optimized production builds, minimal configuration
- **TypeScript 5.7** — Essential for catching bugs at compile time, superior developer experience
- **TanStack Query 5.84** — Server state management with automatic caching, background refetching, optimistic updates
- **Socket.IO Client 4.8** — Real-time WebSocket communication with automatic reconnection, event-based architecture
- **vite-plugin-pwa 0.21** — Zero-config PWA setup with Workbox v7 integration
- **shadcn/ui 2.9-3.5** — Copy-paste components built on Radix UI + Tailwind, full customization control
- **Tailwind CSS 3.4** — Utility-first CSS with JIT compiler, small production bundle
- **React Router 7.9** — Type-safe routing with nested routes, code splitting
- **Zod 3.24** — Schema validation for API responses with TypeScript type inference

**Critical version requirements:**
- React Router v7+ required for React 19 compatibility
- Socket.IO client must match backend server major version (backend uses Socket.IO)
- Node 18+ required for Workbox v7

### Expected Features

**Must have (table stakes for v1 MVP):**
- Real-time chat interface with streaming responses — Core interaction pattern for AI assistants
- Session management (create, view, delete, rename) — Multiple conversations is standard workflow
- Message history with pagination — Backend supports incremental sync (`?since=`, `?limit=`)
- Permission handling UI — Claude Code requires tool approvals (approve/deny modals)
- Slash command browser — CLI users expect command discovery and execution
- Mobile-responsive design — Remote access = mobile use case
- Dark/light theme — Developer tool standard expectation
- Project selection — Working directory picker for context switching
- Code syntax highlighting — Reading code without highlighting is unusable
- Loading/streaming indicators — Feedback during long responses

**Should have (competitive differentiators for v1.x):**
- PWA installability — "Add to Home Screen" for native-like experience (HIGH demand signal)
- Offline indicator — Clear feedback about connectivity state
- Keyboard shortcuts — Power user efficiency (e.g., Ctrl+K to send)
- Search across sessions — Find previous solutions and decisions
- Export conversation — Documentation and knowledge sharing
- Model selection — Choose Haiku/Sonnet/Opus per session

**Defer to v2+:**
- Voice input support — Mobile enhancement (wait for PWA validation)
- Diff viewer for code changes — Advanced review workflow
- File explorer integration — Browse projects in chat
- Git status overlay — See changed files
- Multi-session support — Parallel monitoring (high complexity)
- Offline message queue — Complex offline-first architecture
- Session teleportation — Requires backend `/teleport` support
- Collaborative editing — Very high complexity, questionable value

### Architecture Approach

**Feature-based architecture** organizes code by business capability (auth, sessions, chat) rather than technical role. Each feature module is self-contained with co-located components, hooks, API calls, and types. This enables parallel development and clear boundaries for testing.

**Server state vs client state separation** uses TanStack Query for server state (API data, cached, synchronized) and Zustand for client state (UI state, preferences). This prevents reinventing caching, provides automatic background refetching, and reduces boilerplate.

**Centralized Socket.IO manager** implements singleton pattern with typed events + TanStack Query cache invalidation. Single connection instance prevents duplicate event handlers, type-safe events enable autocomplete, and coordinated cache updates trigger UI re-renders.

**Incremental message sync** is critical for performance: load messages incrementally using pagination + real-time append-only updates. Backend already supports `?since=` and `?limit=` parameters. Use virtualization (@tanstack/react-virtual) to render only visible messages.

**Major components:**
1. **Presentation Layer** — Pages (routes), Layouts (app shell), Features (business logic), UI Components (shadcn/ui primitives)
2. **State Management Layer** — TanStack Query (server state), Zustand (client state), Socket.IO client (real-time layer)
3. **Data Layer** — API Services (REST calls), Socket Manager (WebSocket lifecycle)
4. **Backend Integration** — AI-Bridge Go backend with HAPI-compatible REST API + Socket.IO server

### Critical Pitfalls

1. **Socket.IO memory leaks in React components** — Event listeners accumulate without cleanup, causing crashes. Prevention: Always return cleanup function `() => socket.off('event', handler)` from useEffect. Verify with Chrome DevTools Memory profiler.

2. **useEffect stale closures with Socket.IO** — Callbacks reference stale state from previous renders. Prevention: Use refs for frequently updated values or functional state updates `setState(prev => ...)`. Critical for authentication tokens and permissions.

3. **Large message list rendering without virtualization** — Rendering 10,000+ messages crashes browser. Prevention: Use @tanstack/react-virtual from day one for any potentially-large dataset. Only render visible items with overscan.

4. **PWA service worker cache staleness** — Users continue using old JavaScript after deployments. Prevention: Implement `skipWaiting()` in service worker, show update notification, test update mechanism before deployment.

5. **Socket.IO reconnection failure** — App stays disconnected after network returns. Prevention: Listen to online/offline events, implement retry logic, show connection status indicator. Test with airplane mode toggling.

6. **TypeScript type safety lost with Socket.IO events** — Runtime errors from mismatched event data. Prevention: Create `ServerToClientEvents` and `ClientToServerEvents` interfaces, use typed socket instance.

7. **useEffect infinite loops** — Including state in dependencies while updating it in effect. Prevention: Use functional updates `setState(prev => ...)` or remove state from deps array. Use ESLint react-hooks plugin.

## Implications for Roadmap

Based on combined research, suggested phase structure:

### Phase 1: Foundation (Week 1)
**Rationale:** Establish project infrastructure before building features. Critical pitfalls (useEffect infinite loops, TypeScript type safety) must be prevented from day one.
**Delivers:** Configured Vite + React + TypeScript project, routing setup, base layout, shadcn/ui base components
**Addresses:** Project structure from ARCHITECTURE.md, core stack from STACK.md
**Avoids:** Pitfall 7 (infinite loops), Pitfall 6 (type safety)
**Features:** Dark/light theme, basic mobile-responsive layout

### Phase 2: Core Integration (Week 2)
**Rationale:** Highest-risk phase. Socket.IO integration patterns established here prevent memory leaks (Pitfall 1), stale closures (Pitfall 2), and reconnection failures (Pitfall 5). Must be done correctly before building features.
**Delivers:** TanStack Query setup, API service layer, Socket.IO singleton manager with typed events, reconnection handling
**Uses:** TanStack Query, Socket.IO Client, Zod from STACK.md
**Implements:** Socket.IO integration pattern from ARCHITECTURE.md
**Avoids:** Pitfalls 1, 2, 5, 9 (CORS)
**Features:** Backend connection, basic session API integration

### Phase 3: Session Management (Week 3)
**Rationale:** Session management is prerequisite for chat feature. Follows dependency: [Session Management] requires [Message History] requires [Pagination].
**Delivers:** Session list page, create session dialog, session detail page with routing
**Implements:** Feature-based architecture (sessions feature module)
**Features:** Session CRUD, project selection

### Phase 4: Real-Time Chat with Virtualization (Weeks 4-5)
**Rationale:** Core value prop. Must implement virtualization before handling real data to prevent Pitfall 3 (large message list rendering). Incremental sync pattern required for 10K+ message sessions.
**Delivers:** Message list with virtualization, message input with optimistic updates, streaming indicators, permission handling UI
**Implements:** Incremental message sync pattern, optimistic UI updates pattern
**Avoids:** Pitfall 3 (missing virtualization), Pitfall 2 (stale closures in message handlers)
**Features:** Real-time chat interface, message history with pagination, permission modals, code syntax highlighting, slash command browser

### Phase 5: PWA Features (Week 6)
**Rationale:** PWA installability is high-priority differentiator. Service worker update strategy must be implemented to prevent Pitfall 4 (cache staleness).
**Delivers:** Service worker registration, offline detection and banner, install prompt UI, PWA manifest configuration
**Implements:** PWA integration patterns from ARCHITECTURE.md
**Avoids:** Pitfall 4 (cache staleness), Pitfall 10 (missing install prompt)
**Features:** PWA installability, offline indicator

### Phase 6: Polish & Performance Optimization (Week 7)
**Rationale:** Performance traps (unnecessary re-renders, accumulating messages, missing React.memo) must be addressed after features work.
**Delivers:** Error boundaries, loading skeletons, toast notifications, performance optimization (code splitting, bundle analysis), accessibility audit
**Avoids:** Performance traps 1-3, Pitfall 8 (bundle size bloat)
**Features:** Keyboard shortcuts, export conversation, search across sessions, model selection

### Phase 7: Testing & Production Hardening (Week 8)
**Rationale:** E2E tests validate critical flows. Production monitoring catches issues before users do.
**Delivers:** E2E tests (Playwright), comprehensive error handling, production deployment configuration, monitoring setup

### Phase Ordering Rationale

- **Foundation → Core Integration**: Project infrastructure must exist before integrating backend
- **Core Integration → Session Management**: Socket.IO patterns established in Phase 2 prevent memory leaks in all subsequent features
- **Session Management → Real-Time Chat**: Sessions are prerequisite for chat (dependency chain from FEATURES.md)
- **Real-Time Chat → PWA Features**: Core chat functionality must work before optimizing for PWA
- **PWA Features → Polish**: Basic features first, then optimization (Premature optimization is the root of all evil)
- **Polish → Testing**: Cannot test what doesn't exist yet

**Feature grouping rationale:**
- Phase 1-2: Infrastructure (no user-visible features)
- Phase 3-4: Core functionality (MVP features)
- Phase 5-6: Enhancement (differentiators + performance)
- Phase 7: Production readiness

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 2 (Core Integration):** Socket.IO authentication flow with JWT tokens needs API research. Backend auth mechanism must be verified.
- **Phase 4 (Real-Time Chat):** Permission handling workflow specifics. Backend `/permissions/:requestId/approve` API exists, but exact request/response format needs validation.
- **Phase 5 (PWA Features):** Service worker caching strategy for API calls. Need to determine which endpoints should use NetworkFirst vs CacheFirst.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation):** Vite + React setup is well-documented. No research needed.
- **Phase 3 (Session Management):** Standard CRUD operations with TanStack Query. Patterns are established.
- **Phase 6 (Polish):** Performance optimization patterns are well-documented. No research needed.
- **Phase 7 (Testing):** Playwright E2E testing is standard. No research needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified with official docs (React 19.2, Vite, TanStack Query, Socket.IO). All technologies production-ready. |
| Features | HIGH | Competitor analysis (hapi, claude-code-webui, claudecodeui) directly from GitHub. PWA best practices from MDN official docs. |
| Architecture | HIGH | Patterns verified with official documentation (TanStack Query, Socket.IO). Feature-based architecture is industry standard. |
| Pitfalls | MEDIUM | Most pitfalls from StackOverflow, GitHub issues, and community articles. Prevention patterns verified but not all personally tested. |

**Overall confidence:** HIGH

All critical recommendations are backed by official documentation or verified community sources. Stack and architecture decisions are based on production-proven patterns. The only medium-confidence area is pitfalls research (some patterns from community articles, not official docs), but prevention strategies are well-established in the React ecosystem.

### Gaps to Address

**Minor gaps (can resolve during implementation):**
- **Socket.IO authentication mechanism:** Backend uses JWT tokens, but exact auth flow (header vs query param, token refresh) needs verification during Phase 2. Mitigation: Check backend source code or API documentation.
- **Permission API exact schema:** Backend endpoint exists (`/permissions/:requestId/approve`), but request body format needs validation. Mitigation: Test with backend during Phase 4.
- **Service worker cache expiration times:** Best practices recommend NetworkFirst for API calls, but exact expiration (1 hour vs 24 hours) depends on use case. Mitigation: Start with 1 hour, adjust based on user feedback.

**No critical gaps:** All foundational decisions (stack, architecture, features) are well-supported by research.

## Sources

### Primary (HIGH confidence - Official Documentation & Verified Sources)
- /facebook/react (v19.2.0) — React 19 features, stability, production readiness
- /vitejs/vite (v5.4.21, v7.0.0) — Vite configuration, React plugin, TypeScript setup
- /tanstack/query (v5.84.1) — TanStack Query React integration, server state patterns
- /websites/socket_io_v4_client-api — Socket.IO client API, TypeScript integration
- /websites/ui_shadcn — shadcn/ui installation, Vite configuration, component system
- [tiann/hapi](https://github.com/tiann/hapi) — Mobile-first Claude Code remote interface
- [sugyan/claude-code-webui](https://github.com/sugyan/claude-code-webui) — Web-based interface with streaming chat
- [siteboon/claudecodeui](https://github.com/siteboon/claudecodeui) — Full-featured CloudCLI web UI
- MDN: Best Practices for PWAs — Authoritative PWA guidelines
- MDN: Making PWAs Installable — Install requirements and criteria
- [AI-Bridge CLAUDE.md](C:\WorkSpace\ai-bridge\CLAUDE.md) — Backend capabilities and API documentation

### Secondary (MEDIUM confidence - Community Articles with Verification)
- "Building Real-time Chat with Socket.io and React Query" (dev.to) — Socket.IO lifecycle patterns verified
- "Mastering Modern React + Vite Folder Structure" (Medium) — Feature-based architecture verified
- "15 React Concepts Every Frontend Engineer Must Know in 2026" (Medium) — Performance patterns
- vite-plugin-pwa documentation (netlify.app) — Advanced PWA configuration
- React Router v7 documentation — Type-safe routing patterns
- Zod documentation — Schema validation with TypeScript inference

### Tertiary (LOW confidence - Community Discussions, Single Sources)
- StackOverflow: Connection leak with Socket.IO in React — Memory leak prevention
- StackOverflow: useEffect infinite loop when updating state — Dependency array patterns
- StackOverflow: Service worker cache staleness — Update strategies
- GitHub Issues: Socket.IO reconnection failures — Reconnection patterns
- Medium: PWA Design Strategies 2025 — UX trends (needs validation)

---
*Research completed: 2025-02-06*
*Ready for roadmap: yes*
