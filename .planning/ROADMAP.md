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

**Plans**: TBD

Plans:
- [ ] 02-01: TanStack Query setup with QueryClientProvider and default configuration
- [ ] 02-02: API service layer with Zod schema validation for all endpoints
- [ ] 02-03: Socket.IO singleton manager with typed events and reconnection handling
- [ ] 02-04: Connection state management with visual status indicator
- [ ] 02-05: Error boundary integration and global error handling

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

**Plans**: TBD

Plans:
- [ ] 03-01: Session list page with status indicators and metadata display
- [ ] 03-02: Create session dialog with working directory picker and model selection
- [ ] 03-03: CLI startup parameters configuration form
- [ ] 03-04: Session detail page with resume functionality
- [ ] 03-05: Session deletion with confirmation
- [ ] 03-06: Session routing and navigation structure

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

**Plans**: TBD

Plans:
- [ ] 04-01: Message list component with virtualization (@tanstack/react-virtual)
- [ ] 04-02: Message input component with send functionality
- [ ] 04-03: Streaming message display with real-time updates
- [ ] 04-04: Incremental message sync with since/before pagination
- [ ] 04-05: Code block rendering with syntax highlighting
- [ ] 04-06: Loading and streaming indicators
- [ ] 04-07: Permission request modal with approve/deny actions
- [ ] 04-08: Permission scope selection interface
- [ ] 04-09: Slash command browser with category grouping
- [ ] 04-10: Command detail view with examples
- [ ] 04-11: Command execution interface with result display

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

**Plans**: TBD

Plans:
- [ ] 05-01: PWA manifest configuration with app metadata and icons
- [ ] 05-02: Service worker registration with vite-plugin-pwa
- [ ] 05-03: Offline detection and indicator UI
- [ ] 05-04: Install prompt UI and handling
- [ ] 05-05: Service worker update strategy with user notification

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

**Plans**: TBD

Plans:
- [ ] 06-01: Search interface with session and message search
- [ ] 06-02: Export to markdown functionality
- [ ] 06-03: Keyboard shortcuts system with help modal
- [ ] 06-04: Performance optimization (code splitting, lazy loading, bundle analysis)
- [ ] 06-05: Error handling refinement with user-friendly messages
- [ ] 06-06: Loading skeletons and optimistic UI updates
- [ ] 06-07: Accessibility audit and improvements

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

**Plans**: TBD

Plans:
- [ ] 07-01: SDK package structure with initialization and configuration
- [ ] 07-02: Iframe integration with responsive sizing and sandbox policies
- [ ] 07-03: Bidirectional postMessage communication protocol
- [ ] 07-04: Text message API with simple sendMessage(text: string) interface
- [ ] 07-05: TypeScript type definitions and documentation
- [ ] 07-06: Error handling, reconnection, and recovery mechanisms

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & UI Infrastructure | 5/5 | ✅ Complete | 2026-02-07 |
| 2. Backend Integration | 0/5 | Not started | - |
| 3. Session Management | 0/6 | Not started | - |
| 4. Real-Time Chat | 0/11 | Not started | - |
| 5. PWA Features | 0/5 | Not started | - |
| 6. Polish & Advanced Features | 0/7 | Not started | - |
| 7. SDK & Integration | 0/6 | Not started | - |

**Overall Progress:** 5/45 plans complete (11%)
