import {
  Badge,
  type BadgeProps,
} from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type Session } from "@/types/api";
import {
  Folder,
  GitBranch,
  MessageSquare,
  Calendar,
  Cpu,
  Circle,
  Loader,
  Clock,
  X,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface SessionMetadataProps {
  session: Session;
}

/**
 * Status badge component with icon and variant mapping
 */
function StatusBadge({ status }: { status: Session["status"] }) {
  const variants: Record<Session["status"], BadgeProps["variant"]> = {
    idle: "default",
    processing: "secondary",
    waiting: "outline",
    stopped: "destructive",
  };

  const icons: Record<Session["status"], React.ReactNode> = {
    idle: <Circle className="h-3 w-3" />,
    processing: <Loader className="h-3 w-3 animate-spin" />,
    waiting: <Clock className="h-3 w-3" />,
    stopped: <X className="h-3 w-3" />,
  };

  const variant = variants[status];
  const icon = icons[status];

  return (
    <Badge variant={variant} className="gap-1.5">
      {icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

/**
 * Format date as relative if within 24 hours, otherwise absolute
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  return format(date, "PPpp");
}

/**
 * Extract folder name from path
 */
function getFolderName(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || path;
}

/**
 * SessionMetadata component
 *
 * Displays session metadata in a card-based grid layout:
 * - Status with badge variant and icon
 * - Working directory with folder icon
 * - Model with CPU icon
 * - Git branch (if available)
 * - Message count (if available)
 * - Created date with relative/absolute formatting
 */
export function SessionMetadata({ session }: SessionMetadataProps) {
  const { status, metadata, createdAt } = session;
  const workingDir = (metadata?.workingDir as string) || "Unknown";
  const model = (metadata?.model as string) || "Default";
  const gitBranch = metadata?.gitBranch as string | undefined;
  const messageCount = metadata?.messageCount as number | undefined;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StatusBadge status={status} />
        </CardContent>
      </Card>

      {/* Working Directory */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Working Directory
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate" title={workingDir}>
              {getFolderName(workingDir)}
            </p>
            <p className="text-xs text-muted-foreground truncate" title={workingDir}>
              {workingDir}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Model */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Model
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Badge variant="outline">{model}</Badge>
        </CardContent>
      </Card>

      {/* Git Branch */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Git Branch
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          {gitBranch ? (
            <Badge variant="outline" className="font-mono text-xs">
              {gitBranch}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">
              Not a git repository
            </span>
          )}
        </CardContent>
      </Card>

      {/* Message Count */}
      {messageCount !== undefined && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium">{messageCount}</span>
          </CardContent>
        </Card>
      )}

      {/* Created At */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Created
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm">{formatDate(createdAt)}</span>
        </CardContent>
      </Card>
    </div>
  );
}
