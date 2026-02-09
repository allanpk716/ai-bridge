import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { WifiOff } from 'lucide-react'

/**
 * OfflineBanner - Displays a prominent warning banner when offline
 *
 * - Fixed at top of viewport (z-index: 50)
 * - Red background with white text for high visibility
 * - Shows WifiOff icon with descriptive text
 * - Persists while offline (no close button)
 * - Returns null when online
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  // Don't render anything when online
  if (isOnline) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 dark:bg-red-900 text-white px-4 py-3 flex items-center justify-center gap-3 shadow-lg">
      <WifiOff className="h-5 w-5 flex-shrink-0" />
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
        <span className="font-medium">您当前处于离线状态</span>
        <span className="text-sm opacity-90 hidden sm:inline">•</span>
        <span className="text-sm opacity-90">部分功能不可用</span>
      </div>
    </div>
  )
}
