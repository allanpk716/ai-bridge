import { useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useNavigateToSessionList } from '@/router';
import { useSession } from '@/lib/api/sessions';
import { SessionMetadata } from '@/components/session/SessionMetadata';
import { toast } from 'sonner';

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
  const navigateToSessionList = useNavigateToSessionList();

  // Fetch session data
  const { data: session, error, isLoading } = useSession(id);

  // Handle error state
  if (error) {
    toast.error(`Failed to load session: ${error.message}`);
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with back button (mobile) and session info */}
      <div className="flex items-center gap-4 mb-6">
        {/* Back button - mobile only */}
        <Button
          variant="ghost"
          size="icon"
          onClick={navigateToSessionList}
          className="md:hidden"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <h1 className="text-2xl font-semibold text-muted-foreground">
                Loading session...
              </h1>
            </div>
          ) : session ? (
            <div>
              <h1 className="text-2xl font-semibold">
                Session {session.id.slice(0, 8)}
              </h1>
              <p className="text-sm text-muted-foreground">ID: {session.id}</p>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-semibold text-muted-foreground">
                Session not found
              </h1>
            </div>
          )}
        </div>
      </div>

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
      ) : null}
    </div>
  );
}
