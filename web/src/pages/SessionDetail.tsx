import { useParams } from 'react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { useNavigateToSessionList, useNavigateToSession } from '@/router';
import { useSession, useResumeSession, useStopSession, useDeleteSession } from '@/lib/api/sessions';
import { SessionMetadata } from '@/components/session/SessionMetadata';
import { SessionHeader } from '@/components/session/SessionHeader';
import { ResumeSessionDialog } from '@/components/session/ResumeSessionDialog';
import { DeleteSessionDialog } from '@/components/session/DeleteSessionDialog';
import { toast } from 'sonner';
import type { Session } from '@/types/api';

/**
 * SessionDetail page
 *
 * Main content area displaying individual session with metadata
 *
 * Features:
 * - Fetches and displays session data from API
 * - Shows session metadata in card layout
 * - Loading state with spinner while fetching
 * - Error state with retry and back options
 * - Back button (mobile only) to return to session list
 * - Placeholder message area (ready for Phase 4)
 * - Full height container with responsive layout
 */
export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    throw new Error('Session ID is required');
  }

  const navigateToSessionList = useNavigateToSessionList();
  const navigateToSession = useNavigateToSession();

  // Fetch session data
  const { data: session, error, isLoading } = useSession(id);

  // Dialog states
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Mutations
  const resumeSession = useResumeSession(id);
  const stopSession = useStopSession(id);
  const deleteSession = useDeleteSession();

  // Handle error state
  if (error) {
    toast.error(`Failed to load session: ${error.message}`);
  }

  // Action handlers
  const handleResume = () => {
    setResumeDialogOpen(true);
  };

  const handleResumeConfirm = (mode: 'continue' | 'resume' | 'new') => {
    if (mode === 'new') {
      // For new session, navigate to create dialog with pre-filled directory
      // This would require passing state to the create dialog
      toast.info('Create new session with same directory - to be implemented');
      setResumeDialogOpen(false);
      return;
    }

    // Resume with mode
    resumeSession.mutate(mode, {
      onSuccess: (data) => {
        setResumeDialogOpen(false);
        // Navigate to resumed session (if different ID)
        if (data.id !== id) {
          navigateToSession(data.id);
        }
      },
    });
  };

  const handleStop = () => {
    stopSession.mutate();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    deleteSession.mutate(id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        // Navigate back to session list
        navigateToSessionList();
      },
    });
  };

  const handleBack = () => {
    navigateToSessionList();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Session Header with actions */}
      {session && (
        <SessionHeader
          session={session}
          onResume={handleResume}
          onStop={handleStop}
          onDelete={handleDelete}
          isResuming={resumeSession.isPending}
          isStopping={stopSession.isPending}
          isDeleting={deleteSession.isPending}
          onBack={handleBack}
        />
      )}

      {/* Loading header when session not loaded yet */}
      {!session && (
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <Loader2 className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <h1 className="text-2xl font-semibold text-muted-foreground">
                Loading session...
              </h1>
            </div>
          </div>
        </div>
      )}

      {/* Main content area */}
      {isLoading ? (
        // Loading state
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">Loading session data...</p>
          </div>
        </div>
      ) : error ? (
        // Error state
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Failed to load session</h2>
            <p className="text-muted-foreground mb-6">{error.message}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={navigateToSessionList}>
                Go Back
              </Button>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      ) : session ? (
        // Session data loaded successfully
        <div className="flex-1 flex flex-col gap-6 overflow-auto">
          {/* Session metadata */}
          <SessionMetadata session={session} />

          {/* Message area placeholder (ready for Phase 4) */}
          <div className="flex-1 flex items-center justify-center border rounded-lg bg-muted/20">
            <div className="text-center">
              <p className="text-muted-foreground text-lg">Session messages</p>
              <p className="text-muted-foreground text-sm mt-2">
                Messages will appear here (Phase 4)
              </p>
            </div>
          </div>
        </div>

        {/* Dialogs */}
        {session && (
          <>
            <ResumeSessionDialog
              open={resumeDialogOpen}
              onOpenChange={setResumeDialogOpen}
              session={session}
              onConfirm={handleResumeConfirm}
              isResuming={resumeSession.isPending}
            />

            <DeleteSessionDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              session={session}
              isDeleting={deleteSession.isPending}
              onConfirm={handleDeleteConfirm}
            />
          </>
        )}
    </div>
  );
}
