/**
 * PermissionCard Component
 *
 * Embedded permission request card that appears in the message stream
 * when Claude Code requires user approval. Non-blocking design allows users
 * to scroll past and review at their own pace.
 *
 * Features:
 * - Compact display of operation type and resources
 * - Collapsible command content details
 * - Approve/deny buttons with scope selection
 * - Status badges for approved/denied permissions
 * - Warning color scheme to draw attention
 *
 * @see .planning/phases/04-real-time-chat/04-CONTEXT.md > Permission Request Interaction
 */

import { useState } from "react";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clsx } from "clsx";
import type { Permission } from "@/types/api";

export interface PermissionCardProps {
  /** Permission request details */
  permission: Permission;
  /** Callback when user approves with selected scope */
  onApprove: (scope: string) => void;
  /** Callback when user denies permission */
  onDeny: () => void;
  /** Whether a mutation is in progress */
  isLoading?: boolean;
  /** Optional status for historical permissions */
  status?: "pending" | "approved" | "denied";
}

/**
 * Embedded permission request card component
 *
 * Renders permission requests in the message stream with approve/deny actions.
 * Non-blocking design allows users to scroll past.
 */
export function PermissionCard({
  permission,
  onApprove,
  onDeny,
  isLoading = false,
  status = "pending",
}: PermissionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Scope options for approval
  const scopeOptions = [
    { value: "file-read", label: "File Read" },
    { value: "file-write", label: "File Write" },
    { value: "command-exec", label: "Command Execution" },
    { value: "network", label: "Network Access" },
  ];

  const currentScope = scopeOptions.find((s) => s.value === permission.scope)?.label || permission.scope;

  // Determine if actions should be shown
  const showActions = status === "pending";

  // Status badge configuration
  const statusBadge = {
    pending: { variant: "default" as const, label: "Permission Required", className: "bg-yellow-500 text-white" },
    approved: { variant: "default" as const, label: "Approved", className: "bg-green-500 text-white" },
    denied: { variant: "destructive" as const, label: "Denied", className: "" },
  }[status];

  return (
    <div className="my-4 mx-2 max-w-2xl">
      <Card className={clsx(
        "border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20",
        "shadow-sm"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={statusBadge.className}>
                {statusBadge.label}
              </Badge>
              <CardTitle className="text-sm font-semibold">
                {permission.operation}
              </CardTitle>
            </div>
            {showActions && (
              <span className="text-xs text-muted-foreground">
                {currentScope}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Resources list */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Resources ({permission.resources.length})
            </p>
            <ul className="max-h-40 overflow-y-auto space-y-1">
              {permission.resources.map((resource, index) => (
                <li
                  key={index}
                  className="text-xs font-mono bg-background/50 rounded px-2 py-1 truncate"
                  title={resource}
                >
                  {resource}
                </li>
              ))}
            </ul>
          </div>

          {/* Command content (collapsible) */}
          {permission.operation && (
            <div>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                Show details
              </button>

              {isExpanded && (
                <div className="mt-2 p-2 bg-background/50 rounded text-xs font-mono">
                  <p className="break-words">{permission.operation}</p>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          {showActions && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={onDeny}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                Deny
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => onApprove(permission.scope)}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                Approve
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
