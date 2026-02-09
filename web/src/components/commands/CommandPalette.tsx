/**
 * Command Palette Component
 *
 * Keyboard-accessible command palette using cmdk.
 * Opens with Ctrl+K (or Cmd+K on Mac) for quick command access.
 *
 * Features:
 * - Keyboard shortcut (Ctrl+K/Cmd+K)
 * - Category grouping with headings
 * - Fuzzy search filtering
 * - Keyboard navigation (arrow keys, Enter)
 *
 * @see .planning/phases/04-real-time-chat/04-09-PLAN.md
 */

import { useEffect } from "react";
import { Command } from "cmdk";
import { useCommands } from "@/lib/api/commands";
import type { Command as CommandType } from "@/types/api";

interface CommandPaletteProps {
  /** Controls dialog visibility */
  open: boolean;
  /** Callback when dialog opens/closes */
  onOpenChange: (open: boolean) => void;
  /** Optional session ID for project-specific commands */
  sessionId?: string;
  /** Callback when a command is selected */
  onSelectCommand: (command: CommandType) => void;
}

/**
 * CommandPalette Component
 *
 * Displays available slash commands grouped by category with fuzzy search.
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 * const handleSelect = (command) => {
 *   executeCommand(command);
 *   setOpen(false);
 * };
 * <CommandPalette
 *   open={open}
 *   onOpenChange={setOpen}
 *   sessionId="session-123"
 *   onSelectCommand={handleSelect}
 * />
 * ```
 */
export function CommandPalette({
  open,
  onOpenChange,
  sessionId,
  onSelectCommand,
}: CommandPaletteProps) {
  // Fetch commands grouped by category
  const { data: commands, isLoading, error } = useCommands(sessionId);

  // Keyboard shortcut handler (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+K or Cmd+K (metaKey)
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault(); // Prevent browser default (e.g., search in Chrome)
        onOpenChange(!open);
      }
    };

    // Add event listener
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup on unmount
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  // Handle command selection
  const handleSelect = (commandPath: string) => {
    // Find the command object from the grouped data
    if (!commands) return;

    for (const categoryCommands of Object.values(commands)) {
      const command = categoryCommands.find((cmd) => cmd.path === commandPath);
      if (command) {
        onSelectCommand(command);
        onOpenChange(false); // Close palette after selection
        return;
      }
    }
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command Palette"
      className="cmdk-dialog"
    >
      {/* Overlay backdrop */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" />

      {/* Dialog container */}
      <div className="fixed left-[50%] top-[20%] translate-x-[-50%] z-50 w-full max-w-[600px]">
        <div className="overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-md">
          {/* Search input */}
          <div className="flex items-center border-b px-3">
            <Command.Input
              placeholder="Search commands..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Command list */}
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            {isLoading && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading commands...
              </div>
            )}

            {error && (
              <div className="py-6 text-center text-sm text-destructive">
                Failed to load commands: {error.message}
              </div>
            )}

            {!isLoading && !error && (!commands || Object.keys(commands).length === 0) && (
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                No commands found.
              </Command.Empty>
            )}

            {!isLoading &&
              !error &&
              commands &&
              Object.entries(commands).map(([category, categoryCommands]) => (
                <Command.Group
                  key={category}
                  heading={category}
                  className="mb-2"
                >
                  {/* Category heading */}
                  <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {category}
                  </div>

                  {/* Commands in this category */}
                  {categoryCommands.map((cmd) => (
                    <Command.Item
                      key={cmd.path}
                      value={cmd.path}
                      onSelect={handleSelect}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    >
                      <div className="flex flex-1 items-center justify-between">
                        <div className="flex flex-col">
                          {/* Command path */}
                          <span className="font-medium">{cmd.path}</span>
                          {/* Command description */}
                          {cmd.description && (
                            <span className="text-xs text-muted-foreground">
                              {cmd.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}

            {!isLoading && !error && commands && Object.keys(commands).length > 0 && (
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                No commands found matching your search.
              </Command.Empty>
            )}
          </Command.List>
        </div>
      </div>
    </Command.Dialog>
  );
}
