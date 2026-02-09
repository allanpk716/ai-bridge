/**
 * CommandExecutor Component
 *
 * Integrates CommandPalette with chat input for command execution.
 * Provides a trigger button that opens the command palette, and when
 * a command is selected, populates the chat input with the command text.
 *
 * Features:
 * - Customizable trigger button
 * - Command selection with input population
 * - Optional direct execution mode
 * - Integration with CommandPalette for browsing
 *
 * @see .planning/phases/04-real-time-chat/04-11-PLAN.md
 */

import { useState } from "react";
import { Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "./CommandPalette";
import { useExecuteCommand } from "@/lib/api/commands";
import type { Command as CommandType } from "@/types/api";
import { toast } from "sonner";

export interface CommandExecutorProps {
  /**
   * The session ID for command execution
   */
  sessionId: string;

  /**
   * Optional callback when command text is inserted
   * If not provided, commands execute directly
   */
  onCommandInserted?: (commandText: string) => void;

  /**
   * Custom trigger element (button/icon)
   * If not provided, default button with Terminal icon is used
   */
  trigger?: React.ReactNode;

  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * CommandExecutor Component
 *
 * Provides command execution interface with optional input population.
 *
 * @example
 * ```tsx
 * // With input population (default)
 * <CommandExecutor
 *   sessionId="session-123"
 *   onCommandInserted={(text) => setInput(text)}
 * />
 *
 * // With direct execution
 * <CommandExecutor sessionId="session-123" />
 *
 * // With custom trigger
 * <CommandExecutor
 *   sessionId="session-123"
 *   trigger={<CustomTrigger />}
 * />
 * ```
 */
export function CommandExecutor({
  sessionId,
  onCommandInserted,
  trigger,
  className,
}: CommandExecutorProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const executeCommand = useExecuteCommand(sessionId);

  /**
   * Handles command selection from palette
   */
  const handleCommandSelected = (command: CommandType) => {
    // Format command text
    // Use first example if available, otherwise use path
    let commandText = command.path;

    if (command.examples && command.examples.length > 0) {
      // Use first example as template
      commandText = command.examples[0];
    }

    // Check if input population mode or direct execution mode
    if (onCommandInserted) {
      // Populate input mode - let user edit before sending
      onCommandInserted(commandText);
    } else {
      // Direct execution mode - execute immediately
      executeCommand.mutate(
        {
          path: command.path,
          // Parse args from example if available
          args: commandText.split(" ").slice(1),
        },
        {
          onSuccess: () => {
            toast.success(`Command executed: ${command.path}`);
          },
          onError: (error) => {
            toast.error(`Command failed: ${error.message}`);
          },
        }
      );
    }

    // Close palette after selection
    setPaletteOpen(false);
  };

  /**
   * Default trigger button
   */
  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={() => setPaletteOpen(true)}
    >
      <Terminal className="h-4 w-4 mr-2" />
      Commands
      <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );

  return (
    <>
      {/* Trigger button */}
      {trigger ? (
        <div onClick={() => setPaletteOpen(true)} className={className}>
          {trigger}
        </div>
      ) : (
        defaultTrigger
      )}

      {/* Command Palette */}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        sessionId={sessionId}
        onSelectCommand={handleCommandSelected}
      />
    </>
  );
}
