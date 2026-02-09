import { useEffect, useState, useCallback } from 'react';

/**
 * LiveAnnouncer Component
 *
 * Provides an aria-live region for announcing important state changes
 * to screen reader users.
 *
 * Features:
 * - Polite announcements (won't interrupt current speech)
 * - Auto-clears after announcement (1 second delay)
 * - Listens for custom 'announce' events
 * - Provides helper hook for programmatic announcements
 *
 * Usage:
 * ```tsx
 * // In App.tsx
 * <LiveAnnouncer />
 *
 * // Announce from anywhere
 * window.dispatchEvent(new CustomEvent('announce', {
 *   detail: { message: '消息已发送' }
 * }));
 * ```
 *
 * WCAG 2.1 Success Criterion 4.1.3: Status Messages
 */
export function LiveAnnouncer() {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    /**
     * Handle announcement events
     */
    const handleAnnouncement = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string }>;
      const message = customEvent.detail.message;

      if (message) {
        setAnnouncement(message);

        // Clear announcement after 1 second to allow re-announcement
        setTimeout(() => {
          setAnnouncement('');
        }, 1000);
      }
    };

    // Listen for custom announce events
    window.addEventListener('announce', handleAnnouncement as EventListener);

    return () => {
      window.removeEventListener('announce', handleAnnouncement as EventListener);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      aria-label="状态公告"
    >
      {announcement}
    </div>
  );
}

/**
 * useAnnouncer Hook
 *
 * Provides a convenient function to announce messages to screen readers.
 *
 * @example
 * ```tsx
 * const announce = useAnnouncer();
 *
 * function sendMessage() {
 *   // ... send logic
 *   announce('消息已发送');
 * }
 * ```
 */
export function useAnnouncer() {
  return useCallback((message: string) => {
    window.dispatchEvent(
      new CustomEvent('announce', {
        detail: { message },
      })
    );
  }, []);
}
