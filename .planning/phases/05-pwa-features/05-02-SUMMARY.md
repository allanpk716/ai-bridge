---
phase: 05-pwa-features
plan: 02
subsystem: pwa
tags: [react, offline-detection, navigator-online, pwa]

# Dependency graph
requires:
  - phase: 05-01
    provides: vite-plugin-pwa configuration, service worker registration
provides:
  - useOnlineStatus hook for browser-native online/offline detection
  - OfflineBanner component with prominent red warning banner
  - PWA component barrel export pattern for future PWA components
affects: [05-03, 05-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Browser-native navigator.onLine API for network status detection
    - Event listener pattern for online/offline state changes
    - Fixed positioning with z-index overlay for banner UI
    - Barrel export pattern for component organization

key-files:
  created:
    - web/src/hooks/useOnlineStatus.ts
    - web/src/components/pwa/OfflineBanner.tsx
    - web/src/components/pwa/index.ts
  modified:
    - web/src/App.tsx

key-decisions:
  - "No external dependencies for offline detection - use browser-native navigator.onLine API"
  - "Banner persists while offline with no close button - clear persistent feedback"
  - "Red background with white text for maximum visibility (CONTEXT.md requirement)"
  - "Responsive layout: stacked text on mobile, inline text on desktop"

patterns-established:
  - "useOnlineStatus Hook: useState + useEffect with event listeners for browser API integration"
  - "PWA Component Organization: Barrel export in index.ts for clean imports"
  - "Fixed Banner Pattern: z-index: 50, full-width flex layout, no close button"
  - "Early Return Pattern: Component returns null when not needed (online state)"

# Metrics
duration: 3min
completed: 2026-02-09
---

# Phase 5: PWA Features - Plan 02 Summary

**Browser-native offline detection with useOnlineStatus hook and prominent red OfflineBanner component**

## Performance

- **Duration:** 3 min (157 seconds)
- **Started:** 2026-02-09T07:04:52Z
- **Completed:** 2026-02-09T07:07:29Z
- **Tasks:** 4
- **Files modified:** 3 created, 1 modified

## Accomplishments

- Created useOnlineStatus hook using navigator.onLine API with event listeners for real-time network status detection
- Built OfflineBanner component with prominent red warning banner (bg-red-500 light, bg-red-900 dark) that persists while offline
- Established PWA component barrel export pattern for clean imports in future plans
- Integrated OfflineBanner in App.tsx above RouterProvider for visibility on all routes

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useOnlineStatus hook** - `d6b6ae1` (feat)
2. **Task 2: Create OfflineBanner component** - `9b50296` (feat)
3. **Task 3: Create PWA component barrel export** - `52a1c55` (feat)
4. **Task 4: Integrate OfflineBanner in App.tsx** - `f4a05c4` (feat)

## Files Created/Modified

- `web/src/hooks/useOnlineStatus.ts` - Hook for detecting online/offline status using navigator.onLine API
- `web/src/components/pwa/OfflineBanner.tsx` - Fixed red banner component with WifiOff icon and descriptive text
- `web/src/components/pwa/index.ts` - Barrel export for PWA components
- `web/src/App.tsx` - Integrated OfflineBanner above RouterProvider

## useOnlineStatus Implementation Details

```typescript
// Browser-native detection with SSR-safe initialization
const [isOnline, setIsOnline] = useState(
  typeof navigator !== 'undefined' ? navigator.onLine : true
)

// Event listeners for real-time updates
useEffect(() => {
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}, [])
```

**Key features:**
- SSR-safe (checks `typeof navigator !== 'undefined'`)
- Proper cleanup in useEffect return
- Returns boolean for easy conditional rendering

## OfflineBanner Styling Choices

Per CONTEXT.md requirements (离线提示使用明显提示样式):

1. **Prominent visual design:**
   - Fixed position at top of viewport (z-index: 50)
   - Red background: `bg-red-500` (light), `bg-red-900` (dark)
   - White text for high contrast
   - Shadow for depth

2. **Clear messaging:**
   - WifiOff icon from lucide-react (visual indicator)
   - Main text: "您当前处于离线状态"
   - Subtext: "部分功能不可用"
   - No close button (persists while offline)

3. **Responsive layout:**
   - Mobile: Stacked text (flex-col)
   - Desktop: Inline text with bullet separator (flex-row)
   - Full-width banner (left-0 right-0)

## Verification Results

Dev server started successfully at http://localhost:3000

**Manual testing checklist (to be completed by user):**
1. Open browser DevTools Network tab
2. Select "Offline" throttling option
3. Verify red banner appears at top of screen with WifiOff icon
4. Select "Online" throttling option
5. Verify banner disappears
6. Test on mobile viewport - banner should be full width and readable

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed without issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ✅ Offline detection infrastructure ready for read-only UI enhancements (05-03)
- ✅ Banner component can be extended with reconnecting animation when network restoration detected
- ✅ useOnlineStatus hook available for conditional feature disabling in future plans

---
*Phase: 05-pwa-features*
*Completed: 2026-02-09*
