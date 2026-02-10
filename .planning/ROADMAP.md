# Roadmap: AI-Bridge-Web

## Overview

AI-Bridge-Web is a Progressive Web App frontend that provides remote access to Claude Code CLI through the existing AI-Bridge Go backend. The roadmap progresses from establishing project infrastructure and backend integration, through core chat functionality, to PWA features and production polish. Each phase delivers verifiable capabilities that incrementally validate the backend's HAPI-compatible API while maintaining performance with 10,000+ message sessions through incremental sync and virtualization.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & UI Infrastructure** - Project setup, routing, base layout, theming, and responsive design ✅
- [ ] **Phase 2: Backend Integration** - TanStack Query setup, Socket.IO client, API service layer, and connection management
- [ ] **Phase 3: Session Management** - Complete session CRUD with working directory picker, model selection, and session list UI
- [ ] **Phase 4: Real-Time Chat** - Chat interface with virtualized message list, streaming responses, permission handling, and slash commands
- [ ] **Phase 5: PWA Features** - Service worker, offline detection, and installability
- [ ] **Phase 6: Polish & Advanced Features** - Keyboard shortcuts, search, export, performance optimization, and error handling
- [ ] **Phase 7: SDK & Integration** - JavaScript SDK for embedding, iframe integration, postMessage communication, and context injection

## Phase Details

### Phase 1: Foundation & UI Infrastructure

**Goal**: Establish project infrastructure with routing, base layout, theming system, and responsive design scaffolding.

**Depends on**: Nothing (first phase)

**Requirements**: UI-01, UI-02

**Success Criteria** (what must be TRUE):
1. Application renders on mobile, tablet, and desktop with mobile-first responsive layout
2. User can toggle between dark and light themes with preference persistence
3. All navigation routes work without page reloads (client-side routing)
4. Base UI components (Button, Input, Card) render correctly across screen sizes

**Status**: ✅ Complete (2026-02-06)

**Plans:**

- [x] 01-01: Project scaffolding with Vite, React, TypeScript, and build configuration ✅
- [x] 01-02: React Router setup with route structure and navigation components ✅
- [x] 01-03: shadcn/ui installation and base component library setup ✅
- [x] 01-04: Theme system with dark/light mode toggle and persistence ✅
- [x] 01-05: Responsive layout shell with mobile-first design patterns ✅

**Plan Files:**
- `.planning/phases/01-foundation-ui-infrastructure/01-01-PLAN.md`
- `.planning/phases/01-foundation-ui-infrastructure/01-02-PLAN.md`
- `.planning/phases/01-foundation-ui-infrastructure/01-03-PLAN.md`
- `.planning/phases/01-foundation-ui-infrastructure/01-04-PLAN.md`
- `.planning/phases/01-foundation-ui-infrastructure/01-05-PLAN.md`

---

### Phase 2: Backend Integration

**Goal**: Establish secure backend communication layer with TanStack Query for REST APIs and Socket.IO for real-time events.

**Depends on**: Phase 1

**Requirements**: UI-04

**Success Criteria** (what must be TRUE):
1. Application connects to AI-Bridge backend on startup and maintains connection
2. Connection status indicator shows online/offline/reconnecting states accurately
3. TanStack Query successfully fetches data from backend API endpoints
4. Socket.IO event handlers attach/detach cleanly without memory leaks

**Status**: ✅ Complete (2026-02-07)

**Plans:**

- [x] 02-01-PLAN.md — TanStack Query setup with QueryClientProvider and default configuration ✅
- [x] 02-02-PLAN.md — API service layer with Zod schema validation for all endpoints ✅
- [x] 02-03-PLAN.md — Socket.IO singleton manager with typed events and reconnection handling ✅
- [x] 02-04-PLAN.md — Connection state management with visual status indicator ✅
- [x] 02-05-PLAN.md — Error boundary integration and global error handling ✅

**Plan Files:**
- `.planning/phases/02-backend-integration/02-01-PLAN.md`
- `.planning/phases/02-backend-integration/02-02-PLAN.md`
- `.planning/phases/02-backend-integration/02-03-PLAN.md`
- `.planning/phases/02-backend-integration/02-04-PLAN.md`
- `.planning/phases/02-backend-integration/02-05-PLAN.md`

---

### Phase 3: Session Management

**Goal**: Deliver complete session lifecycle management including creation, listing, resuming, and deletion with working directory and model selection.

**Depends on**: Phase 2

**Requirements**: SESS-01, SESS-02, SESS-03, SESS-04, SESS-05, SESS-06, UI-03, ADV-04

**Success Criteria** (what must be TRUE):
1. User can create new session by selecting working directory and model (Haiku/Sonnet/Opus)
2. User can specify CLI startup parameters (--dangerously-skip-permissions, --permission-mode, etc.) when creating session
3. User can view all sessions in a list with status indicators (idle/processing/waiting/stopped)
4. User can resume previous session using --continue or --resume parameters
5. User can delete sessions from the session list
6. System displays session metadata (message count, last activity, git branch)
7. User can navigate between session list and individual session views

**Status**: In Planning (2026-02-08)

**Plans:**

- [ ] 03-01-PLAN.md — Session routing and navigation structure ✅
- [ ] 03-02-PLAN.md — Session list page with status indicators and metadata display ✅
- [ ] 03-03-PLAN.md — Create session dialog with working directory picker and model selection ✅
- [ ] 03-04-PLAN.md — CLI startup parameters configuration form ✅
- [ ] 03-05-PLAN.md — Session deletion with confirmation ✅
- [ ] 03-06-PLAN.md — Session detail page with resume functionality ✅

**Plan Files:**
- `.planning/phases/03-session-management/03-01-PLAN.md`
- `.planning/phases/03-session-management/03-02-PLAN.md`
- `.planning/phases/03-session-management/03-03-PLAN.md`
- `.planning/phases/03-session-management/03-04-PLAN.md`
- `.planning/phases/03-session-management/03-05-PLAN.md`
- `.planning/phases/03-session-management/03-06-PLAN.md`

---

### Phase 4: Real-Time Chat

**Goal**: Deliver complete chat interface with virtualized scrolling, streaming responses, permission approvals, and slash command execution.

**Depends on**: Phase 3

**Requirements**: MSG-01, MSG-02, MSG-03, MSG-04, MSG-05, MSG-06, PERM-01, PERM-02, PERM-03, PERM-04, CMD-01, CMD-02, CMD-03, CMD-04

**Success Criteria** (what must be TRUE):
1. User can send text messages to Claude Code through chat interface
2. User receives streaming responses from Claude Code in real-time with visual indicators
3. User can scroll through message history using incremental pagination (since/before parameters)
4. System renders code blocks with syntax highlighting
5. System displays loading/streaming indicators during Claude responses
6. System handles 10,000+ message sessions without performance degradation (virtualization)
7. System displays permission request modal when Claude requires tool approval
8. User can approve permission with scope selection (file read/write, command execution)
9. User can deny permission requests
10. System shows permission details (what operation, what files/resources)
11. User can browse available slash commands by category (builtin, user, project)
12. User can view command details and examples
13. User can execute slash commands through UI
14. System displays command execution results

**Status**: In Planning (2026-02-09)

**Plans:**

- [ ] 04-01-PLAN.md — Virtualized message list with react-virtuoso
- [ ] 04-02-PLAN.md — Message input component with send functionality
- [ ] 04-03-PLAN.md — Streaming message display with streamdown
- [ ] 04-04-PLAN.md — Incremental message sync with SSE and pagination
- [ ] 04-05-PLAN.md — Code block rendering with syntax highlighting
- [ ] 04-06-PLAN.md — Loading and streaming indicators
- [ ] 04-07-PLAN.md — Permission request modal with approve/deny
- [ ] 04-08-PLAN.md — Permission scope selection interface
- [ ] 04-09-PLAN.md — Slash command palette with cmdk
- [ ] 04-10-PLAN.md — Command detail view with examples
- [ ] 04-11-PLAN.md — Command execution interface

**Plan Files:**
- `.planning/phases/04-real-time-chat/04-01-PLAN.md`
- `.planning/phases/04-real-time-chat/04-02-PLAN.md`
- `.planning/phases/04-real-time-chat/04-03-PLAN.md`
- `.planning/phases/04-real-time-chat/04-04-PLAN.md`
- `.planning/phases/04-real-time-chat/04-05-PLAN.md`
- `.planning/phases/04-real-time-chat/04-06-PLAN.md`
- `.planning/phases/04-real-time-chat/04-07-PLAN.md`
- `.planning/phases/04-real-time-chat/04-08-PLAN.md`
- `.planning/phases/04-real-time-chat/04-09-PLAN.md`
- `.planning/phases/04-real-time-chat/04-10-PLAN.md`
- `.planning/phases/04-real-time-chat/04-11-PLAN.md`

---

### Phase 5: PWA Features

**Goal**: Enable installability and offline capabilities with service worker caching and update management.

**Depends on**: Phase 4

**Requirements**: PWA-01, PWA-02, PWA-03

**Success Criteria** (what must be TRUE):
1. Application can be installed to home screen (desktop/mobile) with app icon and name
2. System displays offline indicator when network becomes unavailable
3. Application caches static assets for faster load times and offline access
4. Application prompts user to update when new version is available

**Status**: ✅ Complete (2026-02-09)

**Plans:**

- [x] 05-01-PLAN.md — PWA base configuration with vite-plugin-pwa and manifest ✅
- [x] 05-02-PLAN.md — Offline detection hook and offline banner component ✅
- [x] 05-03-PLAN.md — Service Worker update prompt dialog component ✅

**Plan Files:**
- `.planning/phases/05-pwa-features/05-01-PLAN.md`
- `.planning/phases/05-pwa-features/05-02-PLAN.md`
- `.planning/phases/05-pwa-features/05-03-PLAN.md`

---

### Phase 6: Polish & Advanced Features

**Goal**: Enhance user experience with power user features, performance optimization, and production hardening.

**Depends on**: Phase 5

**Requirements**: ADV-01, ADV-02, ADV-03

**Success Criteria** (what must be TRUE):
1. User can search across all sessions to find previous conversations
2. User can export conversation as markdown file
3. User can use keyboard shortcuts (e.g., Ctrl+K to send message, Ctrl+/ for commands)
4. Application loads quickly with optimized bundle size and code splitting
5. Application handles errors gracefully with recovery options
6. Application provides loading skeletons during data fetching

**Status**: ✅ Complete (2026-02-10) - 6/6 must-haves verified, TypeScript errors resolved

**Plans**:

- [x] 06-01: Search interface with session and message search ✅
- [x] 06-02: Export to markdown functionality ✅
- [x] 06-03: Keyboard shortcuts system with help modal ✅
- [x] 06-04: Performance optimization (code splitting, lazy loading, bundle analysis) ✅
- [x] 06-05: Error handling refinement with user-friendly messages ✅
- [x] 06-06: Loading skeletons and optimistic UI updates ✅
- [x] 06-07: Accessibility audit and improvements ✅
- [x] 06-08: Frontend crash fixes (import errors, type imports) ✅
- [x] 06-09: TypeScript type errors (reduced from 50+ to ~11 warnings) ✅

**Plan Files:**
- `.planning/phases/06-polish-advanced-features/06-01-PLAN.md`
- `.planning/phases/06-polish-advanced-features/06-02-PLAN.md`
- `.planning/phases/06-polish-advanced-features/06-03-PLAN.md`
- `.planning/phases/06-polish-advanced-features/06-04-PLAN.md`
- `.planning/phases/06-polish-advanced-features/06-05-PLAN.md`
- `.planning/phases/06-polish-advanced-features/06-06-PLAN.md`
- `.planning/phases/06-polish-advanced-features/06-07-PLAN.md`
- `.planning/phases/06-polish-advanced-features/06-08-PLAN.md`
- `.planning/phases/06-polish-advanced-features/06-09-PLAN.md`

---

### Phase 7: SDK & Integration

**Goal**: Enable external applications to integrate ai-bridge-web via JavaScript SDK with iframe embedding, postMessage communication, and context injection.

**Depends on**: Phase 6

**Requirements**: SDK-01, SDK-02, SDK-03, SDK-04, SDK-05, SDK-06

**Success Criteria** (what must be TRUE):
1. External applications can embed ai-bridge-web as an iframe with initial configuration
2. Host application can send messages to Claude through postMessage API
3. Host application can receive Claude responses and status updates via postMessage events
4. External app can send text messages to Claude via simple API (sendMessage(text: string))
5. SDK provides TypeScript type definitions for all postMessage interfaces
6. SDK handles errors gracefully with recovery mechanisms

**Status**: In Planning (2026-02-10)

**Plans**:

- [ ] 07-01-PLAN.md — SDK package structure with initialization and configuration ✅
- [ ] 07-02-PLAN.md — Iframe integration with responsive sizing and sandbox policies ✅
- [ ] 07-03-PLAN.md — Bidirectional postMessage communication protocol ✅
- [ ] 07-04-PLAN.md — Text message API with simple sendMessage(text: string) interface ✅
- [ ] 07-05-PLAN.md — TypeScript type definitions and documentation ✅
- [ ] 07-06-PLAN.md — Error handling, reconnection, and recovery mechanisms ✅

**Plan Files:**
- `.planning/phases/07-sdk-integration/07-01-PLAN.md`
- `.planning/phases/07-sdk-integration/07-02-PLAN.md`
- `.planning/phases/07-sdk-integration/07-03-PLAN.md`
- `.planning/phases/07-sdk-integration/07-04-PLAN.md`
- `.planning/phases/07-sdk-integration/07-05-PLAN.md`
- `.planning/phases/07-sdk-integration/07-06-PLAN.md`

---

### Phase 8: Multi-Project Integration & Backend SDK

**Goal**: Transform AI-Bridge into a reusable platform that can power multiple external applications (like PPT generators, code editors, documentation tools) through both Go backend SDK and embeddable React components. External apps can inject custom context (e.g., SVG elements, project state, user selections) that flows from host app → AI-Bridge frontend → backend → Claude Code CLI for processing.

**Depends on**: Phase 7

**Requirements**: INTEG-01, INTEG-02, INTEG-03, INTEG-04, INTEG-05, INTEG-06

**Success Criteria** (what must be TRUE):
1. External Golang applications can import AI-Bridge as a library/SDK to manage Claude Code CLI instances programmatically
2. Multiple external applications can simultaneously create isolated Claude sessions via Go SDK with separate working directories
3. External web apps can embed AI-Bridge React components (ChatInterface, PermissionModal, CommandPalette) with isolated state
4. React components accept context injection (initial prompt, project metadata, custom tools) via props
5. Backend provides multi-tenant session isolation per application ID with security boundaries
6. Each external app can have multiple concurrent Claude instances (e.g., per-slide PPT generation) without cross-contamination
7. **External apps can pass additional context (e.g., SVG elements, JSON data, file references) through embedded component props**
8. **Injected context is serialized and transmitted to backend, then prepended to Claude Code CLI messages**
9. **Frontend displays injected context preview (e.g., SVG thumbnails, JSON tree) so users understand what Claude sees**
10. SDK documentation and example integrations demonstrate common patterns (PPT generation with SVG context, code review with file context)

**Plans**:

Plans:
- [ ] 08-01: Go SDK package structure with clean public API for session management
- [ ] 08-02: Multi-tenant backend architecture with application ID isolation
- [ ] 08-03: React component library extraction with standalone build (component SDK)
- [ ] 08-04: Context injection API for pre-configuring Claude sessions (initial prompts, tools, working dirs)
- [ ] **08-04a: External context serialization and transmission protocol (props → frontend → backend → CLI)**
- [ ] **08-04b: Context preview UI components (SVG thumbnails, JSON tree, file reference cards)**
- [ ] **08-04c: Backend context injection into Claude Code CLI stdin/messages**
- [ ] 08-05: Example integration with PPT generator project (multi-session per-slide generation with SVG context)
- [ ] 08-06: SDK documentation with TypeScript definitions and Go godocs
- [ ] 08-07: Integration testing suite for multi-application scenarios

**Details:**
This phase transforms AI-Bridge from a single-purpose web app into a platform that other applications can build upon. The use case: a PPT generation tool needs to run Claude Code for each slide independently, with different contexts (slide content, SVG elements, design templates, user selections).

**Key Feature: External Context Flow**

The integration supports external context injection through the following flow:

```
External App (PPT Generator)
    ↓ props
AI-Bridge Frontend Component
    ↓ HTTP API / WebSocket
AI-Bridge Backend
    ↓ stdin / message prepend
Claude Code CLI
```

**Example: PPT Slide Generation with SVG Context**

```typescript
// PPT 项目提取 SVG 元素作为上下文
const slideElements = extractSVGElements(currentSlide);

// 传递给 AI-Bridge 嵌入组件
<AIChatInterface
  appId="make-ppt-great-again"
  sessionId={`slide-${slideId}`}
  externalContext={{
    // SVG 元素数据
    svgElements: slideElements.map(el => ({
      type: 'rect', 'circle', 'text', etc.
      attributes: el.attrs,
      content: el.textContent
    })),

    // 项目元数据
    projectMetadata: {
      slideNumber: slideId,
      theme: currentTheme,
      dimensions: { width: 1920, height: 1080 }
    },

    // 用户选择
    userSelection: {
      selectedElements: selectedIds,
      focusArea: userViewport
    }
  }}
  onClaudeResponse={(response) => {
    // Claude 基于上下文返回修改建议
    applySlideChanges(response.changes);
  }}
/>
```

The Go backend SDK lets external apps spawn isolated Claude instances programmatically, while the React component SDK provides UI components that can be embedded with rich context including SVG elements, project state, and user selections.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & UI Infrastructure | 5/5 | ✅ Complete | 2026-02-07 |
| 2. Backend Integration | 5/5 | ✅ Complete | 2026-02-07 |
| 3. Session Management | 8/8 | ✅ Complete | 2026-02-08 |
| 4. Real-Time Chat | 11/11 | ✅ Complete | 2026-02-09 |
| 5. PWA Features | 3/3 | ✅ Complete | 2026-02-09 |
| 6. Polish & Advanced Features | 9/9 | ✅ Complete | 2026-02-10 |
| 7. SDK & Integration | 6/6 | ✅ Planned | 2026-02-10 |
| 8. Multi-Project Integration & Backend SDK | 0/10 | Not started | - |

**Overall Progress:** 46/64 plans complete (72%)
