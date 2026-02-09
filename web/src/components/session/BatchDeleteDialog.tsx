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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  Loader2,
  Check,
  X,
  TriangleAlert,
} from "lucide-react";
import { type Session } from "@/types/api";
import { cn } from "@/lib/utils";

interface BatchDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: Session[];
  isDeleting: boolean;
  failedDeletions: string[];
  onConfirm: () => void;
}

/**
 * BatchDeleteDialog component
 *
 * Confirmation dialog for batch deleting sessions with:
 * - List of all sessions to be deleted
 * - Warning for running sessions
 * - Failure report for partial failures
 * - Two-step confirmation (button then dialog)
 *
 * Per CONTEXT.md requirement: Shows detailed list and handles partial failures
 */
export function BatchDeleteDialog({
  open,
  onOpenChange,
  sessions,
  isDeleting,
  failedDeletions,
  onConfirm,
}: BatchDeleteDialogProps) {
  const sessionCount = sessions.length;
  const hasFailures = failedDeletions.length > 0;
  const successCount = sessionCount - failedDeletions.length;

  // Check if any sessions are running
  const runningSessions = sessions.filter(
    (s) => s.status === "processing" || s.status === "waiting"
  );

  const getFailureDetails = () => {
    if (!hasFailures) return null;

    const failedSessions = sessions.filter((s) =>
      failedDeletions.includes(s.id)
    );

    return (
      <div className="rounded-lg bg-destructive/10 p-4 border border-destructive/20">
        <div className="flex items-center gap-2 mb-2">
          <TriangleAlert className="h-4 w-4 text-destructive" />
          <span className="font-medium text-destructive">
            Partial Failure ({successCount} succeeded, {failedDeletions.length}{" "}
            failed)
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          The following sessions could not be deleted:
        </p>
        <ul className="space-y-1">
          {failedSessions.map((session) => {
            const sessionName =
              (session.metadata?.name as string | undefined) || session.id;
            return (
              <li
                key={session.id}
                className="text-sm text-muted-foreground flex items-center gap-2"
              >
                <X className="h-3 w-3 text-destructive" />
                <span>{sessionName}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Delete {sessionCount} Session{sessionCount > 1 ? "s" : ""}?
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. All selected sessions will be permanently
            deleted.
          </DialogDescription>
        </DialogHeader>

        {/* Session List */}
        <ScrollArea className="max-h-64 pr-4">
          <div className="space-y-2">
            {sessions.map((session) => {
              const { id, status, metadata = {} } = session;
              const sessionName =
                (metadata.name as string | undefined) || id;
              const isRunning = status === "processing" || status === "waiting";

              return (
                <div
                  key={id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {isRunning && (
                      <TriangleAlert className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {sessionName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {(metadata.workingDir as string | undefined) ||
                          "No working directory"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{status}</Badge>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Warning for running sessions */}
        {runningSessions.length > 0 && (
          <div className="rounded-lg bg-amber-500/10 p-3 border border-amber-500/20">
            <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <TriangleAlert className="h-4 w-4" />
              <span>
                {runningSessions.length} session
                {runningSessions.length > 1 ? "s are" : " is"} currently running
                and will be stopped before deletion.
              </span>
            </p>
          </div>
        )}

        {/* Failure Report */}
        {hasFailures && getFailureDetails()}

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
            disabled={isDeleting || sessions.length === 0}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                Delete {sessionCount} Session{sessionCount > 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
