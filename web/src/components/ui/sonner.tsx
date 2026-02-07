/**
 * Sonner Toast Component
 *
 * Wrapper around sonner's Toaster component.
 * Renders toast notification container at bottom-right of screen.
 *
 * Features:
 * - Bottom-right positioning (shadcn/ui standard)
 * - Rich colors (success, error, warning, info)
 * - Close button on each toast
 * - Auto-dismiss after timeout
 * - Smooth animations
 *
 * @see https://sonner.emilkowal.ski
 */

import { Toaster as Sonner } from "sonner";

/**
 * Toaster - Global toast notification container
 *
 * Renders once in app root to display all toast notifications.
 * Do not render multiple instances or per-route.
 *
 * @example
 * ```tsx
 * // In main.tsx (app root)
 * <Toaster />
 * ```
 */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        duration: 4000, // 4 seconds default
        classNames: {
          toast: "toast", // Can be customized with Tailwind classes
          description: "toast-description",
          actionButton: "toast-action-button",
          cancelButton: "toast-cancel-button",
        },
      }}
    />
  );
}
