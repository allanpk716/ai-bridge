---
phase: 03-session-management
plan: 05b
type: execute
wave: 3
depends_on: ["03-05a"]
files_modified:
  - web/src/components/session/BatchDeleteDialog.tsx
  - web/src/pages/SessionList.tsx
  - web/src/components/ui/checkbox.tsx
autonomous: false

must_haves:
  truths:
    - User can enter selection mode via "Select" button
    - User can batch delete sessions with selection mode
    - Batch delete shows list of all sessions to be deleted
    - Batch delete has two-step confirmation (button then dialog)
    - Partial failures show detailed report (which succeeded/failed)
    - Selection mode toggles on/off with "Cancel" button
  artifacts:
    - path: web/src/components/session/BatchDeleteDialog.tsx
      provides: Batch delete confirmation dialog with session list and failure report
      min_lines: 100
    - path: web/src/pages/SessionList.tsx
      provides: Updated with selection mode state and batch delete UI
      min_lines: 120 (updated)
    - path: web/src/components/ui/checkbox.tsx
      provides: Checkbox component for selection
      exports: ["Checkbox"]
    - path: web/src/components/session/SessionListItem.tsx
      provides: Updated with selection checkbox (no delete button changes)
      min_lines: 100 (updated)
  key_links:
    - from: web/src/pages/SessionList.tsx
      to: web/src/components/session/BatchDeleteDialog.tsx
      via: "batch delete state and dialog"
      pattern: "batchDelete|selectedSessions"
    - from: web/src/components/session/BatchDeleteDialog.tsx
      to: web/src/lib/api/sessions.ts
      via: "useDeleteSession mutation"
      pattern: "useDeleteSession"
    - from: web/src/components/session/SessionListItem.tsx
      to: web/src/components/ui/checkbox.tsx
      via: "Checkbox component import"
      pattern: "import.*Checkbox"
---

<objective>
Implement batch session deletion with selection mode, two-step confirmation, and partial failure handling.

Purpose: Allows users to efficiently remove multiple unwanted sessions at once with proper safeguards and detailed feedback.

Output: Batch delete workflow with selection mode, confirmation dialog listing all sessions, and partial failure reporting.
</objective>

<execution_context>
@C:\Users\allan716\.claude\get-shit-done\workflows\execute-plan.md
@C:\Users\allan716\.claude\get-shit-done\templates\summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/03-session-management/03-CONTEXT.md
@.planning/phases/03-session-management/03-05a-PLAN.md

# Existing API service
@web/src/lib/api/sessions.ts

# Existing UI components
@web/src/components/ui/dialog.tsx
@web/src/components/ui/button.tsx
@web/src/components/ui/tooltip.tsx

# Existing session components
@web/src/components/session/SessionListItem.tsx
@web/src/components/session/SessionListFilters.tsx
@web/src/pages/SessionList.tsx

# Types
@web/src/types/api.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Checkbox component if needed</name>
  <files>web/src/components/ui/checkbox.tsx</files>
  <action>
    Check if Checkbox component exists. If not, add it:

    ```bash
    cd web && npx shadcn@latest add checkbox --yes
    ```

    Checkbox should have:
    - Base styles for unchecked/checked/indeterminate states
    - Focus ring for accessibility
    - Proper label association

    Verify the component exports Checkbox and can be imported via @/components/ui/checkbox
  </action>
  <verify>Check that checkbox.tsx exists in web/src/components/ui/</verify>
  <done>Checkbox component is available for batch selection</done>
</task>

<task type="auto">
  <name>Task 2: Create BatchDeleteDialog component</name>
  <files>web/src/components/session/BatchDeleteDialog.tsx</files>
  <action>
    Create BatchDeleteDialog component at web/src/components/session/BatchDeleteDialog.tsx:

    Props:
    - open: boolean
    - onOpenChange: (open: boolean) => void
    - sessions: Session[] (sessions to delete)
    - isDeleting: boolean
    - failedDeletions: string[] (session IDs that failed)
    - onConfirm: () => void

    Dialog content:
    - Title: "Delete {N} Sessions?"
    - Warning text: "This action cannot be undone"
    - Session list (scrollable if > 5 sessions):
      - Each session shows name and status badge
      - Running sessions have warning icon
      - Max height with overflow-y-auto
    - Failure report (if failedDeletions has items):
      - Show count of successful vs failed
      - List which sessions failed by name/ID

    Actions:
    - Cancel (Ghost)
    - Delete {N} Sessions (Destructive variant, disabled while isDeleting)

    Two-step confirmation (per CONTEXT.md):
    - First button click shows dialog with session list
    - Dialog shows all session names
    - User must confirm in dialog to proceed

    Use lucide-react icons: AlertCircle, Loader2, Check, X, TriangleAlert
  </action>
  <verify>Check that BatchDeleteDialog.tsx exists with batch confirmation UI</verify>
  <done>BatchDeleteDialog shows list of sessions and handles partial failures</done>
</task>

<task type="auto">
  <name>Task 3: Update SessionListItem with selection checkbox</name>
  <files>web/src/components/session/SessionListItem.tsx</files>
  <action>
    Update SessionListItem.tsx to add selection features (delete button from 03-05a remains unchanged):

    New props:
    - selectionMode: boolean
    - isSelected: boolean
    - onSelectionChange: (selected: boolean) => void

    Changes:
    1. Add selection checkbox (visible when selectionMode is true):
       - Checkbox on left side of item
       - Update isSelected state on change
       - When selectionMode is false, checkbox is hidden

    2. Update click behavior:
       - When selectionMode is true: clicking item body toggles checkbox
       - When selectionMode is false: clicking item body navigates (existing behavior)

    3. Visual feedback:
       - Selected items have different background/accent color
       - Hover state in selection mode shows clickable cursor

    Do NOT modify the delete button functionality from 03-05a.
  </action>
  <verify>Check that SessionListItem.tsx has selection checkbox prop and conditional rendering</verify>
  <done>SessionListItem displays checkbox in selection mode and toggles selection</done>
</task>

<task type="auto">
  <name>Task 4: Add selection mode to SessionList page</name>
  <files>web/src/pages/SessionList.tsx</files>
  <action>
    Update SessionList.tsx to support batch selection:

    1. Add state:
       - selectionMode: boolean (default false)
       - selectedSessionIds: Set<string>

    2. Add "Select" button in filters area (next to search/filter controls):
       - Text toggles between "Select" and "Cancel Selection"
       - Ghost variant
       - When active: shows selection mode UI

    3. In selection mode:
       - Show "Delete Selected" button (destructive variant) in header
       - Show count of selected sessions: "Delete Selected ({N})"
       - Button is disabled when N === 0
       - Pass selectionMode prop to SessionListItem components
       - Pass isSelected and onSelectionChange to each SessionListItem

    4. Handle selection:
       - Toggle session ID in selectedSessionIds set
       - Update "Delete Selected" button text with count

    5. Handle batch delete:
       - Import BatchDeleteDialog component
       - Add dialogOpen state
       - On "Delete Selected" click: open dialog with selected sessions
       - Pass selected session objects to dialog
       - On confirm: delete each session using useDeleteSession
       - Handle partial failures (collect failed IDs for report)
       - Show success/error toast after batch operation
       - Exit selection mode after deletion completes

    6. Reset selection when:
       - User clicks "Cancel Selection"
       - Deletion completes (successfully)
       - Dialog closes without action

    7. Layout considerations:
       - Selection mode replaces/hides some filter controls
       - Or add selection controls to a separate toolbar row
  </action>
  <verify>Check that SessionList.tsx has selection mode state, "Select" button, and batch delete logic</verify>
  <done>SessionList supports selection mode with batch delete and partial failure handling</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Complete batch session deletion feature with selection mode, two-step confirmation, and partial failure reporting</what-built>
  <how-to-verify>
    1. Start dev server: `cd web && npm run dev`
    2. Visit http://localhost:3000
    3. Verify session list displays

    Test selection mode:
    4. Click "Select" button in filters area
    5. Verify checkboxes appear on all session items
    6. Check multiple sessions (click checkboxes or item bodies)
    7. Verify "Delete Selected" button shows count: "Delete Selected (2)"
    8. Verify selected items have visual highlight

    Test batch delete:
    9. Click "Delete Selected" button
    10. Verify batch delete dialog shows:
        - Count of sessions to delete
        - List of all session names
        - Warning text
    11. Verify running sessions have warning icon in list
    12. Click "Delete" button in dialog
    13. If backend is running: verify sessions are removed from list
    14. If backend is not running: verify error toast shows

    Test selection mode exit:
    15. Click "Cancel Selection" button
    16. Verify checkboxes disappear
    17. Verify selection is cleared
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues to fix</resume-signal>
</task>

</tasks>

<verification>
After completing all tasks and checkpoint approval:

1. TypeScript compilation succeeds: `cd web && npx tsc --noEmit`
2. Batch delete dialog lists all selected sessions
3. Selection mode toggles correctly
4. Selected count updates in real-time
5. Partial failures are reported clearly
6. Checkbox selection works with item body clicks
7. "Cancel Selection" clears selection state
</verification>

<success_criteria>
1. Selection mode enables multi-select with checkboxes
2. Batch delete with two-step confirmation works
3. Partial failures show detailed report
4. Selection mode toggles on/off cleanly
5. Selected count displays accurately
6. Ready for plan 03-06a (session detail page foundation)
</success_criteria>

<output>
After completion, create `.planning/phases/03-session-management/03-05b-SUMMARY.md`
</output>
