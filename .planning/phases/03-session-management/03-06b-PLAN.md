---
phase: 03-session-management
plan: 06b
type: execute
wave: 3
depends_on: ["03-06a"]
files_modified:
  - web/src/lib/api/sessions.ts
  - web/src/components/session/SessionHeader.tsx
  - web/src/components/session/ResumeSessionDialog.tsx
  - web/src/pages/SessionDetail.tsx
autonomous: false

must_haves:
  truths:
    - User can resume stopped session with options (--continue, --resume, or new session)
    - Resume dialog shows three options with descriptions
    - Resume with --continue continues existing session
    - Resume with --resume restores session state
    - "Start new" creates fresh session with same working directory
    - User can stop running session from detail page
    - User can delete session from detail page
    - Deleting from detail page navigates back to session list
    - Stopped sessions show resume button
    - Running sessions show stop button
  artifacts:
    - path: web/src/lib/api/sessions.ts
      provides: resumeSession, useResumeSession, stopSession, useStopSession hooks
      exports: ["resumeSession", "useResumeSession", "stopSession", "useStopSession"]
      min_lines: 60 (added)
    - path: web/src/components/session/SessionHeader.tsx
      provides: Session detail header with status, actions (resume/stop/delete), and back button
      min_lines: 100
    - path: web/src/components/session/ResumeSessionDialog.tsx
      provides: Resume options dialog (--continue, --resume, new session)
      min_lines: 100
    - path: web/src/pages/SessionDetail.tsx
      provides: Updated with action buttons and dialog states
      min_lines: 140 (updated)
  key_links:
    - from: web/src/components/session/SessionHeader.tsx
      to: web/src/components/session/ResumeSessionDialog.tsx
      via: "resume button and dialog state"
      pattern: "resumeDialogOpen|onResume"
    - from: web/src/pages/SessionDetail.tsx
      to: web/src/lib/api/sessions.ts
      via: "useResumeSession, useStopSession, useDeleteSession mutations"
      pattern: "useResumeSession|useStopSession|useDeleteSession"
    - from: web/src/lib/api/sessions.ts
      to: "/api/v1/sessions/:id/resume"
      via: "POST request for resume"
      pattern: "POST.*sessions.*resume"
    - from: web/src/lib/api/sessions.ts
      to: "/api/v1/sessions/:id/stop"
      via: "POST request for stop"
      pattern: "POST.*sessions.*stop"
---

<objective>
Add resume and stop functionality for sessions with action buttons, dialogs, and proper navigation handling.

Purpose: Enables users to control session lifecycle - resume stopped sessions, stop running sessions, and delete sessions from the detail page.

Output: Fully functional session actions with resume options dialog, stop functionality, and delete-from-detail behavior.
</objective>

<execution_context>
@C:\Users\allan716\.claude\get-shit-done\workflows\execute-plan.md
@C:\Users\allan716\.claude\get-shit-done\templates\summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/03-session-management/03-CONTEXT.md
@.planning/phases/03-session-management/03-06a-PLAN.md

# Existing API service
@web/src/lib/api/sessions.ts

# Existing UI components
@web/src/components/ui/dialog.tsx
@web/src/components/ui/button.tsx
@web/src/components/ui/badge.tsx
@web/src/components/ui/card.tsx

# Existing pages
@web/src/pages/SessionDetail.tsx
@web/src/router/index.tsx

# Types
@web/src/types/api.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add resume and stop API functions</name>
  <files>web/src/lib/api/sessions.ts</files>
  <action>
    Add resume and stop functionality to web/src/lib/api/sessions.ts:

    1. Create resumeSession function:
       - Accepts sessionId: string and mode: 'continue' | 'resume' | 'new'
       - Makes POST request to /api/v1/sessions/:sessionId/resume
       - Body: { mode }
       - Returns Session object (new or resumed session)
       - Note: Backend API may differ - adjust based on actual endpoint

    2. Create useResumeSession hook:
       - Uses useMutation with resumeSession as mutationFn
       - onSuccess: Invalidate sessions query
       - onSuccess: Navigate to new/resumed session
       - onError: Show error toast

    3. Create stopSession function:
       - Accepts sessionId: string
       - Makes POST request to /api/v1/sessions/:sessionId/stop
       - Returns updated Session object
       - Note: Backend API may differ - adjust based on actual endpoint

    4. Create useStopSession hook:
       - Uses useMutation with stopSession as mutationFn
       - onSuccess: Invalidate session and sessions queries
       - onSuccess: Show success toast
       - onError: Show error toast

    Export resumeSession, useResumeSession, stopSession, useStopSession.

    Note: useDeleteSession should already exist from plan 03-05a.
  </action>
  <verify>Check that sessions.ts exports resumeSession, useResumeSession, stopSession, useStopSession</verify>
  <done>Resume and stop session API functions and hooks are available</done>
</task>

<task type="auto">
  <name>Task 2: Create ResumeSessionDialog component</name>
  <files>web/src/components/session/ResumeSessionDialog.tsx</files>
  <action>
    Create ResumeSessionDialog component at web/src/components/session/ResumeSessionDialog.tsx:

    Props:
    - open: boolean
    - onOpenChange: (open: boolean) => void
    - session: Session
    - onConfirm: (mode: 'continue' | 'resume' | 'new') => void
    - isResuming: boolean

    Dialog content (per CONTEXT.md):
    - Title: "Resume Session"

    Three options (Card-based selection):

    1. Continue (--continue):
       - Title: "Continue"
       - Description: "Continue this session where it left off"
       - Icon: Play
       - Primary action (recommended, has accent border)

    2. Resume (--resume):
       - Title: "Resume"
       - Description: "Restore session to previous state"
       - Icon: RotateCcw

    3. Start New:
       - Title: "Start New Session"
       - Description: "Create a new session with the same working directory"
       - Icon: Plus
       - Note: Will navigate to create dialog with pre-filled directory

    Actions:
    - Each option is clickable
    - Selected option has visual highlight (border/color)
    - Confirm button at bottom triggers selected action
    - Cancel button closes dialog

    On confirm:
    - Call onConfirm(mode) with selected mode
    - Show loading state if isResuming

    Use lucide-react icons: Play, RotateCcw, Plus, Check, Loader2
  </action>
  <verify>Check that ResumeSessionDialog.tsx exists with three resume options</verify>
  <done>ResumeSessionDialog shows continue, resume, and new session options with selection</done>
</task>

<task type="auto">
  <name>Task 3: Create SessionHeader component</name>
  <files>web/src/components/session/SessionHeader.tsx</files>
  <action>
    Create SessionHeader component at web/src/components/session/SessionHeader.tsx:

    Props:
    - session: Session
    - onResume: () => void
    - onStop: () => void
    - onDelete: () => void
    - isResuming: boolean
    - isStopping: boolean
    - isDeleting: boolean
    - onBack: () => void (for mobile)

    Component structure:
    1. Back button (mobile only, or always visible):
       - Left side
       - Ghost variant
       - ArrowLeft icon
       - Tooltip: "Back to sessions"

    2. Title area (center):
       - Session name (metadata.name or truncated id)
       - Session ID in muted text (smaller, below name)
       - Truncate with ellipsis if too long

    3. Action buttons (right side):
       - Resume button (if status is stopped):
         - Primary variant
         - Play icon
         - Text: "Resume" (desktop) or icon-only (mobile)
       - Stop button (if status is processing/waiting):
         - Destructive variant
         - Square icon
         - Text: "Stop" (desktop) or icon-only (mobile)
       - Delete button (always):
         - Ghost variant with destructive hover
         - Trash icon
         - Text: "Delete" (desktop) or icon-only (mobile)

    Responsive behavior:
       - Desktop: All buttons visible with text
       - Mobile: Icon-only buttons or dropdown menu (use MoreVertical for dropdown)

    Loading states:
       - Disable button while its action is in progress
       - Show Loader2 icon on button during action

    Use lucide-react icons: ArrowLeft, Play, Square, Trash, MoreVertical, Loader2
  </action>
  <verify>Check that SessionHeader.tsx exists with session title and action buttons</verify>
  <done>SessionHeader displays session info and context-aware action buttons</done>
</task>

<task type="auto">
  <name>Task 4: Wire up actions in SessionDetail page</name>
  <files>web/src/pages/SessionDetail.tsx</files>
  <action>
    Update SessionDetail.tsx to wire up all session actions:

    1. Import hooks and components:
       - useResumeSession, useStopSession from API
       - useDeleteSession from API (should exist from 03-05a)
       - useNavigateToSessionList, useNavigateToSession from router
       - SessionHeader, ResumeSessionDialog
       - DeleteSessionDialog (from 03-05a)

    2. Add state:
       - resumeDialogOpen: boolean
       - deleteDialogOpen: boolean
       - resumeMode: 'continue' | 'resume' | 'new' | null

    3. Wire up action handlers:
       - onResume: Opens resume dialog
       - onStop: Calls useStopSession.mutate()
       - onDelete: Opens delete confirmation dialog
       - onBack: Calls useNavigateToSessionList()

    4. Handle resume dialog:
       - On confirm with mode: Call useResumeSession.mutate({ mode })
       - For 'new' mode: Navigate to create dialog with pre-filled working directory
       - For 'continue'/'resume': Navigate to resumed session (or stay if same)
       - Close dialog after action

    5. Handle delete:
       - On confirm: Call useDeleteSession.mutate()
       - On success: Navigate back to session list
       - Show success toast

    6. Handle stop:
       - On success: Invalidate session query to refresh status
       - Show success toast
       - Session header should update to show Resume button instead of Stop

    7. Add SessionHeader component:
       - Render above SessionMetadata
       - Pass all action handlers
       - Pass loading states from mutations

    8. Add dialogs:
       - Render ResumeSessionDialog
       - Render DeleteSessionDialog (can reuse from 03-05a)

    9. Error handling:
       - Show error toast on resume failure
       - Show error toast on stop failure
       - Show error toast on delete failure
       - Keep dialogs open on failure for retry

    Navigation after actions:
       - Delete success: Navigate to session list
       - Resume success: Navigate to resumed session
       - Start new: Navigate to create dialog with pre-filled directory
       - Stop success: Stay on page, refresh session data
  </action>
  <verify>Check that SessionDetail.tsx renders SessionHeader and wires up all actions</verify>
  <done>SessionDetail page has full action functionality with proper navigation and error handling</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Complete session detail page with resume, stop, and delete actions</what-built>
  <how-to-verify>
    1. Start dev server: `cd web && npm run dev`
    2. Visit http://localhost:3000
    3. Click on a stopped session in the list (or navigate to /sessions/{id} directly)

    Verify session detail page:
    4. Page title shows session name/ID in header
    5. SessionMetadata displays all info correctly
    6. Back button works (navigates to session list)

    Test resume (for stopped sessions):
    7. Click "Resume" button in header
    8. Verify resume dialog opens with 3 options
    9. Click each option and verify highlight changes
    10. Select "Continue" and confirm
    11. Verify loading state shows during resume
    12. (If backend running) Verify navigation or success toast

    Test stop (for running sessions):
    13. Navigate to a running session
    14. Verify "Stop" button is shown (not "Resume")
    15. Click "Stop" button
    16. Verify loading state and success toast

    Test delete:
    17. Click "Delete" button in header
    18. Verify delete confirmation dialog appears
    19. Verify dialog shows session details
    20. Cancel and verify dialog closes
    21. Click delete again and confirm
    22. Verify navigation back to session list after deletion

    Test navigation:
    23. Click back button
    24. Verify navigates to session list
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues to fix</resume-signal>
</task>

</tasks>

<verification>
After completing all tasks and checkpoint approval:

1. TypeScript compilation succeeds: `cd web && npx tsc --noEmit`
2. Session header shows correct actions based on session status
3. Resume dialog shows three options with selection
4. Stop button works for running sessions
5. Delete confirmation shows session details
6. Navigation works correctly after all actions
7. Error states display appropriately
8. Loading states show during operations
9. Ready for Phase 4 (Real-Time Chat)
</verification>

<success_criteria>
1. Resume functionality works for stopped sessions (3 options)
2. Stop functionality works for running sessions
3. Delete from detail page navigates back to list
4. Error handling shows user-friendly messages
5. Loading states prevent double-actions
6. Back navigation works correctly
7. Session header updates based on session status
8. Ready for Phase 4 (Real-Time Chat)
</success_criteria>

<output>
After completion, create `.planning/phases/03-session-management/03-06b-SUMMARY.md`
</output>
