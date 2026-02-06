import { useParams, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

/**
 * SessionDetail page
 *
 * Main content area displaying individual session
 *
 * Features:
 * - Displays session ID from URL params
 * - Back button (mobile only) to return to session list
 * - Placeholder message area
 * - Full height container
 * - Responsive layout
 */
export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with back button (mobile) and session info */}
      <div className="flex items-center gap-4 mb-6">
        {/* Back button - mobile only */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="md:hidden"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div>
          <h1 className="text-2xl font-semibold">Session</h1>
          <p className="text-sm text-muted-foreground">ID: {id}</p>
        </div>
      </div>

      {/* Message area placeholder */}
      <div className="flex-1 flex items-center justify-center border rounded-lg bg-muted/20">
        <div className="text-center">
          <p className="text-muted-foreground text-lg">Session messages</p>
          <p className="text-muted-foreground text-sm mt-2">
            Messages will appear here
          </p>
        </div>
      </div>
    </div>
  );
}
