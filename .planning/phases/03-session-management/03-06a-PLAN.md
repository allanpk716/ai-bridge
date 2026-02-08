---
phase: 03-session-management
plan: 06a
type: execute
wave: 2
depends_on: ["03-01"]
files_modified:
  - web/src/lib/api/sessions.ts
  - web/src/components/session/SessionMetadata.tsx
  - web/src/pages/SessionDetail.tsx
autonomous: true

must_haves:
  truths:
    - User can view session detail page with session metadata
    - Session detail displays: session name, status, working directory, model, git branch, message count, created date
    - Page shows loading state while fetching session data
    - Page shows error state with retry option if fetch fails
    - Status badges use correct variants (idle→default, processing→secondary, waiting→outline, stopped→destructive)
  artifacts:
    - path: web/src/lib/api/sessions.ts
      provides: fetchSession function and useSession hook
      exports: ["fetchSession", "useSession"]
      min_lines: 40 (added)
    - path: web/src/components/session/SessionMetadata.tsx
      provides: Session metadata display (working dir, model, git info, message count, created date)
      min_lines: 80
    - path: web/src/pages/SessionDetail.tsx
      provides: Updated session detail page with data fetching and metadata display
      min_lines: 100 (updated)
  key_links:
    - from: web/src/pages/SessionDetail.tsx
      to: web/src/lib/api/sessions.ts
      via: "useSession hook"
      pattern: "useSession"
    - from: web/src/lib/api/sessions.ts
      to: "/api/v1/sessions/:id"
      via: "GET request for single session"
      pattern: "GET.*sessions.*:id"
    - from: web/src/pages/SessionDetail.tsx
      to: web/src/components/session/SessionMetadata.tsx
      via: "component import and rendering"
      pattern: "import.*SessionMetadata"
---

<objective>
Build the session detail page foundation with data fetching and metadata display.

Purpose: Provides the detailed view for individual sessions where users can see session information. This is the rendering/data layer; resume/stop actions are added in 03-06b.

Output: Session detail page that fetches and displays session metadata with proper loading and error states.
</objective>

<execution_context>
@C:\Users\allan716\.claude\get-shit-done\workflows\execute-plan.md
@C:\Users\allan716\.claude\get-shit-done\templates\summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/03-session-management/03-CONTEXT.md
@.planning/phases/03-session-management/03-01-PLAN.md

# Existing API service
@web/src/lib/api/sessions.ts

# Existing UI components
@web/src/components/ui/badge.tsx
@web/src/components/ui/card.tsx
@web/src/components/ui/button.tsx

# Existing pages
@web/src/pages/SessionDetail.tsx
@web/src/router/index.tsx

# Types
@web/src/types/api.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add single session API functions</name>
  <files>web/src/lib/api/sessions.ts</files>
  <action>
    Add single session fetch functionality to web/src/lib/api/sessions.ts:

    1. Create fetchSession function:
       - Accepts sessionId: string
       - Makes GET request to /api/v1/sessions/:sessionId
       - Returns Session object
       - Validates with SessionSchema

    2. Create useSession hook:
       - Accepts sessionId: string
       - Uses useQuery with queryKey ['session', sessionId]
       - Enabled only when sessionId is defined
       - 5-second stale time
       - Returns UseQueryResult<Session, Error>

    Export fetchSession and useSession.

    Note: resumeSession and stopSession will be added in plan 03-06b.
  </action>
  <verify>Check that sessions.ts exports fetchSession and useSession</verify>
  <done>Single session fetch API and hook are available</done>
</task>

<task type="auto">
  <name>Task 2: Create SessionMetadata component</name>
  <files>web/src/components/session/SessionMetadata.tsx</files>
  <action>
    Create SessionMetadata component at web/src/components/session/SessionMetadata.tsx:

    Props:
    - session: Session

    Display sections (Card-based layout):
    1. Status:
       - Badge component with status color
       - Same variants as list: idle→default, processing→secondary, waiting→outline, stopped→destructive
       - Icon + text (English): Idle, Processing, Waiting, Stopped

    2. Working Directory:
       - Label: "Working Directory"
       - Value: Last folder name (bold), full path in subtitle
       - Icon: Folder
       - Tooltip shows full path on hover

    3. Model:
       - Label: "Model"
       - Value: Badge with model name (from metadata.model or "Default")
       - Icon: Cpu

    4. Git Information (if available):
       - Label: "Git Branch"
       - Value: Branch name from metadata.gitBranch
       - Icon: GitBranch
       - If not git repo: "Not a git repository" in muted text

    5. Message Count (if available):
       - Label: "Messages"
       - Value: Count from metadata.messageCount
       - Icon: MessageSquare

    6. Created At:
       - Label: "Created"
       - Value: Formatted date/time (relative if < 24h, absolute otherwise)
       - Icon: Calendar

    Layout:
    - Grid layout (2 columns on desktop, 1 on mobile)
    - Each section in a Card sub-component
    - Consistent icon usage
    - Responsive gap between cards

    Use lucide-react icons: Folder, GitBranch, MessageSquare, Calendar, Cpu, Circle, Loader, Clock, X
  </action>
  <verify>Check that SessionMetadata.tsx exists and displays all session info</verify>
  <done>SessionMetadata displays session information in card layout</done>
</task>

<task type="auto">
  <name>Task 3: Update SessionDetail page with data fetching and metadata</name>
  <files>web/src/pages/SessionDetail.tsx</files>
  <action>
    Update SessionDetail.tsx to implement data fetching and metadata display:

    1. Import hooks and components:
       - useSession from API
       - useNavigateToSessionList from router
       - SessionMetadata component

    2. Get session ID from URL params:
       - Use useParams hook from react-router-dom
       - Extract 'id' parameter

    3. Fetch session data:
       - Use useSession(id) hook
       - Handle loading state: Show skeleton or full-page spinner
       - Handle error state: Show error with retry/back options
       - Handle not found: Navigate back to list with toast (optional enhancement)

    4. Replace existing placeholder with:
       - Page header with session name/ID
       - SessionMetadata component for displaying all info
       - Placeholder area for messages (ready for Phase 4)

    5. Back navigation:
       - Keep existing back button behavior (mobile only)
       - Use useNavigateToSessionList utility

    Loading state: Full-page skeleton loader or centered spinner
    Error state: Error message with "Go Back" button and retry option

    Note: Resume, stop, and delete actions will be added in plan 03-06b.
    Do NOT add action buttons yet - this plan focuses on data display only.
  </action>
  <verify>Check that SessionDetail.tsx uses useSession and renders SessionMetadata</verify>
  <done>SessionDetail page fetches session data and displays metadata with proper states</done>
</task>

</tasks>

<verification>
After completing all tasks, verify:

1. TypeScript compilation succeeds: `cd web && npx tsc --noEmit`
2. Session detail page loads with session data
3. All metadata displays correctly with correct icons
4. Status badges use correct colors per CONTEXT.md
5. Loading state shows while fetching
6. Error state handles API failures gracefully
7. Back navigation works correctly
</verification>

<success_criteria>
1. Session detail page displays all session metadata
2. Status badges use correct variants and icons
3. Loading state prevents confusion during fetch
4. Error state provides clear feedback and recovery options
5. Navigation back to list works
6. Ready for plan 03-06b (resume and stop functionality)
</success_criteria>

<output>
After completion, create `.planning/phases/03-session-management/03-06a-SUMMARY.md`
</output>
