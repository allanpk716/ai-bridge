/**
 * Command Detail Component
 *
 * Displays comprehensive information about a selected command including
 * its path, category badge, description, and usage examples.
 *
 * Features:
 * - Category badge with color coding (builtin/user/project)
 * - Syntax-highlighted examples using CodeBlock
 * - Clean, readable layout
 *
 * @see .planning/phases/04-real-time-chat/04-10-PLAN.md
 */

import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/chat/CodeBlock";
import type { Command as CommandType } from "@/types/api";
import { cn } from "@/lib/utils";

export interface CommandDetailProps {
  /** The command to display */
  command: CommandType;
  /** Optional custom className for styling */
  className?: string;
}

/**
 * Get badge variant based on command category
 *
 * Color coding:
 * - builtin: blue/primary (built-in commands)
 * - user: green/secondary (user-defined commands)
 * - project: orange/accent (project-specific commands)
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
 * CommandDetail Component
 *
 * Shows detailed information about a command including:
 * - Command path (monospace, bold)
 * - Category badge (color-coded)
 * - Description paragraph
 * - Usage examples in code blocks
 *
 * @example
 * ```tsx
 * <CommandDetail command={selectedCommand} />
 * ```
 */
export function CommandDetail({ command, className }: CommandDetailProps) {
  const badgeVariant = getCategoryBadgeVariant(command.category);

  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      {/* Command path and category badge */}
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-bold font-mono">{command.path}</h3>
        <Badge variant={badgeVariant} className="text-xs">
          {command.category}
        </Badge>
      </div>

      {/* Description */}
      {command.description && (
        <p className="text-sm text-muted-foreground">{command.description}</p>
      )}

      {/* Examples section */}
      <div className="flex flex-col space-y-3">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Examples
        </h4>

        {command.examples && command.examples.length > 0 ? (
          <div className="flex flex-col space-y-4">
            {command.examples.map((example, index) => (
              <div key={index} className="flex flex-col space-y-2">
                {/* Example label */}
                <span className="text-xs font-medium text-muted-foreground">
                  Example {index + 1}
                </span>

                {/* Example code block */}
                <CodeBlock code={example} language="bash" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No examples available
          </p>
        )}
      </div>
    </div>
  );
}
