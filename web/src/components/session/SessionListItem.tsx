import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { type Session } from "@/types/api";
import {
  Circle,
  Clock,
  Loader,
  MessageSquare,
  Trash,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionListItemProps {
  session: Session;
  onClick: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

/**
 * SessionListItem component
 *
 * Displays a single session in the list with:
 * - Session name/ID
 * - Working directory path
 * - Status badge with icon
 * - Metadata (message count, last activity time)
 * - Model badge
 * - Git branch (if present)
 * - Delete button (on hover, desktop only)
 */
export function SessionListItem({
  session,
  onClick,
  onDelete,
  isDeleting = false,
}: SessionListItemProps) => {
  const { id, status, metadata = {} } = session;

  // Extract metadata with defaults
  const sessionName = (metadata.name as string | undefined) || id;
  const workingDir = (metadata.workingDir as string | undefined) || "";
  const model = (metadata.model as string | undefined) || "Default";
  const gitBranch = metadata.gitBranch as string | undefined;
  const messageCount = (metadata.messageCount as number | undefined) || 0;
  const lastActivity = metadata.lastActivity as string | undefined;
  const createdAt = metadata.createdAt as string | undefined;

  // Get folder name from working directory for display
  const folderName = workingDir
    ? workingDir.split(/[/\\]/).filter(Boolean).pop() || workingDir
    : "No directory";

  // Format time (relative if < 24h, absolute otherwise)
  const formatTime = (timeStr?: string): string => {
    if (!timeStr) return "";

    try {
      const date = new Date(timeStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? "just now" : `${diffMins}m ago`;
      } else if (diffHours < 24) {
        return `${Math.floor(diffHours)}h ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return "";
    }
  };

  // Get status badge config
  const getStatusConfig = () => {
    switch (status) {
      case "idle":
        return {
          variant: "default" as const,
          icon: Circle,
          text: "Idle",
        };
      case "processing":
        return {
          variant: "secondary" as const,
          icon: Loader,
          text: "Processing",
        };
      case "waiting":
        return {
          variant: "outline" as const,
          icon: Clock,
          text: "Waiting",
        };
      case "stopped":
        return {
          variant: "destructive" as const,
          icon: X,
          text: "Stopped",
        };
      default:
        return {
          variant: "default" as const,
          icon: Circle,
          text: "Unknown",
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  const timeDisplay = formatTime(lastActivity || createdAt);

  return (
    <TooltipProvider>
      <div
        className={cn(
          "group relative flex items-center gap-3 rounded-lg border bg-card p-4 transition-all hover:bg-accent/50 cursor-pointer",
          "md:hover:shadow-sm",
          isDeleting && "opacity-50 pointer-events-none"
        )}
        onClick={isDeleting ? undefined : onClick}
      >
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Session name and status */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{sessionName}</h3>
            <Badge variant={statusConfig.variant} className="gap-1 shrink-0">
              <StatusIcon
                className={cn(
                  "h-3 w-3",
                  status === "processing" && "animate-spin"
                )}
              />
              {statusConfig.text}
            </Badge>
          </div>

          {/* Working directory */}
          <div
            className="text-sm text-muted-foreground truncate"
            title={workingDir || undefined}
          >
            {folderName}
          </div>

          {/* Metadata row */}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {/* Message count */}
            {messageCount > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{messageCount}</span>
              </div>
            )}

            {/* Last activity time */}
            {timeDisplay && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{timeDisplay}</span>
              </div>
            )}

            {/* Model badge */}
            <Badge variant="outline" className="text-xs">
              {model}
            </Badge>

            {/* Git branch */}
            {gitBranch && (
              <span className="text-muted-foreground">
                {gitBranch}
              </span>
            )}
          </div>
        </div>

        {/* Delete button - show on hover (desktop) */}
        {onDelete && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
            {isDeleting ? (
              <Button
                variant="ghost"
                size="icon"
                disabled
                className="shrink-0"
              >
                <Loader className="h-4 w-4 animate-spin" />
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete session</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
