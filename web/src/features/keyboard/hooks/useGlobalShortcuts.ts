/**
 * useGlobalShortcuts Hook
 *
 * Registers keyboard event listeners for global shortcuts.
 * Handles scope (global vs local) to prevent conflicts with input fields.
 *
 * @see .planning/phases/06-polish-advanced-features/06-03-PLAN.md
 */

import { useEffect } from 'react';
import type { Shortcut } from '../shortcuts';

/**
 * Global keyboard shortcuts hook
 *
 * Attaches keyboard event listener to document and executes matching shortcuts.
 *
 * Scope behavior:
 * - 'global': Works everywhere except in input fields (INPUT, TEXTAREA, contenteditable)
 * - 'local': Only works in input fields
 *
 * @param shortcuts - Array of shortcuts to register
 *
 * @example
 * ```tsx
 * const shortcuts: Shortcut[] = [
 *   {
 *     keyCombo: 'ctrl+k',
 *     name: 'Open command palette',
 *     description: 'Quick access to commands',
 *     scope: 'global',
 *     action: () => setOpen(true),
 *   }
 * ];
 *
 * useGlobalShortcuts(shortcuts);
 * ```
 */
export function useGlobalShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    /**
     * Handle keydown events
     */
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if currently focused element is an input
      const activeElement = document.activeElement;
      const isInput =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.getAttribute('contenteditable') === 'true';

      // Find matching shortcut
      for (const shortcut of shortcuts) {
        // Skip local shortcuts when not in input
        if (shortcut.scope === 'local' && !isInput) continue;

        // Skip global shortcuts when in input (prevents conflicts)
        if (shortcut.scope === 'global' && isInput) continue;

        // Parse key combo
        const keys = shortcut.keyCombo.split('+');
        const ctrlKey = keys.includes('ctrl');
        const shiftKey = keys.includes('shift');
        const altKey = keys.includes('alt');
        const metaKey = keys.includes('meta');
        const key = keys[keys.length - 1].toLowerCase();

        // Check if event matches shortcut
        if (
          event.ctrlKey === ctrlKey &&
          event.shiftKey === shiftKey &&
          event.altKey === altKey &&
          event.metaKey === metaKey &&
          event.key.toLowerCase() === key
        ) {
          event.preventDefault();
          shortcut.action();
          break; // Stop after first match (no duplicate key combos)
        }
      }
    };

    // Attach event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}
