/**
 * Connection Failure Dialog Component
 *
 * Modal dialog shown when backend connection fails.
 * Provides user with options to retry or dismiss the error.
 *
 * Behavior:
 * - Automatically opens when connection status === 'error'
 * - Shows error message: "Unable to connect to backend server"
 * - "Retry" button: Attempts to reconnect via connectSocket()
 * - "Dismiss" button: Closes dialog (user can manually retry later)
 *
 * Design decision (from CONTEXT.md):
 * - Does NOT auto-retry (user has control)
 * - Modal is global (shown regardless of current route)
 * - Uses shadcn/ui Dialog component with proper ARIA attributes
 */

import { useState, useEffect } from 'react';
import { useConnectionStore } from '@/lib/stores/connection';
import { connectSocket } from '@/lib/socket/socket';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * Connection failure dialog component
 *
 * Subscribes to connection status and shows modal when status === 'error'.
 * Dialog is app-global (not tied to any route).
 *
 * @example
 * <ConnectionDialog /> // Render in App.tsx inside ThemeProvider
 */
export function ConnectionDialog() {
  const status = useConnectionStore((state) => state.status);
  const [open, setOpen] = useState(false);

  // Auto-open dialog when connection fails
  useEffect(() => {
    setOpen(status === 'error');
  }, [status]);

  /**
   * Handle retry button click
   * Attempts to reconnect and closes dialog
   */
  const handleRetry = () => {
    connectSocket();
    setOpen(false);
  };

  /**
   * Handle dismiss button click
   * Closes dialog without retrying (user can manually retry later)
   */
  const handleDismiss = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connection Failed</DialogTitle>
          <DialogDescription>
            Unable to connect to backend server. Please check your network connection and try again.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleDismiss}>
            Dismiss
          </Button>
          <Button onClick={handleRetry}>
            Retry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
