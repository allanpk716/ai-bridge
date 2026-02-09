---
phase: 04-real-time-chat
plan: 06
subsystem: ui
tags: [react, typescript, tailwind, lucide-react, streaming, loading-states]

# Dependency graph
requires:
  - phase: 04-real-time-chat
    plan: 04-03
    provides: StreamingMessage component with cursor animation
provides:
  - TypingIndicator component with animated bouncing dots
  - StreamingIndicator component with stop button
  - StreamingErrorCard component with retry functionality
  - Enhanced ChatMessageList with loading and streaming states
affects: [04-07-sse-integration, 04-08-error-handling]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Staggered CSS animations with custom keyframes"
    - "Compact loading indicators without layout shift"
    - "Error cards with user-friendly messages and retry actions"
    - "Component composition for visual feedback states"

key-files:
  created:
    - web/src/components/chat/TypingIndicator.tsx
    - web/src/components/chat/StreamingIndicator.tsx
    - web/src/components/chat/StreamingErrorCard.tsx
  modified:
    - web/src/components/chat/ChatMessageList.tsx
    - web/src/components/chat/index.ts

key-decisions:
  - "TypingIndicator uses custom keyframes instead of Tailwind animate-bounce for precise stagger control"
  - "StreamingIndicator integrates TypingIndicator inline for better visual feedback"
  - "StreamingErrorCard provides user-friendly error messages (network/timeout/abort/generic)"
  - "Loading states use fixed positioning to prevent layout shift"

patterns-established:
  - "Pattern: Visual feedback during async operations (loading, streaming, error)"
  - "Pattern: Staggered animations with CSS delays for wave effects"
  - "Pattern: Compact inline indicators (not full-width banners)"
  - "Pattern: Error cards with actionable retry buttons"

# Metrics
duration: 4min
completed: 2026-02-09
---

# Phase 04 Plan 06: Loading and Streaming Indicators Summary

**Visual feedback components for message operations with animated typing indicator, streaming stop button, and error card with retry functionality**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-09T02:09:18Z
- **Completed:** 2026-02-09T02:14:01Z
- **Tasks:** 5
- **Files modified:** 5

## Accomplishments

- Created TypingIndicator with three animated dots using staggered bounce animation
- Built StreamingIndicator with stop button and integrated TypingIndicator
- Enhanced ChatMessageList with loading state, streaming indicator, and typing indicator
- Created StreamingErrorCard with user-friendly error messages and retry functionality
- Exported all indicator components from barrel for clean imports

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TypingIndicator component** - `0be27dd` (feat)
2. **Task 2: Create StreamingIndicator component** - `b009f5c` (feat)
3. **Task 3: Integrate indicators into ChatMessageList** - `ef65f66` (feat)
4. **Task 4: Create StreamingErrorCard component** - `a77aa6d` (feat)
5. **Task 5: Export indicators from barrel** - `0f20e4f` (feat)

**Plan metadata:** (to be committed after STATE.md update)

## Files Created/Modified

### Created

- `web/src/components/chat/TypingIndicator.tsx` - Animated typing indicator with three bouncing dots (64 lines)
- `web/src/components/chat/StreamingIndicator.tsx` - Streaming indicator with stop button (80 lines)
- `web/src/components/chat/StreamingErrorCard.tsx` - Error card with retry functionality (136 lines)

### Modified

- `web/src/components/chat/ChatMessageList.tsx` - Added isLoading, isStreaming, onStopStreaming props with loading states and indicators
- `web/src/components/chat/index.ts` - Added StreamingIndicator and TypingIndicator exports

## Decisions Made

- Used custom CSS keyframes instead of Tailwind's animate-bounce for precise stagger control (0ms, 150ms, 300ms delays)
- TypingIndicator uses compact 8px dots for subtle appearance (not full message bubble)
- StreamingIndicator integrates TypingIndicator inline for better visual feedback during streaming
- StreamingErrorCard provides user-friendly error messages based on error type (network/timeout/abort/generic)
- Loading states use centered Loader2 icon to prevent layout shift in ChatMessageList
- Stop button includes "(Esc)" tooltip hint for keyboard shortcut support

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all components created successfully with no issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for SSE integration:**
- TypingIndicator can be shown when waiting for first SSE token
- StreamingIndicator with stop button ready for isStreaming state from SSE
- StreamingErrorCard ready to display on SSE connection failures
- ChatMessageList supports all indicator states (loading, streaming, error)

**Integration points:**
- isStreaming prop should be driven by SSE connection state
- onStopStreaming callback should trigger SSE abort/fetch abort
- streamingError state should be managed by SSE error handler
- TypingIndicator should show when waiting for assistant response

**No blockers or concerns.**

---
*Phase: 04-real-time-chat*
*Plan: 06*
*Completed: 2026-02-09*
