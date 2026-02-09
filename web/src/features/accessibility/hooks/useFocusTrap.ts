import { useEffect, useRef } from 'react';

/**
 * useFocusTrap Hook
 *
 * Traps keyboard focus within a container element (typically a modal/dialog).
 * This prevents keyboard users from tabbing outside the modal when it's open.
 *
 * Features:
 * - Saves the previously focused element before trap activates
 * - Restores focus to previous element when trap deactivates
 * - Cycles focus within the container (Tab / Shift+Tab)
 * - Automatically finds all focusable elements
 *
 * @param isOpen - Whether the focus trap should be active
 * @param containerId - ID of the container element to trap focus within
 *
 * WCAG 2.1 Success Criterion 2.1.2: No Keyboard Trap
 */
export function useFocusTrap(isOpen: boolean, containerId?: string) {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save the currently focused element before trapping
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Find the trap container
    const container = containerId
      ? document.getElementById(containerId)
      : document.activeElement?.closest('[role="dialog"]');

    if (!container) {
      console.warn('useFocusTrap: No container found for focus trap');
      return;
    }

    // Selector for all focusable elements
    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    // Handle Tab key press to trap focus
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      // Get all focusable elements within the container
      const focusableElements = container.querySelectorAll<HTMLElement>(
        focusableSelector
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Handle Tab and Shift+Tab
      if (e.shiftKey) {
        // Shift+Tab: If on first element, move to last
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: If on last element, move to first
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleTabKey);

    // Focus the first focusable element in the container
    const firstFocusable = container.querySelector<HTMLElement>(
      focusableSelector
    );
    if (firstFocusable) {
      // Small delay to ensure the modal is fully rendered
      setTimeout(() => firstFocusable.focus(), 0);
    }

    // Cleanup: remove listener and restore focus
    return () => {
      document.removeEventListener('keydown', handleTabKey);

      // Restore focus to the element that was focused before the trap
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, containerId]);
}
