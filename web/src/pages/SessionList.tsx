import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigateToSession } from '@/router';

/**
 * SessionList page
 *
 * Main page displaying list of sessions
 *
 * Features:
 * - Empty state when no sessions
 * - "New Session" button using Button component
 * - Responsive padding
 * - Full height container
 * - Navigation utility for clicking on session items
 *
 * TODO (03-02): Integrate session list data from API
 * TODO (03-02): Render actual session list items with click handlers
 */
export default function SessionList() {
  const navigateToSession = useNavigateToSession();

  return (
    <div className="h-full flex flex-col">
      {/* Header with title and action button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Sessions</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Session
        </Button>
      </div>

      {/* Empty state */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground text-lg">No sessions yet</p>
          <p className="text-muted-foreground text-sm mt-2">
            Create a new session to start chatting
          </p>
        </div>
      </div>
    </div>
  );
}
