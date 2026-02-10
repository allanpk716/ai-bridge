import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, CheckSquare, X } from "lucide-react";
import { useSessions, useDeleteSession } from "@/lib/api/sessions";
import { SessionListItem } from "@/components/session/SessionListItem";
import { SessionListFilters } from "@/components/session/SessionListFilters";
import { CreateSessionDialog } from "@/components/session/CreateSessionDialog";
import { DeleteSessionDialog } from "@/components/session/DeleteSessionDialog";
import { BatchDeleteDialog } from "@/components/session/BatchDeleteDialog";
import { SessionListSkeleton } from "@/components/skeletons";
import { useNavigateToSession } from "@/router";
import { useFuseSearch } from "@/features/search/hooks/useFuseSearch";
import type { Session } from "@/types/api";
import { toast } from "sonner";

/**
 * SessionList page
 *
 * Main page displaying list of sessions with filtering and search.
 *
 * Features:
 * - Fetches sessions from API using useSessions hook
 * - Displays loading state with spinner
 * - Displays error state with retry option
 * - Shows empty state when no sessions exist
 * - Filters: search by name, filter by status, sort by time
 * - Click session to navigate to detail page
 * - "New Session" button (functionality to be added in plan 03-03)
 */
export default function SessionList() {
  const {
    data: sessions = [],
    error,
    isLoading,
    refetch,
  } = useSessions();

  const navigateToSession = useNavigateToSession();
  const deleteSession = useDeleteSession();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);

  // Selection mode state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(
    new Set()
  );

  // Batch delete state
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false);
  const [failedDeletions, setFailedDeletions] = useState<string[]>([]);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "running" | "stopped"
  >("all");
  const [sortBy, setSortBy] = useState<"lastActivity" | "createdAt">(
    "lastActivity"
  );

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    let filtered = [...sessions];

    // Use Fuse.js for fuzzy search
    const searchResults = useFuseSearch(
      filtered,
      searchQuery,
      {
        keys: [
          'metadata.name',
          'metadata.workingDir',
          'id'
        ],
        threshold: 0.3
      }
    );

    if (searchQuery.trim()) {
      filtered = searchResults;
    }

    // Filter by status
    if (statusFilter === "running") {
      filtered = filtered.filter(
        (session) =>
          session.status === "processing" || session.status === "waiting"
      );
    } else if (statusFilter === "stopped") {
      filtered = filtered.filter((session) => session.status === "stopped");
    }

    // Sort by time
    filtered.sort((a: Session, b: Session) => {
      const getTime = (session: Session): number => {
        if (sortBy === "lastActivity") {
          const lastActivity = session.metadata
            ?.lastActivity as string | undefined;
          if (lastActivity) return new Date(lastActivity).getTime();
          // Fallback to createdAt
          return new Date(session.createdAt).getTime();
        } else {
          return new Date(session.createdAt).getTime();
        }
      };

      return getTime(b) - getTime(a); // Newest first
    });

    return filtered;
  }, [sessions, searchQuery, statusFilter, sortBy]);

  const handleSessionClick = (sessionId: string) => {
    navigateToSession(sessionId);
  };

  const handleDeleteClick = (session: Session) => {
    setSessionToDelete(session);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (sessionToDelete) {
      deleteSession.mutate(sessionToDelete.id);
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  // Selection handlers
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedSessionIds(new Set());
  };

  const toggleSessionSelection = (sessionId: string, selected: boolean) => {
    setSelectedSessionIds((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(sessionId);
      } else {
        newSet.delete(sessionId);
      }
      return newSet;
    });
  };

  const handleBatchDeleteClick = () => {
    setBatchDeleteDialogOpen(true);
  };

  const handleBatchDeleteConfirm = async () => {
    const selectedSessions = sessions.filter((s) =>
      selectedSessionIds.has(s.id)
    );

    if (selectedSessions.length === 0) return;

    setIsBatchDeleting(true);
    setFailedDeletions([]);

    // Delete sessions one by one
    const failures: string[] = [];
    for (const session of selectedSessions) {
      try {
        await deleteSession.mutateAsync(session.id);
      } catch (error) {
        failures.push(session.id);
      }
    }

    setFailedDeletions(failures);
    setIsBatchDeleting(false);
    setBatchDeleteDialogOpen(false);

    // Show toast with result
    const successCount = selectedSessions.length - failures.length;
    if (failures.length === 0) {
      toast.success(`Deleted ${successCount} session${successCount > 1 ? "s" : ""}`);
    } else {
      toast.error(
        `Partial failure: ${successCount} succeeded, ${failures.length} failed`
      );
    }

    // Exit selection mode
    setSelectionMode(false);
    setSelectedSessionIds(new Set());
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with title and action buttons */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Sessions</h1>
          {selectionMode && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchDeleteClick}
              disabled={selectedSessionIds.size === 0 || isBatchDeleting}
              aria-label={`删除选中的 ${selectedSessionIds.size} 个会话`}
            >
              Delete Selected ({selectedSessionIds.size})
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2" role="toolbar" aria-label="会话操作工具栏">
          {selectionMode ? (
            <Button variant="ghost" onClick={toggleSelectionMode} aria-label="取消选择">
              <X className="h-4 w-4 mr-2" aria-hidden="true" />
              Cancel Selection
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={toggleSelectionMode} aria-label="进入选择模式">
                <CheckSquare className="h-4 w-4 mr-2" aria-hidden="true" />
                Select
              </Button>
              <Button onClick={() => setDialogOpen(true)} aria-label="创建新会话">
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                New Session
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Filters - hide in selection mode */}
      {!selectionMode && (
        <section aria-label="会话筛选器">
          <SessionListFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </section>
      )}

      {/* Content area */}
      <main className="flex-1 overflow-y-auto" role="main" aria-label="会话列表">
        {/* Loading state */}
        {isLoading && (
          <div role="status" aria-live="polite" aria-label="正在加载会话">
            <SessionListSkeleton />
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center h-full gap-4" role="alert" aria-live="assertive">
            <p className="text-muted-foreground text-lg">
              Failed to load sessions
            </p>
            <Button variant="outline" onClick={() => refetch()} aria-label="重试加载会话">
              Retry
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && sessions.length === 0 && (
          <div className="flex items-center justify-center h-full" role="status" aria-live="polite">
            <div className="text-center">
              <p className="text-muted-foreground text-lg">No sessions yet</p>
              <p className="text-muted-foreground text-sm mt-2">
                Create a new session to start chatting
              </p>
            </div>
          </div>
        )}

        {/* No results after filtering */}
        {!isLoading &&
          !error &&
          sessions.length > 0 &&
          filteredSessions.length === 0 && (
            <div className="flex items-center justify-center h-full" role="status" aria-live="polite">
              <p className="text-muted-foreground text-lg">
                No sessions match your filters
              </p>
            </div>
          )}

        {/* Session list */}
        {!isLoading && !error && filteredSessions.length > 0 && (
          <ul className="space-y-3" role="list" aria-label="会话列表">
            {filteredSessions.map((session) => (
              <li key={session.id}>
                <SessionListItem
                  session={session}
                  onClick={() => handleSessionClick(session.id)}
                  onDelete={() => handleDeleteClick(session)}
                  isDeleting={
                    sessionToDelete?.id === session.id &&
                    deleteSession.isPending
                  }
                  selectionMode={selectionMode}
                  isSelected={selectedSessionIds.has(session.id)}
                  onSelectionChange={(selected) =>
                    toggleSessionSelection(session.id, selected)
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* Create Session Dialog */}
      <CreateSessionDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {/* Delete Session Dialog */}
      {sessionToDelete && (
        <DeleteSessionDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          session={sessionToDelete}
          isDeleting={deleteSession.isPending}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {/* Batch Delete Dialog */}
      <BatchDeleteDialog
        open={batchDeleteDialogOpen}
        onOpenChange={setBatchDeleteDialogOpen}
        sessions={sessions.filter((s) => selectedSessionIds.has(s.id))}
        isDeleting={isBatchDeleting}
        failedDeletions={failedDeletions}
        onConfirm={handleBatchDeleteConfirm}
      />
    </div>
  );
}
