import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * UpdatePrompt - Service Worker update prompt dialog
 *
 * Displays a modal dialog when a new version of the application is available.
 * The user must click "立即更新" to reload and apply the update.
 *
 * Features:
 * - Uses useRegisterSW hook for Service Worker lifecycle management
 * - Modal dialog (non-dismissible except by updating)
 * - Single "立即更新" button (no "later" or "dismiss" options)
 * - Clear Chinese messaging explaining why update is needed
 *
 * Based on CONTEXT.md decision:
 * - Modal dialog (not inline notification)
 * - Single update button
 * - Simple, clear messaging
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swScriptUrl, registration) {
      console.log('SW registered:', swScriptUrl, registration)

      // Optional: Configure periodic update checks (e.g., every hour)
      if (registration && import.meta.env.PROD) {
        // Check for updates every hour in production
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000)
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error)
    },
  })

  const close = () => {
    setNeedRefresh(false)
  }

  // Only show dialog when refresh is needed
  if (!needRefresh) {
    return null
  }

  return (
    <Dialog open={needRefresh} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新版本可用</DialogTitle>
          <DialogDescription>
            应用已更新,请刷新以获取最新版本。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => updateServiceWorker(true)}>
            立即更新
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
