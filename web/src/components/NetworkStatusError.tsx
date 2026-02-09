/**
 * NetworkStatusError Component
 *
 * Displays a persistent error notification when network is offline.
 * Shows toast notification with retry button.
 */

import { useEffect } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { WifiOff } from "lucide-react";
import { toast } from "sonner";

/**
 * NetworkStatusError - Shows error when offline
 *
 * Displays a toast notification when network goes offline,
 * and automatically dismisses it when back online.
 *
 * @example
 * ```tsx
 * <NetworkStatusError />
 * ```
 */
export function NetworkStatusError() {
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (!isOnline) {
      // Show offline toast with retry button
      toast.error("网络连接已断开", {
        duration: Infinity, // Persistent until online
        id: "offline", // Single toast, replace if exists
        icon: <WifiOff className="h-4 w-4" />,
        action: {
          label: "重试",
          onClick: () => window.location.reload(),
        },
      });
    } else {
      // Dismiss offline toast when back online
      toast.dismiss("offline");
    }
  }, [isOnline]);

  // Don't render anything - toast notification is sufficient
  return null;
}

/**
 * NetworkStatusBanner - Shows banner when offline
 *
 * Alternative to toast notification - displays a banner at the bottom
 * of the screen when offline.
 *
 * @example
 * ```tsx
 * <NetworkStatusBanner />
 * ```
 */
export function NetworkStatusBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-destructive text-destructive-foreground px-4 py-3 rounded shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom">
      <WifiOff className="h-4 w-4" />
      <span className="font-medium">网络连接已断开</span>
      <button
        onClick={() => window.location.reload()}
        className="ml-2 underline hover:no-underline"
      >
        重试
      </button>
    </div>
  );
}
