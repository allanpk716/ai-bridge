import { useState, useEffect, createContext, useContext } from "react";
import { RouterProvider } from "react-router";
import router from "@/router";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ConnectionDialog } from "@/components/connection/ConnectionDialog";
import { OfflineBanner, UpdatePrompt } from "@/components/pwa";
import { NetworkStatusError } from "@/components/NetworkStatusError";
import { LiveAnnouncer } from "@/components/accessibility";
import {
  ShortcutProvider,
  ShortcutHelpModal,
  useShortcuts,
  globalShortcuts,
  type Shortcut,
} from "@/features/keyboard";

/**
 * Shortcut UI Context
 *
 * Provides functions to open shortcut-related modals/dialogs.
 */
interface ShortcutUIContextValue {
  openShortcutHelp: () => void;
}

const ShortcutUIContext = createContext<ShortcutUIContextValue | null>(null);

/**
 * Hook to access shortcut UI functions
 */
export function useShortcutUI(): ShortcutUIContextValue {
  const context = useContext(ShortcutUIContext);
  if (!context) {
    throw new Error('useShortcutUI must be used within ShortcutUIProvider');
  }
  return context;
}

/**
 * ShortcutUIProvider Component
 *
 * Provides UI-related shortcut functions (opening modals, etc.)
 */
function ShortcutUIProvider({ children }: { children: React.ReactNode }) {
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  const openShortcutHelp = () => setHelpModalOpen(true);

  return (
    <ShortcutUIContext.Provider value={{ openShortcutHelp }}>
      {children}
      <ShortcutHelpModal
        open={helpModalOpen}
        onOpenChange={setHelpModalOpen}
        shortcuts={globalShortcuts as Shortcut[]}
      />
    </ShortcutUIContext.Provider>
  );
}

/**
 * InnerApp Component
 *
 * Handles shortcut registration after ShortcutProvider is available.
 */
function InnerApp() {
  const { registerShortcut } = useShortcuts();
  const { openShortcutHelp } = useShortcutUI();

  // Register global shortcuts on mount
  useEffect(() => {
    // Register all global shortcuts
    const shortcuts: Shortcut[] = globalShortcuts.map((shortcutTemplate) => ({
      ...shortcutTemplate,
      action: () => {
        // Handle each shortcut
        switch (shortcutTemplate.keyCombo) {
          case 'ctrl+k':
            // Command palette is handled by cmdk itself
            break;
          case 'ctrl+/':
            openShortcutHelp();
            break;
          case 'ctrl+shift+n':
            // TODO: Open create session dialog
            console.log('Create new session');
            break;
          case 'ctrl+enter':
            // This is handled locally in ChatInput
            break;
        }
      },
    }));

    shortcuts.forEach(registerShortcut);

    // Cleanup on unmount
    return () => {
      // Note: ShortcutProvider doesn't have cleanup yet
      // This is fine for global shortcuts
    };
  }, [registerShortcut, openShortcutHelp]);

  return (
    <>
      <LiveAnnouncer />
      <NetworkStatusError />
      <OfflineBanner />
      <ConnectionDialog />
      <UpdatePrompt />
      <RouterProvider router={router} />
    </>
  );
}

function App() {
  return (
    <ShortcutProvider>
      <ThemeProvider>
        <ShortcutUIProvider>
          <InnerApp />
        </ShortcutUIProvider>
      </ThemeProvider>
    </ShortcutProvider>
  );
}

export default App;
