import { useParams } from 'react-router';
import { useState, useRef, type RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { useNavigateToSessionList, useNavigateToSession } from '@/router';
import { useSession, useResumeSession, useStopSession, useDeleteSession } from '@/lib/api/sessions';
import { SessionMetadata } from '@/components/session/SessionMetadata';
import { SessionHeader } from '@/components/session/SessionHeader';
import { ResumeSessionDialog } from '@/components/session/ResumeSessionDialog';
import { DeleteSessionDialog } from '@/components/session/DeleteSessionDialog';
import { ChatMessageList } from '@/components/chat/ChatMessageList';
import { ChatInput, type ChatInputRef } from '@/components/chat/ChatInput';
import { StreamingErrorCard } from '@/components/chat/StreamingErrorCard';
import { useChatMessages } from '@/hooks/useChatMessages';
import { CommandExecutor } from '@/components/commands';
import { toast } from 'sonner';

/**
 * SessionDetail page
 *
 * Main content area displaying individual session with chat interface
 *
 * Features:
 * - Fetches and displays session data from API
 * - Shows session metadata in card layout
 * - Virtualized message list with real-time SSE updates
 * - Chat input for sending messages
 * - Streaming error handling with retry
 * - Loading state with spinner while fetching
 * - Error state with retry and back options
 * - Back button (mobile only) to return to session list
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

  // Chat input ref for command population
  const inputRef = useRef<ChatInputRef>(null);

  // Chat messages state
  const {
    messages,
    isLoading: isMessagesLoading,
    streamingContent,
    streamingSeq,
    streamingError,
    sendMessage,
    loadMore,
    retryLastMessage,
    isSending,
  } = useChatMessages(id);

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

  // Handle command insertion from CommandExecutor
  const handleCommandInserted = (commandText: string) => {
    if (inputRef.current) {
      inputRef.current.setValue(commandText);
    }
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
        <header className="flex items-center gap-4 mb-6" role="status" aria-live="polite">
          <Button variant="ghost" size="icon" onClick={handleBack} aria-label="返回会话列表">
            <Loader2 className="h-5 w-5" aria-hidden="true" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
              <h1 className="text-2xl font-semibold text-muted-foreground">
                Loading session...
              </h1>
            </div>
          </div>
        </header>
      )}

      {/* Main content area */}
      {isLoading ? (
        // Loading state
        <main className="flex-1 flex items-center justify-center" role="status" aria-live="polite" aria-label="正在加载会话数据">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto mb-4" aria-hidden="true" />
            <p className="text-muted-foreground text-lg">Loading session data...</p>
          </div>
        </main>
      ) : error ? (
        // Error state
        <main className="flex-1 flex items-center justify-center" role="alert" aria-live="assertive" aria-label="加载会话失败">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-xl font-semibold mb-2">Failed to load session</h2>
            <p className="text-muted-foreground mb-6">{error.message}</p>
            <div className="flex gap-3 justify-center" role="group" aria-label="错误操作按钮">
              <Button variant="outline" onClick={navigateToSessionList} aria-label="返回会话列表">
                Go Back
              </Button>
              <Button onClick={() => window.location.reload()} aria-label="重试加载">
                Retry
              </Button>
            </div>
          </div>
        </main>
      ) : session ? (
        // Session data loaded successfully
        <>
          {/* Session metadata - collapsible on mobile */}
          <section className="shrink-0" aria-label="会话元数据">
            <SessionMetadata session={session} />
          </section>

          {/* Chat interface */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Message list */}
            <section className="flex-1 min-h-0" aria-label="消息列表">
              <ChatMessageList
                messages={messages}
                streamingContent={streamingContent}
                streamingSeq={streamingSeq ?? undefined}
                isLoading={isMessagesLoading}
                onScrollToTop={() => {
                  // Load more messages when scrolling to top
                  const oldestSeq = messages[0]?.seq;
                  if (oldestSeq) {
                    loadMore(oldestSeq);
                  }
                }}
              />
            </section>

            {/* Streaming error card */}
            {streamingError && (
              <div className="px-4 pb-2" role="alert" aria-live="assertive">
                <StreamingErrorCard
                  error={streamingError}
                  onRetry={retryLastMessage}
                  onDismiss={() => {
                    // Clear error on dismiss
                    toast.info("Streaming error dismissed");
                  }}
                />
              </div>
            )}

            {/* Chat input with command trigger */}
            <div className="shrink-0">
              <div className="px-4 pt-2 pb-4">
                <div className="flex gap-2" role="toolbar" aria-label="命令工具栏">
                  {/* Command executor trigger */}
                  <CommandExecutor
                    sessionId={id}
                    onCommandInserted={handleCommandInserted}
                  />
                </div>
              </div>
              <ChatInput
                ref={inputRef}
                sessionId={id}
                onSent={() => {
                  // Message sent successfully, SSE will handle display
                  toast.success("Message sent");
                }}
                disabled={isSending || session.status !== "idle"}
              />
            </div>
          </div>

          {/* Dialogs */}
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
      ) : null}
    </div>
  );
}
