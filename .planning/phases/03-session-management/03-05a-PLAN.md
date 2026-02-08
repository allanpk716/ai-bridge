---
phase: 03-session-management
plan: 05a
type: execute
wave: 2
depends_on: ["03-02"]
files_modified:
  - web/src/lib/api/sessions.ts
  - web/src/components/session/DeleteSessionDialog.tsx
  - web/src/components/session/SessionListItem.tsx
autonomous: false

must_haves:
  truths:
    - User can delete a single session with confirmation dialog
    - Confirmation dialog shows session name, working directory, message count, and warning
    - Deleting shows full-screen loading overlay during deletion
    - Delete success shows toast and removes item from list (with fade-out animation)
    - Delete failure shows error toast
    - Deleting running session shows additional warning
  artifacts:
    - path: web/src/lib/api/sessions.ts
      provides: deleteSession API function and useDeleteSession hook
      exports: ["deleteSession", "useDeleteSession"]
      min_lines: 30 (added)
    - path: web/src/components/session/DeleteSessionDialog.tsx
      provides: Single session delete confirmation dialog with full-screen loading overlay
      min_lines: 80
    - path: web/src/components/session/SessionListItem.tsx
      provides: Updated with delete button (no selection mode)
      min_lines: 80 (updated)
  key_links:
    - from: web/src/lib/api/sessions.ts
      to: "/api/v1/sessions/:id"
      via: "DELETE request"
      pattern: "DELETE.*sessions"
    - from: web/src/components/session/SessionListItem.tsx
      to: web/src/components/session/DeleteSessionDialog.tsx
      via: "trigger button and state"
      pattern: "deleteDialogOpen|onDelete"
    - from: web/src/components/session/DeleteSessionDialog.tsx
      to: web/src/lib/api/sessions.ts
      via: "useDeleteSession mutation"
      pattern: "useDeleteSession"
---

<objective>
Implement single session deletion with confirmation dialog, full-screen loading overlay, and proper error handling.

Purpose: Allows users to remove individual unwanted sessions with safeguards against accidental deletion and clear visual feedback during the operation.

Output: Single delete workflow with confirmation dialog, full-screen loading overlay, and optimistic UI updates.
</objective>

<execution_context>
@C:\Users\allan716\.claude\get-shit-done\workflows\execute-plan.md
@C:\Users\allan716\.claude\get-shit-done\templates\summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/03-session-management/03-CONTEXT.md
@.planning/phases/03-session-management/03-02-PLAN.md

# Existing API service
@web/src/lib/api/sessions.ts

# Existing UI components
@web/src/components/ui/dialog.tsx
@web/src/components/ui/button.tsx
@web/src/components/ui/tooltip.tsx

# Existing session components
@web/src/components/session/SessionListItem.tsx

# Types
@web/src/types/api.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add deleteSession API function and hook</name>
  <files>web/src/lib/api/sessions.ts</files>
  <action>
    Add deleteSession functionality to web/src/lib/api/sessions.ts:

    1. Create deleteSession function:
       - Accepts sessionId: string
       - Makes DELETE request to /api/v1/sessions/:sessionId
       - Returns void on success
       - Throws ApiError on failure

    2. Create useDeleteSession hook:
       - Uses useMutation from TanStack Query
       - Calls deleteSession as mutationFn
       - onSuccess: Invalidate sessions query
       - onError: Show error toast

    3. Export both deleteSession and useDeleteSession

    Function signature:
    ```typescript
    export async function deleteSession(sessionId: string): Promise<void>

    export function useDeleteSession(sessionId: string): UseMutationResult<void, Error, void, unknown>
    ```
  </action>
  <verify>Check that sessions.ts exports deleteSession and useDeleteSession</verify>
  <done>deleteSession API and hook are available for deleting sessions</done>
</task>

<task type="auto">
  <name>Task 2: Create DeleteSessionDialog with full-screen loading overlay</name>
  <files>web/src/components/session/DeleteSessionDialog.tsx</files>
  <action>
    Create DeleteSessionDialog component at web/src/components/session/DeleteSessionDialog.tsx:

    Props:
    - open: boolean
    - onOpenChange: (open: boolean) => void
    - session: Session (session to delete)
    - isDeleting: boolean
    - onConfirm: () => void

    Dialog content (per CONTEXT.md):
    - Title: "Delete Session?"
    - Warning text: "This action cannot be undone"
    - Session details:
      - Session name (metadata.name or truncated id)
      - Working directory
      - Message count (from metadata.messageCount)
    - Special warning for running sessions:
      - If session status is processing or waiting: "This session is currently running. It will be stopped before deletion."
    - Actions: Cancel (Ghost), Delete (Destructive variant)

    **Full-screen loading overlay (per CONTEXT.md requirement):**
    When isDeleting is true:
    - Render a full-screen backdrop/overlay that covers the entire viewport
    - Use fixed positioning, inset-0, z-index higher than the dialog
    - Semi-transparent dark background (bg-black/50 or similar)
    - Centered loading spinner (Loader2 icon with animation)
    - "Deleting session..." text below spinner
    - This overlay persists for the duration of the deletion operation

    Dialog styling:
    - Use AlertCircle icon from lucide-react
    - Destructive button styling for delete action
    - Disable delete button while isDeleting is true
    - Show loading spinner on delete button when isDeleting (in addition to overlay)

    Use lucide-react icons: AlertCircle, Loader2

    NOTE: The full-screen loading overlay is REQUIRED per CONTEXT.md ("正在删除时显示全屏加载遮罩").
  </action>
  <verify>Check that DeleteSessionDialog.tsx exists with confirmation UI and full-screen loading overlay</verify>
  <done>DeleteSessionDialog shows session details, confirmation, and full-screen loading overlay during deletion</done>
</task>

<task type="auto">
  <name>Task 3: Update SessionListItem with delete button</name>
  <files>web/src/components/session/SessionListItem.tsx</files>
  <action>
    Update SessionListItem.tsx to add delete functionality:

    New props:
    - onDelete: () => void
    - isDeleting: boolean

    Changes:
    1. Add hover action buttons (desktop):
       - Show on hover (group-hover in Tailwind)
       - Delete button: Trash icon, Ghost variant, destructive color on hover
       - Position: right side of card/row

    2. Handle deleting state:
       - Show loading spinner when isDeleting is true
       - Disable interactions during deletion
       - Add fade-out animation class when isDeleting starts

    Delete button styling (per CONTEXT.md):
    - Ghost variant with Destructive foreground on hover
    - Trash icon from lucide-react
    - Tooltip: "Delete session"

    Do NOT add selection checkbox yet - that's in plan 03-05b.

    Use lucide-react icons: Trash
  </action>
  <verify>Check that SessionListItem.tsx has delete button with hover visibility</verify>
  <done>SessionListItem displays delete button on hover and handles deletion state</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Single session deletion feature with confirmation dialog, full-screen loading overlay, and loading states</what-built>
  <how-to-verify>
    1. Start dev server: `cd web && npm run dev`
    2. Visit http://localhost:3000
    3. Verify session list displays (mock data or real data)

    Test single delete:
    4. Hover over a session item (desktop)
    5. Click the delete (trash) button
    6. Verify confirmation dialog opens with:
       - Session name
       - Working directory
       - Warning text
    7. Click "Delete" button
    8. Verify **full-screen loading overlay appears** with spinner
    9. If backend is running: verify session is removed from list after overlay
    10. If backend is not running: verify error toast shows
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues to fix</resume-signal>
</task>

</tasks>

<verification>
After completing all tasks and checkpoint approval:

1. TypeScript compilation succeeds: `cd web && npx tsc --noEmit`
2. Single delete dialog shows correct session info
3. Full-screen loading overlay shows during deletion (not just button spinner)
4. Error toasts show on failure
5. Animations work for item removal
6. Running sessions show extra warning
</verification>

<success_criteria>
1. Single session deletion with confirmation works
2. Full-screen loading overlay displays during deletion (critical CONTEXT.md requirement)
3. Loading states prevent double-deletion
4. Error handling shows user-friendly messages
5. Running sessions show extra warning
6. Ready for plan 03-05b (batch delete)
</success_criteria>

<output>
After completion, create `.planning/phases/03-session-management/03-05a-SUMMARY.md`
</output>
