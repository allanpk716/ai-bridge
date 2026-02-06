# Requirements: AI-Bridge-Web

**Defined:** 2026-02-06
**Core Value:** 可复用性 + 功能完整性 + 性能表现 - AI-Bridge-Web 既是后端验证工具,也是可被其他项目集成的通用 Claude Code 交互界面。支持外部应用通过 SDK 注入动态上下文(选区内容、项目元信息、应用状态)

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Session Management

- [ ] **SESS-01**: User can create new session with working directory and model selection
- [ ] **SESS-02**: User can specify CLI startup parameters when creating session (`--dangerously-skip-permissions`, `--permission-mode`, etc.)
- [ ] **SESS-03**: User can view all sessions in a list with status indicators
- [ ] **SESS-04**: User can delete sessions
- [ ] **SESS-05**: User can resume previous session using `--continue` or `--resume` parameters
- [ ] **SESS-06**: System displays session metadata (message count, last activity, git branch)

### Message Interaction

- [ ] **MSG-01**: User can send text messages to Claude Code through chat interface
- [ ] **MSG-02**: User can receive streaming responses from Claude Code in real-time
- [ ] **MSG-03**: User can view message history with incremental pagination (since/before parameters)
- [ ] **MSG-04**: System renders code blocks with syntax highlighting
- [ ] **MSG-05**: System displays loading/streaming indicators during Claude responses
- [ ] **MSG-06**: System handles 10,000+ message sessions with virtualization for performance

### Permission Handling

- [ ] **PERM-01**: System displays permission request modal when Claude requires tool approval
- [ ] **PERM-02**: User can approve permission with scope selection (file read/write, command execution)
- [ ] **PERM-03**: User can deny permission requests
- [ ] **PERM-04**: System shows permission details (what operation, what files/resources)

### Slash Commands

- [ ] **CMD-01**: User can browse available slash commands by category (builtin, user, project)
- [ ] **CMD-02**: User can view command details and examples
- [ ] **CMD-03**: User can execute slash commands through UI
- [ ] **CMD-04**: System displays command execution results

### UI/UX

- [ ] **UI-01**: Application uses mobile-first responsive design (desktop/tablet/mobile)
- [ ] **UI-02**: System provides visual feedback for user interactions (loading, streaming, errors)
- [ ] **UI-03**: User can navigate between sessions and chat interface
- [ ] **UI-04**: System displays connection status indicator (online/offline/reconnecting)

### PWA Features

- [ ] **PWA-01**: Application is installable to home screen (manifest, service worker)
- [ ] **PWA-02**: System displays offline indicator when network unavailable
- [ ] **PWA-03**: Application caches static assets for offline access

### Advanced Features

- [ ] **ADV-01**: User can search across all sessions
- [ ] **ADV-02**: User can export conversation as markdown
- [ ] **ADV-03**: User can use keyboard shortcuts (e.g., Ctrl+K to send message)
- [ ] **ADV-04**: User can select model per session (Haiku/Sonnet/Opus)

### SDK Integration

- [ ] **SDK-01**: External applications can integrate ai-bridge-web via npm package
- [ ] **SDK-02**: SDK initializes iframe with ai-bridge-web independent site
- [ ] **SDK-03**: External app can inject dynamic context before sending message (selected text, project metadata, app state)
- [ ] **SDK-04**: bidirectional communication via postMessage (external app ↔ ai-bridge-web)
- [ ] **SDK-05**: SDK provides TypeScript types for context injection and message handling
- [ ] **SDK-06**: SDK handles connection state and error recovery for external app

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Voice & Gestures

- **VOICE-01**: User can input messages via voice using Web Speech API
- **GESTURE-01**: User can navigate using swipe gestures (mobile)

### Advanced Code Tools

- **DIFF-01**: User can view code changes in diff viewer (side-by-side or unified)
- **FILE-01**: User can browse project files without leaving chat interface
- **GIT-01**: User can see git status overlay (changed files)

### Multi-Session

- **MULTI-01**: User can monitor multiple sessions in parallel (tabbed or split view)
- **SHARE-01**: User can share session via link with view-only permission

### Integration

- **MCP-01**: User can configure Model Context Protocol servers
- **PR-01**: User can resume sessions linked to pull requests

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| User authentication/authorization | Backend uses fixed JWT/API token for testing |
| Multi-tenant support | Single-user scenario, no user isolation needed |
| Internationalization (i18n) | Chinese interface only for v1 |
| Offline message queue | PWA caches static resources, but messages require real-time connection |
| Collaborative editing (real-time pair programming) | Very high complexity (CRDT/OT), questionable value for CLI wrapper |
| Full IDE in browser | Reinventing wheel, performance issues - delegate to VS Code |
| Social features (likes, comments) | Not core value, privacy concerns |
| AI marketplace / Custom agents | Legal issues, quality control, moderation burden |
| Multiple AI provider support | Dilutes focus, each provider has different API - stick to Claude Code CLI |
| Analytics dashboard | Privacy concerns, overhead, not core value |
| Custom themes marketplace | Moderation burden, quality inconsistency - light/dark themes sufficient |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SESS-01 | Phase 3 | Pending |
| SESS-02 | Phase 3 | Pending |
| SESS-03 | Phase 3 | Pending |
| SESS-04 | Phase 3 | Pending |
| SESS-05 | Phase 3 | Pending |
| SESS-06 | Phase 3 | Pending |
| MSG-01 | Phase 4 | Pending |
| MSG-02 | Phase 4 | Pending |
| MSG-03 | Phase 4 | Pending |
| MSG-04 | Phase 4 | Pending |
| MSG-05 | Phase 4 | Pending |
| MSG-06 | Phase 4 | Pending |
| PERM-01 | Phase 4 | Pending |
| PERM-02 | Phase 4 | Pending |
| PERM-03 | Phase 4 | Pending |
| PERM-04 | Phase 4 | Pending |
| CMD-01 | Phase 4 | Pending |
| CMD-02 | Phase 4 | Pending |
| CMD-03 | Phase 4 | Pending |
| CMD-04 | Phase 4 | Pending |
| UI-01 | Phase 1 | Pending |
| UI-02 | Phase 1 | Pending |
| UI-03 | Phase 3 | Pending |
| UI-04 | Phase 2 | Pending |
| PWA-01 | Phase 5 | Pending |
| PWA-02 | Phase 5 | Pending |
| PWA-03 | Phase 5 | Pending |
| ADV-01 | Phase 6 | Pending |
| ADV-02 | Phase 6 | Pending |
| ADV-03 | Phase 6 | Pending |
| ADV-04 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0 ✓

**Phase Distribution:**
- Phase 1: 2 requirements (UI-01, UI-02)
- Phase 2: 1 requirement (UI-04)
- Phase 3: 7 requirements (SESS-01 through SESS-06, UI-03, ADV-04)
- Phase 4: 14 requirements (MSG-01 through MSG-06, PERM-01 through PERM-04, CMD-01 through CMD-04)
- Phase 5: 3 requirements (PWA-01, PWA-02, PWA-03)
- Phase 6: 3 requirements (ADV-01, ADV-02, ADV-03)

---
*Requirements defined: 2026-02-06*
*Last updated: 2026-02-06 after roadmap creation*
