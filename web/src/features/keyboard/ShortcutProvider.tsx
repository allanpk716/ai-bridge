/**
 * ShortcutProvider Component
 *
 * Context provider for global keyboard shortcuts management.
 * Allows components to register/unregister shortcuts dynamically.
 *
 * @see .planning/phases/06-polish-advanced-features/06-03-PLAN.md
 */

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { Shortcut } from './shortcuts';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';

interface ShortcutContextValue {
  /** Register a new shortcut */
  registerShortcut: (shortcut: Shortcut) => void;
  /** Unregister a shortcut by keyCombo */
  unregisterShortcut: (keyCombo: string) => void;
  /** Get all registered shortcuts */
  getShortcuts: () => Shortcut[];
}

const ShortcutContext = createContext<ShortcutContextValue | null>(null);

/**
 * ShortcutProvider Props
 */
interface ShortcutProviderProps {
  children: ReactNode;
}

/**
 * ShortcutProvider Component
 *
 * Provides keyboard shortcut registration context to the app.
 *
 * @example
 * ```tsx
 * <ShortcutProvider>
 *   <App />
 * </ShortcutProvider>
 * ```
 *
 * Registering shortcuts in components:
 * ```tsx
 * const { registerShortcut } = useShortcuts();
 *
 * useEffect(() => {
 *   registerShortcut({
 *     keyCombo: 'ctrl+k',
 *     name: 'Open palette',
 *     description: 'Open command palette',
 *     scope: 'global',
 *     action: () => setOpen(true),
 *   });
 * }, []);
 * ```
 */
export function ShortcutProvider({ children }: ShortcutProviderProps) {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);

  /**
   * Register a new shortcut
   */
  const registerShortcut = useCallback((shortcut: Shortcut) => {
    setShortcuts(prev => {
      // Remove existing shortcut with same keyCombo
      const filtered = prev.filter(s => s.keyCombo !== shortcut.keyCombo);
      return [...filtered, shortcut];
    });
  }, []);

  /**
   * Unregister a shortcut by keyCombo
   */
  const unregisterShortcut = useCallback((keyCombo: string) => {
    setShortcuts(prev => prev.filter(s => s.keyCombo !== keyCombo));
  }, []);

  /**
   * Get all registered shortcuts
   */
  const getShortcuts = useCallback(() => {
    return shortcuts;
  }, [shortcuts]);

  // Register all shortcuts globally
  useGlobalShortcuts(shortcuts);

  const contextValue = useMemo<ShortcutContextValue>(
    () => ({
      registerShortcut,
      unregisterShortcut,
      getShortcuts,
    }),
    [registerShortcut, unregisterShortcut, getShortcuts]
  );

  return (
    <ShortcutContext.Provider value={contextValue}>
      {children}
    </ShortcutContext.Provider>
  );
}

/**
 * useShortcuts Hook
 *
 * Access shortcut registration context.
 *
 * @throws Error if used outside ShortcutProvider
 *
 * @example
 * ```tsx
 * const { registerShortcut, unregisterShortcut } = useShortcuts();
 *
 * useEffect(() => {
 *   const shortcut = {
 *     keyCombo: 'ctrl+s',
 *     name: 'Save',
 *     description: 'Save current work',
 *     scope: 'global',
 *     action: () => save(),
 *   };
 *
 *   registerShortcut(shortcut);
 *
 *   return () => unregisterShortcut('ctrl+s');
 * }, [registerShortcut, unregisterShortcut]);
 * ```
 */
export function useShortcuts(): ShortcutContextValue {
  const context = useContext(ShortcutContext);
  if (!context) {
    throw new Error('useShortcuts must be used within ShortcutProvider');
  }
  return context;
}
