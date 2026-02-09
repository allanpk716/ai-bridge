import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Play, Square, Trash, MoreVertical, Loader2 } from "lucide-react";
import { type Session } from "@/types/api";
import { cn } from "@/lib/utils";

interface SessionHeaderProps {
  session: Session;
  onResume: () => void;
  onStop: () => void;
  onDelete: () => void;
  isResuming: boolean;
  isStopping: boolean;
  isDeleting: boolean;
  onBack: () => void;
}

/**
 * SessionHeader component
 *
 * Header for session detail page with:
 * - Back button (navigates to session list)
 * - Session name and ID
 * - Context-aware action buttons (Resume/Stop/Delete)
 * - Loading states for all actions
 *
 * Per CONTEXT.md requirement: Shows different actions based on session status
 */
export function SessionHeader({
  session,
  onResume,
  onStop,
  onDelete,
  isResuming,
  isStopping,
  isDeleting,
  onBack,
}: SessionHeaderProps) {
  const { id, status, metadata = {} } = session;
  const sessionName = (metadata.name as string | undefined) || id;

  // Determine which action button to show based on status
  const isStopped = status === "stopped";
  const isRunning = status === "processing" || status === "waiting";

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between mb-6">
        {/* Left side - Back button and Session info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Back button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Back to sessions</p>
            </TooltipContent>
          </Tooltip>

          {/* Session info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold truncate">{sessionName}</h1>
            <p className="text-sm text-muted-foreground truncate">
              ID: {id}
            </p>
          </div>
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-2">
          {/* Resume button (for stopped sessions) */}
          {isStopped && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  onClick={onResume}
                  disabled={isResuming || isStopping || isDeleting}
                >
                  {isResuming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Resume</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Resume this session</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Stop button (for running sessions) */}
          {isRunning && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  onClick={onStop}
                  disabled={isResuming || isStopping || isDeleting}
                >
                  {isStopping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Stop</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Stop this session</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Delete button (always shown) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                disabled={isResuming || isStopping || isDeleting}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Delete</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete session</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
