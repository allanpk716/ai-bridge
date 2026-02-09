import { useState, useEffect } from 'react'

/**
 * Hook to detect online/offline status using browser's Navigator.onLine API
 * @returns boolean - true if online, false if offline
 */
export function useOnlineStatus(): boolean {
  // Initialize with navigator.onLine, default to true if navigator is undefined (SSR)
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    // Handle online event
    const handleOnline = () => setIsOnline(true)

    // Handle offline event
    const handleOffline = () => setIsOnline(false)

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
