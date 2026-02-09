---
phase: 05-pwa-features
plan: 03
subsystem: pwa
tags: [service-worker, update-prompt, vite-plugin-pwa, react-hooks]

# Dependency graph
requires:
  - phase: 05-01
    provides: PWA foundation with vite-plugin-pwa configuration, Service Worker registration in main.tsx
provides:
  - UpdatePrompt component using useRegisterSW hook for Service Worker update management
  - Modal dialog UI with single "立即更新" button (per CONTEXT.md decision)
  - Periodic update checking (hourly in production)
  - Barrel export for clean PWA component imports
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useRegisterSW hook from virtual:pwa-register/react for Service Worker lifecycle
    - Modal dialog pattern (non-dismissible except by updating)
    - Chinese localization for PWA messages
    - Component barrel exports (@/components/pwa)

key-files:
  created:
    - web/src/components/pwa/UpdatePrompt.tsx
    - web/src/components/pwa/index.ts
  modified:
    - web/src/App.tsx

key-decisions:
  - "Single update button: No 'later' or 'dismiss' options per CONTEXT.md"
  - "Modal dialog: Not inline notification, requires user action"
  - "Periodic checks: Hourly update checks in production via setInterval"

patterns-established:
  - "PWA Component Pattern: Export all PWA components from barrel (@/components/pwa)"
  - "Update Prompt Pattern: useRegisterSW → needRefresh state → Dialog → updateServiceWorker(true)"

# Metrics
duration: 3min
completed: 2026-02-09
---

# Phase 5 Plan 3: Service Worker Update Prompt Summary

**Modal dialog update prompt with useRegisterSW hook, single "立即更新" button, and hourly periodic checks**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-09T07:05:09Z
- **Completed:** 2026-02-09T07:07:54Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Created UpdatePrompt component using `useRegisterSW` hook from `virtual:pwa-register/react`
- Configured modal dialog with Chinese messaging ("新版本可用", "应用已更新,请刷新以获取最新版本")
- Implemented single "立即更新" button (no dismiss/later options per CONTEXT.md decision)
- Added periodic update checking (hourly in production) via `setInterval(registration.update(), ...)`
- Integrated UpdatePrompt into App.tsx for global availability on all routes
- Created barrel export for clean PWA component imports

## Task Commits

Each task was committed atomically:

1. **Task 1: Create UpdatePrompt component** - `6c36c5c` (feat)
2. **Task 2: Export UpdatePrompt from barrel** - `04988cb` (feat)
3. **Task 3: Integrate UpdatePrompt in App.tsx** - `23b81db` (feat)

**Plan metadata:** N/A (will be committed with STATE.md update)

## Files Created/Modified

### Created

- `web/src/components/pwa/UpdatePrompt.tsx` - Service Worker update prompt dialog component
  - Uses `useRegisterSW` hook for SW lifecycle management
  - Modal dialog with `open={needRefresh}` control
  - `onRegisteredSW` callback with periodic update checks
  - `onRegisterError` callback for error logging
  - Returns `null` when no update needed

- `web/src/components/pwa/index.ts` - PWA components barrel export
  - Exports `UpdatePrompt` (new)
  - Exports `OfflineBanner` (from 05-02)
  - Enables clean imports: `import { UpdatePrompt } from '@/components/pwa'`

### Modified

- `web/src/App.tsx` - Integrated UpdatePrompt component
  - Added `UpdatePrompt` to PWA barrel import
  - Rendered inside `ThemeProvider` alongside `ConnectionDialog` and `OfflineBanner`
  - Placed before `RouterProvider` for correct modal overlay behavior
  - Available on all routes when update is detected

## Decisions Made

All decisions followed CONTEXT.md and RESEARCH.md guidance:

1. **Single update button** - Per CONTEXT.md, only "立即更新" button with no "later" or "dismiss" options
2. **Modal dialog** - Per CONTEXT.md, modal dialog (not inline notification) using shadcn/ui Dialog component
3. **Chinese localization** - Used Chinese text for title ("新版本可用") and description ("应用已更新,请刷新以获取最新版本")
4. **Periodic update checks** - Added hourly `registration.update()` in production to detect updates proactively
5. **Integration location** - Placed UpdatePrompt in App.tsx at same level as ConnectionDialog for global modal availability

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed successfully without blocking issues.

## Testing Notes

Update flow testing is complex in development environment:

- **Component renders correctly** - TypeScript compilation passes
- **Dialog UI follows shadcn/ui patterns** - Uses Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
- **Hook usage verified** - `useRegisterSW` imported from `virtual:pwa-register/react`, destructure `offlineReady`, `needRefresh`, `updateServiceWorker`
- **Production testing required** - Full update flow (new SW detection → prompt display → update application) requires production environment
  - Development has PWA disabled (`devOptions.enabled: false` in vite.config.ts)
  - Update testing requires: build → deploy → modify code → rebuild → deploy → trigger update check

## Next Phase Readiness

**Ready for Phase 5-04: PWA Install Prompt**

- UpdatePrompt component complete and integrated
- PWA barrel export established for clean imports
- Pattern established for PWA components (OfflineBanner, UpdatePrompt)
- Ready to implement install button with `beforeinstallprompt` event handling

**No blockers or concerns**

---
*Phase: 05-pwa-features*
*Plan: 03*
*Completed: 2026-02-09*
