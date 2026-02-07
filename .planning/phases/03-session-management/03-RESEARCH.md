# Phase 3: Session Management - Research

**Researched:** 2026-02-08
**Domain:** React + TanStack Query + Socket.IO + File System Access API
**Confidence:** HIGH

## Summary

Phase 3 delivers complete session lifecycle management (CRUD operations) with working directory selection, model choice, and real-time list updates. The research identified standard patterns for React CRUD with TanStack Query v5, File System Access API for directory picking, Motion for animations, and Radix UI for context menus.

**Primary recommendation:** Use existing Phase 2 infrastructure (TanStack Query, Socket.IO) + add Motion for animations + File System Access API for directory picker + Radix UI Dropdown Menu for context menu. No new major libraries needed beyond Motion (if animations desired).

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-query | ^5.90.20 | Data fetching, caching, mutations | De facto standard for server state in React |
| react-router | 7.9 | Navigation, nested routes | Latest React Router with data loaders |
| zustand | ^5.0.11 | Local state management | Lightweight, simple state management |
| socket.io-client | ^4.8.3 | Real-time updates | Standard WebSocket library with fallbacks |
| zod | ^4.3.6 | Runtime validation | Type-safe validation for forms/API |

### Supporting (To Install)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| motion | ^11.0+ | List animations (exit/enter) | Optional - for polished list item animations |
| @radix-ui/react-dropdown-menu | ^2.1.0 | Context menu implementation | For right-click context menu on session items |

### Already Installed (shadcn/ui components)
- Button, Input, Card, Badge, Dialog - from Phase 1
- These will be used extensively throughout Phase 3

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Motion | Framer Motion | Motion is the new name (v11+), same library |
| Radix UI Dropdown | react-contexify | Radix has better accessibility, already using Radix |
| File System Access API | `<input type="file" webkitdirectory>` | FSAA is more modern, can request write permissions |

**Installation:**
```bash
# Only if wanting animations (Claude's discretion)
npm install motion

# For context menu (or use shadcn/ui dropdown)
npx shadcn@latest add dropdown-menu
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── pages/
│   ├── sessions.tsx           # Session list page
│   ├── session-create.tsx     # Create session wizard
│   └── session-detail.tsx     # Session detail/resume page
├── components/
│   ├── session/
│   │   ├── SessionList.tsx            # List container
│   │   ├── SessionListItem.tsx        # Individual item with animations
│   │   ├── SessionStatusBadge.tsx     # Status indicator component
│   │   ├── CreateSessionWizard.tsx    # Multi-step form
│   │   ├── WorkingDirPicker.tsx       # Directory selection
│   │   ├── ModelSelector.tsx          # Model cards (Haiku/Sonnet/Opus)
│   │   ├── CLIParamsForm.tsx          # CLI parameters configuration
│   │   ├── SessionContextMenu.tsx     # Right-click menu
│   │   └── DeleteSessionDialog.tsx    # Delete confirmation
│   └── ui/                      # shadcn/ui components (already exists)
├── hooks/
│   ├── useSessions.ts          # TanStack Query hooks (already exists)
│   ├── useRecentDirectories.ts # localStorage for recent dirs
│   └── useGitInfo.ts           # Git repo/branch detection hook
├── lib/
│   ├── api/
│   │   └── sessions.ts         # API service (already exists)
│   ├── storage/
│   │   └── recent-dirs.ts      # localStorage utilities
│   └── utils/
│       └── git-detector.ts     # Git detection utilities
└── types/
    └── session.ts              # Session types (already exists in api.ts)
```

### Pattern 1: TanStack Query CRUD with Optimistic Updates
**What:** Use TanStack Query's `useMutation` with `onMutate` for optimistic UI updates, `onError` for rollback, and `onSettled` for cache invalidation.

**When to use:** Creating, updating, deleting sessions with immediate UI feedback.

**Example:**
```typescript
// Source: Context7 - /tanstack/query
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useDeleteSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`/api/v1/sessions/${sessionId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Delete failed')
      return sessionId
    },
    onMutate: async (sessionId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['sessions'] })

      // Snapshot previous data
      const previousSessions = queryClient.getQueryData(['sessions'])

      // Optimistically update cache
      queryClient.setQueryData(['sessions'], (old: Session[]) =>
        old.filter(s => s.id !== sessionId)
      )

      // Return context for rollback
      return { previousSessions }
    },
    onError: (err, sessionId, context) => {
      // Rollback on error
      queryClient.setQueryData(['sessions'], context.previousSessions)
    },
    onSettled: () => {
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}
```

### Pattern 2: Real-time List Updates with Socket.IO
**What:** Subscribe to Socket.IO events for session updates, merge with TanStack Query cache for hybrid real-time + polling approach.

**When to use:** Session status changes, new sessions created, deleted sessions.

**Example:**
```typescript
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSocketEvent } from '@/lib/socket/hooks'

export function useSessionRealtimeUpdates() {
  const queryClient = useQueryClient()

  // Update session status
  useSocketEvent('session:status', (data) => {
    queryClient.setQueryData(['sessions'], (old: Session[] = []) =>
      old.map(s => s.id === data.sessionId
        ? { ...s, status: data.status }
        : s
      )
    )
  })

  // New session created
  useSocketEvent('session:created', (session) => {
    queryClient.setQueryData(['sessions'], (old: Session[] = []) =>
      [...old, session]
    )
  })

  // Session deleted
  useSocketEvent('session:deleted', ({ sessionId }) => {
    queryClient.setQueryData(['sessions'], (old: Session[] = []) =>
      old.filter(s => s.id !== sessionId)
    )
  })
}
```

### Pattern 3: File System Access API for Directory Selection
**What:** Use `window.showDirectoryPicker()` for modern directory selection with read/write permissions.

**When to use:** User needs to select a working directory for Claude CLI session.

**Example:**
```typescript
// Source: MDN Web Docs + Chrome DevRel
interface DirectoryInfo {
  handle: FileSystemDirectoryHandle
  path: string // Note: Full path NOT available for security
  name: string
}

export async function selectDirectory(): Promise<DirectoryInfo | null> {
  try {
    const handle = await window.showDirectoryPicker({
      mode: 'readwrite', // Request write permissions
      startIn: 'documents',
    })

    // Security: Can't get full path, only directory name
    return {
      handle,
      path: handle.name, // Only name, not full path
      name: handle.name,
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      // User cancelled
      return null
    }
    throw error
  }
}

// Feature detection
export function supportsDirectoryPicker(): boolean {
  return 'showDirectoryPicker' in window
}

// Fallback for browsers without FSAA
export function selectDirectoryFallback(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.webkitdirectory = true
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files && files.length > 0) {
        // Get directory path from first file
        const path = files[0].webkitRelativePath?.split('/')[0]
        resolve(path || null)
      } else {
        resolve(null)
      }
    }
    input.click()
  })
}
```

### Pattern 4: Multi-Step Wizard with Validation
**What:** Step-by-step form with validation at each step, using controlled state and form libraries (optional React Hook Form).

**When to use:** Complex session creation flow with directory selection, model choice, CLI params.

**Example:**
```typescript
import { useState } from 'react'

type Step = 'directory' | 'model' | 'params' | 'confirm'

interface CreateSessionWizardProps {
  onSubmit: (config: CreateSessionConfig) => void
}

export function CreateSessionWizard({ onSubmit }: CreateSessionWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('directory')
  const [formData, setFormData] = useState<Partial<CreateSessionConfig>>({})

  const steps: Step[] = ['directory', 'model', 'params', 'confirm']
  const currentStepIndex = steps.indexOf(currentStep)

  const canProceed = () => {
    switch (currentStep) {
      case 'directory': return !!formData.workingDir
      case 'model': return !!formData.model
      case 'params': return true // Optional
      case 'confirm': return true
    }
  }

  const handleNext = () => {
    if (canProceed() && currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1])
    }
  }

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1])
    }
  }

  const handleSubmit = () => {
    if (canProceed()) {
      onSubmit(formData as CreateSessionConfig)
    }
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center
              ${index <= currentStepIndex ? 'bg-primary text-primary-foreground' : 'bg-muted'}
            `}>
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 ${index < currentStepIndex ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      {currentStep === 'directory' && (
        <WorkingDirPicker
          value={formData.workingDir}
          onChange={(dir) => setFormData({ ...formData, workingDir: dir })}
        />
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={handleBack}
          disabled={currentStepIndex === 0}
        >
          Back
        </button>
        {currentStepIndex === steps.length - 1 ? (
          <button onClick={handleSubmit}>Create Session</button>
        ) : (
          <button onClick={handleNext} disabled={!canProceed()}>
            Next
          </button>
        )}
      </div>
    </div>
  )
}
```

### Pattern 5: Responsive Mobile-Card/Desktop-List Layout
**What:** Use Tailwind's responsive utilities to switch between card layout (mobile) and list layout (desktop).

**When to use:** Session list needs to work well on both mobile and desktop.

**Example:**
```typescript
// Source: Tailwind CSS v4 responsive grid patterns
export function SessionList({ sessions }: { sessions: Session[] }) {
  return (
    <div className="
      grid
      grid-cols-1           // Mobile: 1 column (cards)
      md:grid-cols-1        // Tablet: Still cards but wider
      lg:grid-cols-1        // Desktop: Switch to vertical list
      gap-4
    ">
      {sessions.map((session) => (
        <SessionListItem key={session.id} session={session} />
      ))}
    </div>
  )
}

// Individual item with responsive card/list styles
export function SessionListItem({ session }: { session: Session }) {
  return (
    <div className="
      // Card style (mobile)
      p-4 rounded-lg border bg-card

      // List row style (desktop)
      lg:flex-row lg:items-center lg:gap-4 lg:py-3 lg:px-4

      // Hover effects
      hover:shadow-md transition-shadow
    ">
      <div className="flex-1">
        <h3 className="font-semibold">{session.metadata?.name || session.id}</h3>
        <p className="text-sm text-muted-foreground truncate">
          {session.metadata?.workingDir || 'No directory'}
        </p>
      </div>

      <div className="flex items-center gap-2 mt-2 lg:mt-0">
        <SessionStatusBadge status={session.status} />
        <span className="text-sm text-muted-foreground">
          {session.metadata?.model || 'haiku'}
        </span>
      </div>
    </div>
  )
}
```

### Pattern 6: Motion Animations for List Items
**What:** Use Motion's `AnimatePresence` and `motion.div` for exit animations when deleting items.

**When to use:** Session deletion, adding new items, reordering lists.

**Example:**
```typescript
// Source: Motion.dev - AnimatePresence with list items
import { AnimatePresence, motion } from 'motion/react'

export function SessionList({ sessions }: { sessions: Session[] }) {
  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {sessions.map((session) => (
          <motion.div
            key={session.id}
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SessionListItem session={session} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
```

### Pattern 7: Context Menu with Radix UI
**What:** Use Radix UI's Dropdown Menu component positioned at click coordinates for right-click context menu.

**When to use:** Quick actions on session items (delete, rename, stop, copy ID).

**Example:**
```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'

export function SessionListItem({ session }: { session: Session }) {
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null)

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenuPosition({ x: e.clientX, y: e.clientY })
  }

  return (
    <div onContextMenu={handleContextMenu} className="relative">
      {/* Session content */}

      <DropdownMenu open={!!contextMenuPosition} onOpenChange={(open) => !open && setContextMenuPosition(null)}>
        <DropdownMenuTrigger asChild>
          <div style={{ position: 'absolute', left: contextMenuPosition?.x, top: contextMenuPosition?.y }} />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => console.log('Delete', session.id)}>
            Delete
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => console.log('Rename', session.id)}>
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => console.log('Copy ID', session.id)}>
            Copy ID
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
```

### Pattern 8: localStorage for Recent Directories
**What:** Type-safe localStorage wrapper with JSON serialization for storing recent working directories.

**When to use:** Persisting user's recently used directories across sessions.

**Example:**
```typescript
// Source: Multiple localStorage + TypeScript patterns
interface RecentDirectory {
  path: string
  name: string
  gitBranch?: string
  lastUsed: string
}

const RECENT_DIRS_KEY = 'recent-directories'
const MAX_RECENT_DIRS = 5

export function useRecentDirectories() {
  const getRecentDirs = (): RecentDirectory[] => {
    try {
      const stored = localStorage.getItem(RECENT_DIRS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  const addRecentDir = (dir: Omit<RecentDirectory, 'lastUsed'>) => {
    const recent = getRecentDirs()
    const newDir: RecentDirectory = {
      ...dir,
      lastUsed: new Date().toISOString(),
    }

    // Remove if already exists
    const filtered = recent.filter(d => d.path !== newDir.path)

    // Add to front, limit to 5
    const updated = [newDir, ...filtered].slice(0, MAX_RECENT_DIRS)

    localStorage.setItem(RECENT_DIRS_KEY, JSON.stringify(updated))
  }

  return {
    recentDirs: getRecentDirs(),
    addRecentDir,
  }
}
```

### Pattern 9: Git Repository Detection
**What:** Check if selected directory is a Git repository and detect current branch.

**When to use:** Displaying Git branch info in session list/metadata.

**Example:**
```typescript
// Source: Stack Overflow + simple-git patterns
export async function detectGitRepo(dirPath: string): Promise<{ isRepo: boolean; branch?: string }> {
  try {
    // Check for .git directory
    const gitDir = await fetch(`/api/fs/check-git?path=${encodeURIComponent(dirPath)}`)
    const { isGitRepo } = await gitDir.json()

    if (!isGitRepo) {
      return { isRepo: false }
    }

    // Get current branch via backend API (safer than client-side)
    const branchInfo = await fetch(`/api/fs/git-branch?path=${encodeURIComponent(dirPath)}`)
    const { branch } = await branchInfo.json()

    return { isRepo: true, branch }
  } catch {
    return { isRepo: false }
  }
}

// Frontend hook
export function useGitInfo(dirPath: string) {
  const [gitInfo, setGitInfo] = useState<{ isRepo: boolean; branch?: string }>({ isRepo: false })

  useEffect(() => {
    detectGitRepo(dirPath).then(setGitInfo)
  }, [dirPath])

  return gitInfo
}
```

### Anti-Patterns to Avoid
- **Don't use naive localStorage**: Always wrap with try-catch and handle quota exceeded errors
- **Don't rely solely on WebSocket events**: TanStack Query provides better error handling and caching
- **Don't hardcode animation values**: Use CSS variables for durations and easing
- **Don't use inline event handlers**: Extract handlers for better testability
- **Don't ignore mobile context menus**: Long-press (700ms) for mobile context menu support
- **Don't store full file paths**: Security limitation of File System Access API

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Directory picker | Custom file input | `window.showDirectoryPicker()` | Security, permissions, better UX |
| Form validation | Manual validation | Zod schemas | Type-safe, reusable, already installed |
| Optimistic updates | Manual state management | TanStack Query `onMutate` | Rollback on error, cache invalidation |
| Context menu positioning | Manual calculation | Radix UI Dropdown Menu | Collision detection, accessibility, keyboard nav |
| List animations | CSS transitions | Motion `AnimatePresence` | Exit animations, layout animations |
| Type-safe localStorage | `localStorage.getItem()` directly | Wrapper utility with generics | Serialization, error handling, type safety |

**Key insight:** The File System Access API alone is worth using - it provides a secure, modern way to access directories with user permission and read/write modes. Building a custom solution with `<input type="file">` gives you less functionality and worse UX.

## Common Pitfalls

### Pitfall 1: TanStack Query Cache Staleness
**What goes wrong:** Session list shows stale data, updates from Socket.IO conflict with refetches.

**Why it happens:** Not setting proper `staleTime`, not invalidating queries after mutations, race conditions between Socket events and refetches.

**How to avoid:**
- Set appropriate `staleTime` (5-10 seconds) on `useSessions`
- Use `queryClient.setQueryData` for Socket updates (don't refetch)
- Always `invalidateQueries` in mutation `onSettled`
- Use `cancelQueries` in mutation `onMutate` to prevent race conditions

**Warning signs:** Data flickers, duplicates appear, old data reappears after updates.

### Pitfall 2: File System Access API Browser Support
**What goes wrong:** Directory picker doesn't work in Firefox/Safari.

**Why it happens:** File System Access API is Chromium-only (Chrome, Edge, Opera).

**How to avoid:**
```typescript
// Always feature detect
const supportsFSAA = 'showDirectoryPicker' in window

// Provide fallback
const selectDir = supportsFSAA
  ? selectDirectoryModern
  : selectDirectoryFallback
```

**Warning signs:** Nothing happens when clicking "Select Directory", browser console errors.

### Pitfall 3: Motion Animation Performance
**What goes wrong:** List animations are jerky, 100+ items cause lag.

**Why it happens:** Not using `layout` prop, animating too many properties, not using `mode="popLayout"`.

**How to avoid:**
- Always use `layout` prop for layout animations
- Use `mode="popLayout"` in `AnimatePresence` for better performance
- Keep animations short (200-300ms)
- Use `transform` and `opacity` only (avoid `width`, `height`)

**Warning signs:** Frame drops in DevTools Performance tab, animations feel sluggish.

### Pitfall 4: Context Menu Accessibility
**What goes wrong:** Context menu not keyboard accessible, not screen reader friendly.

**Why it happens:** Custom context menu implementation without ARIA attributes.

**How to avoid:**
- Use Radix UI components (built-in accessibility)
- Ensure `role="menu"` and `role="menuitem"` attributes
- Support keyboard navigation (Arrow keys, Enter, Escape)
- Support long-press on mobile (700ms delay)

**Warning signs:** Can't navigate menu with Tab/Arrow keys, screen reader doesn't announce menu items.

### Pitfall 5: localStorage Quota Exceeded
**What goes wrong:** App crashes when trying to save to localStorage.

**Why it happens:** localStorage has 5-10MB limit per origin, trying to store too much data.

**How to avoid:**
```typescript
try {
  localStorage.setItem(key, value)
} catch (e) {
  if (e instanceof DOMException && e.code === 22) {
    // Quota exceeded, handle gracefully
    console.warn('localStorage quota exceeded')
    // Fallback to memory state or clear old data
  }
}
```

**Warning signs:** Random data loss, app crashes on save, "QuotaExceededError" in console.

### Pitfall 6: Socket.IO Memory Leaks
**What goes wrong:** App slows down over time, memory usage increases.

**Why it happens:** Event listeners not cleaned up, multiple subscriptions to same event.

**How to avoid:**
- Use custom `useSocketEvent` hook (already in Phase 2)
- Always return cleanup function from `useEffect`
- Don't subscribe to same event multiple times

**Warning signs:** Memory profiler shows growing heap, event handlers fire multiple times.

## Code Examples

### TanStack Query for Session CRUD
```typescript
// Source: Context7 /tanstack/query
export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
    staleTime: 5000, // Consider data stale after 5 seconds
  })
}

export function useCreateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSession,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success(`Session "${data.id}" created`)
    },
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sessionId: string) => {
      await fetch(`/api/v1/sessions/${sessionId}`, { method: 'DELETE' })
      return sessionId
    },
    onMutate: async (sessionId) => {
      await queryClient.cancelQueries({ queryKey: ['sessions'] })
      const previous = queryClient.getQueryData(['sessions'])
      queryClient.setQueryData(['sessions'], (old: Session[]) =>
        old.filter(s => s.id !== sessionId)
      )
      return { previous }
    },
    onError: (err, sessionId, context) => {
      queryClient.setQueryData(['sessions'], context.previous)
      toast.error('Failed to delete session')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}
```

### React Router Nested Routes
```typescript
// Source: Context7 /remix-run/react-router
import { createBrowserRouter, Routes, Route, Outlet } from 'react-router'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <SessionList /> },
      {
        path: 'sessions',
        children: [
          { index: true, element: <SessionList /> },
          { path: 'new', element: <CreateSessionWizard /> },
          { path: ':sessionId', element: <SessionDetail /> },
        ],
      },
    ],
  },
])

function Layout() {
  return (
    <div>
      <nav>...</nav>
      <Outlet /> {/* Child routes render here */}
    </div>
  )
}
```

### Motion Exit Animations
```typescript
// Source: Motion.dev
import { AnimatePresence, motion } from 'motion/react'

export function SessionList({ sessions }: { sessions: Session[] }) {
  const deleteMutation = useDeleteSession()

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {sessions.map((session) => (
          <motion.div
            key={session.id}
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="bg-card p-4 rounded-lg"
          >
            <SessionListItem
              session={session}
              onDelete={() => deleteMutation.mutate(session.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual fetch/useState | TanStack Query v5 | 2023-2024 | Automatic caching, refetching, optimistic updates |
| CSS transitions | Motion (Framer Motion v11) | 2024 | Better layout animations, exit animations |
| React Router v5 | React Router v7 | 2024-2025 | Data loaders, better TypeScript support |
| Basic localStorage | Type-safe wrappers | Ongoing | Better error handling, type safety |
| Custom context menus | Radix UI components | 2022-2024 | Accessibility-first, keyboard navigation |

**Deprecated/outdated:**
- **React Router v5**: Switch to v7 with data loaders
- **Framer Motion name**: Rebranded to "Motion" (v11+)
- **Manual WebSocket handling**: Use Socket.IO with React hooks
- **Formik**: React Hook Form + Zod is the modern choice (but already have Zod, may not need RHF for simple wizard)

## Open Questions

1. **Git Detection Approach**
   - What we know: Backend can provide Git info via metadata, client-side detection via `simple-git` or API
   - What's unclear: Whether backend already provides Git branch in session metadata
   - Recommendation: Check backend API for `metadata.gitBranch` first, fallback to client-side detection if needed

2. **Session Resume Strategy**
   - What we know: Need to support `--continue` and `--resume` CLI flags
   - What's unclear: Exact API endpoint for resuming sessions (POST vs PATCH, payload structure)
   - Recommendation: Research backend API docs for session resume endpoint, likely `POST /api/v1/sessions/:id/resume` with `mode` parameter

3. **Animation Library Choice**
   - What we know: Motion is modern and powerful
   - What's unclear: Performance impact with 100+ sessions in list
   - Recommendation: Start without animations, add Motion incrementally and measure performance

## Sources

### Primary (HIGH confidence)
- /tanstack/query - Optimistic updates, cache invalidation, useMutation patterns
- /remix-run/react-router - Nested routes, route parameters, navigation
- /websites/motion_dev - AnimatePresence, exit animations, layout animations
- MDN Web Docs - File System Access API, window.showDirectoryPicker()
- Chrome DevRel - File System Access API tutorials, browser support

### Secondary (MEDIUM confidence)
- WebSearch verified with official sources:
  - React Hook Form + Zod wizard patterns
  - Tailwind CSS responsive grid layouts
  - localStorage TypeScript patterns
  - Git detection approaches

### Tertiary (LOW confidence)
- WebSearch only:
  - Context menu library comparisons (react-contexify vs Radix UI)
  - specific animation timing values (Claude's discretion)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries well-established, widely used
- Architecture: HIGH - Patterns from official Context7 docs and MDN
- Pitfalls: HIGH - Common issues documented in official docs and community best practices

**Research date:** 2026-02-08
**Valid until:** 2026-03-10 (30 days - stable ecosystem, but verify API changes)

---

*Phase: 03-session-management*
*Research completed: 2026-02-08*
