import { useState, useEffect } from "react";
import { RouterProvider } from "react-router";
import router from "@/router";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ConnectionDialog } from "@/components/connection/ConnectionDialog";
import { OfflineBanner, UpdatePrompt } from "@/components/pwa";
import {
  ShortcutProvider,
  ShortcutHelpModal,
  useShortcuts,
  globalShortcuts,
  type Shortcut,
} from "@/features/keyboard";

/**
 * InnerApp Component
 *
 * Handles shortcut registration after ShortcutProvider is available.
 */
function InnerApp() {
  const { registerShortcut } = useShortcuts();
  const [helpModalOpen, setHelpModalOpen] = useState(false);

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
            setHelpModalOpen(true);
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
      shortcuts.forEach((s) => {
        // Note: ShortcutProvider doesn't have cleanup yet
        // This is fine for global shortcuts
      });
    };
  }, [registerShortcut]);

  return (
    <>
      <OfflineBanner />
      <ConnectionDialog />
      <UpdatePrompt />
      <ShortcutHelpModal
        open={helpModalOpen}
        onOpenChange={setHelpModalOpen}
        shortcuts={globalShortcuts as Shortcut[]}
      />
      <RouterProvider router={router} />
    </>
  );
}

function App() {
  return (
    <ShortcutProvider>
      <ThemeProvider>
        <InnerApp />
      </ThemeProvider>
    </ShortcutProvider>
  );
}

export default App;
