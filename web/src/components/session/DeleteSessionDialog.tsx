import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2, MessageSquare, FolderOpen } from "lucide-react";
import { type Session } from "@/types/api";
import { cn } from "@/lib/utils";

interface DeleteSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session;
  isDeleting: boolean;
  onConfirm: () => void;
}

/**
 * DeleteSessionDialog component
 *
 * Confirmation dialog for deleting a session with:
 * - Session details (name, working directory, message count)
 * - Warning about running sessions
 * - Full-screen loading overlay during deletion
 * - Destructive action styling
 *
 * Per CONTEXT.md requirement: Shows full-screen loading overlay during deletion
 */
export function DeleteSessionDialog({
  open,
  onOpenChange,
  session,
  isDeleting,
  onConfirm,
}: DeleteSessionDialogProps) {
  const { id, status, metadata = {} } = session;

  // Extract metadata with defaults
  const sessionName = (metadata.name as string | undefined) || id;
  const workingDir = (metadata.workingDir as string | undefined) || "";
  const messageCount = (metadata.messageCount as number | undefined) || 0;

  // Get folder name from working directory for display
  const folderName = workingDir
    ? workingDir.split(/[/\\]/).filter(Boolean).pop() || workingDir
    : "No directory";

  // Check if session is currently running
  const isRunning = status === "processing" || status === "waiting";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Delete Session?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              session.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Session details */}
            <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
              {/* Session name */}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Session</div>
                <div className="font-semibold">{sessionName}</div>
              </div>

              {/* Working directory */}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Working Directory</div>
                <div
                  className="flex items-center gap-2 text-sm"
                  title={workingDir || undefined}
                >
                  <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{folderName}</span>
                </div>
              </div>

              {/* Message count */}
              {messageCount > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Messages</div>
                  <div className="flex items-center gap-2 text-sm">
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{messageCount} messages</span>
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Status</div>
                <Badge variant={status === "stopped" ? "destructive" : "default"}>
                  {status}
                </Badge>
              </div>
            </div>

            {/* Warning for running sessions */}
            {isRunning && (
              <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950/30">
                <AlertCircle className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <span className="font-semibold">Warning:</span> This session is
                  currently running. It will be stopped before deletion.
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full-screen loading overlay - CRITICAL per CONTEXT.md */}
      {isDeleting && (
        <div
          className={cn(
            "fixed inset-0 z-[100] flex items-center justify-center",
            "bg-black/50 backdrop-blur-sm"
          )}
          aria-hidden="true"
        >
          <div className="flex flex-col items-center gap-4 rounded-lg bg-card p-8 shadow-xl">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-lg font-semibold">Deleting session...</div>
            <div className="text-sm text-muted-foreground">
              Please wait while we delete this session
            </div>
          </div>
        </div>
      )}
    </>
  );
}
