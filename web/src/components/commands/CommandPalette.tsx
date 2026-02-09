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
 * - Detail view with command examples
 *
 * @see .planning/phases/04-real-time-chat/04-09-PLAN.md
 * @see .planning/phases/04-real-time-chat/04-10-PLAN.md
 */

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { ArrowLeft, Check } from "lucide-react";
import { useCommands } from "@/lib/api/commands";
import { CommandDetail } from "./CommandDetail";
import { Button } from "@/components/ui/button";
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

  // Detail view state
  const [selectedCommand, setSelectedCommand] = useState<CommandType | null>(null);

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

  // Find command object by path
  const findCommand = (commandPath: string): CommandType | null => {
    if (!commands) return null;

    for (const categoryCommands of Object.values(commands)) {
      const command = categoryCommands.find((cmd) => cmd.path === commandPath);
      if (command) {
        // Add category to command object
        return { ...command, category: Object.keys(commands).find(key => commands[key].includes(command)) || command.category };
      }
    }
    return null;
  };

  // Handle command selection from list (show detail first)
  const handleSelectItem = (commandPath: string) => {
    const command = findCommand(commandPath);
    if (command) {
      setSelectedCommand(command);
    }
  };

  // Handle confirm from detail view (execute command)
  const handleConfirm = () => {
    if (selectedCommand) {
      onSelectCommand(selectedCommand);
      setSelectedCommand(null);
      onOpenChange(false);
    }
  };

  // Handle back button (return to list)
  const handleBack = () => {
    setSelectedCommand(null);
  };

  // Reset detail view when palette closes
  useEffect(() => {
    if (!open) {
      setSelectedCommand(null);
    }
  }, [open]);

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
          {/* Header with back button (in detail mode) */}
          {selectedCommand && (
            <div className="flex items-center border-b px-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <span className="text-sm font-medium text-muted-foreground">
                Command Details
              </span>
            </div>
          )}

          {/* Search input (only in list mode) */}
          {!selectedCommand && (
            <div className="flex items-center border-b px-3">
              <Command.Input
                placeholder="Search commands..."
                className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          )}

          {/* Content: List or Detail */}
          {selectedCommand ? (
            // Detail view
            <div className="max-h-[500px] overflow-y-auto p-6">
              <CommandDetail command={selectedCommand} />

              {/* Action buttons */}
              <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={handleBack}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  onClick={handleConfirm}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Execute Command
                </Button>
              </div>
            </div>
          ) : (
            // List view
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
                      onSelect={handleSelectItem}
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
          )}
        </div>
      </div>
    </Command.Dialog>
  );
}
