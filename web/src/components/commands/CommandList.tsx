/**
 * Command List Component
 *
 * Browsable list of all available commands with category badges.
 * Provides an alternative to the command palette for visual command browsing.
 *
 * Features:
 * - Flattened list from grouped commands
 * - Category badges with color coding
 * - Search/filter functionality
 * - Click selection with callback
 *
 * @see .planning/phases/04-real-time-chat/04-10-PLAN.md
 */

import { useState, useMemo } from "react";
import { Loader2, Search } from "lucide-react";
import { useCommands } from "@/lib/api/commands";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Command as CommandType } from "@/types/api";
import { cn } from "@/lib/utils";

export interface CommandListProps {
  /** Optional session ID for project-specific commands */
  sessionId?: string;
  /** Callback when a command is selected */
  onSelectCommand?: (command: CommandType) => void;
  /** Optional custom className for styling */
  className?: string;
}

/**
 * Get badge variant based on command category
 */
function getCategoryBadgeVariant(category: string): "default" | "secondary" | "outline" {
  switch (category.toLowerCase()) {
    case "builtin":
      return "default"; // Blue
    case "user":
      return "secondary"; // Green
    case "project":
      return "outline"; // Orange/outline
    default:
      return "outline";
  }
}

/**
 * Truncate text to max length with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * CommandList Component
 *
 * Displays a browsable list of all commands with:
 * - Search input for filtering
 * - Category badges (color-coded)
 * - Command descriptions
 * - Click selection
 *
 * @example
 * ```tsx
 * <CommandList
 *   sessionId="session-123"
 *   onSelectCommand={(cmd) => console.log(cmd)}
 * />
 * ```
 */
export function CommandList({
  sessionId,
  onSelectCommand,
  className,
}: CommandListProps) {
  const { data: commands, isLoading, error } = useCommands(sessionId);
  const [searchQuery, setSearchQuery] = useState("");

  // Flatten grouped commands into single list
  const flattenedCommands = useMemo(() => {
    if (!commands) return [];

    return Object.entries(commands).flatMap(([category, categoryCommands]) =>
      categoryCommands.map((cmd) => ({
        ...cmd,
        category, // Ensure category is set on each command
      }))
    );
  }, [commands]);

  // Filter commands based on search query
  const filteredCommands = useMemo(() => {
    if (!searchQuery) return flattenedCommands;

    const query = searchQuery.toLowerCase();
    return flattenedCommands.filter(
      (cmd) =>
        cmd.path.toLowerCase().includes(query) ||
        cmd.description.toLowerCase().includes(query)
    );
  }, [flattenedCommands, searchQuery]);

  const handleCommandClick = (command: CommandType) => {
    if (onSelectCommand) {
      onSelectCommand(command);
    }
  };

  return (
    <div className={cn("flex flex-col space-y-3", className)}>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search commands..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Command list */}
      <div className="max-h-[400px] overflow-y-auto rounded-lg border bg-card">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading commands...
            </span>
          </div>
        )}

        {error && (
          <div className="py-6 text-center text-sm text-destructive">
            Failed to load commands: {error.message}
          </div>
        )}

        {!isLoading && !error && flattenedCommands.length === 0 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No commands available
          </div>
        )}

        {!isLoading && !error && flattenedCommands.length > 0 && (
          <>
            {filteredCommands.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No commands found matching "{searchQuery}"
              </div>
            ) : (
              <div className="flex flex-col">
                {filteredCommands.map((command) => {
                  const badgeVariant = getCategoryBadgeVariant(command.category);

                  return (
                    <div
                      key={command.path}
                      onClick={() => handleCommandClick(command)}
                      className={cn(
                        "flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0",
                        "cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground",
                        onSelectCommand && "cursor-pointer"
                      )}
                    >
                      <div className="flex flex-1 flex-col">
                        {/* Command path */}
                        <span className="font-mono font-medium text-sm">
                          {command.path}
                        </span>

                        {/* Command description (truncated) */}
                        {command.description && (
                          <span className="text-xs text-muted-foreground">
                            {truncateText(command.description, 80)}
                          </span>
                        )}
                      </div>

                      {/* Category badge */}
                      <Badge variant={badgeVariant} className="ml-3 text-xs">
                        {command.category}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
