/**
 * useChatMessages Hook
 *
 * React hook for managing chat message state with incremental sync via SSE.
 * Provides real-time message updates, historical pagination, send message integration,
 * and streaming error handling with retry functionality.
 *
 * Features:
 * - Initial message load with pagination support
 * - Real-time SSE connection for incremental updates
 * - Message state management with local cache
 * - Historical scroll (load older messages)
 * - Send message with optimistic updates
 * - Streaming error tracking and retry
 * - Max sequence tracking for SSE since parameter
 *
 * @see .planning/phases/04-real-time-chat/04-RESEARCH.md > Pattern 5
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMessages, useSendMessage } from "@/lib/api/messages";
import { useSSE } from "./useSSE";
import { getApiUrl } from "@/lib/api/client";
import type { Message } from "@/types/api";

export interface UseChatMessagesReturn {
  /** Array of messages (mix of initial load and SSE updates) */
  messages: Message[];
  /** Loading state for initial message fetch */
  isLoading: boolean;
  /** Error from initial message fetch */
  error: Error | null;
  /** Current streaming message content (for assistant responses) */
  streamingContent: string;
  /** Sequence number of the streaming message */
  streamingSeq: number | null;
  /** Streaming error state (when SSE fails or stream aborts) */
  streamingError: Error | null;
  /** Send message mutation function */
  sendMessage: (content: string) => void;
  /** Load more historical messages */
  loadMore: (before: number) => void;
  /** Retry last failed message */
  retryLastMessage: () => void;
  /** Whether a message send is in progress */
  isSending: boolean;
}

/**
 * React hook for managing chat messages with SSE incremental sync
 *
 * @param sessionId - The session ID (undefined disables the hook)
 * @returns Chat message state and operations
 *
 * @example
 * ```tsx
 * const {
 *   messages,
 *   isLoading,
 *   streamingContent,
 *   streamingSeq,
 *   sendMessage,
 *   loadMore
 * } = useChatMessages("session-123");
 * ```
 */
export function useChatMessages(sessionId: string | undefined): UseChatMessagesReturn {
  const queryClient = useQueryClient();

  // Local message state (combines initial load + SSE updates)
  const [messages, setMessages] = useState<Message[]>([]);

  // Track highest sequence number for SSE since parameter
  const [maxSeq, setMaxSeq] = useState<number>(0);

  // Streaming message state
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [streamingSeq, setStreamingSeq] = useState<number | null>(null);

  // Streaming error state
  const [streamingError, setStreamingError] = useState<Error | null>(null);

  // Track last user message for retry functionality
  const [lastUserMessage, setLastUserMessage] = useState<string>("");

  // Initial message load (recent 50 messages)
  const {
    data: initialMessages,
    isLoading,
    error,
  } = useMessages(
    sessionId,
    sessionId ? { limit: 50 } : undefined
  );

  // Update local state when initial messages load
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);

      // Calculate max sequence number
      const max = Math.max(0, ...initialMessages.map((m) => m.seq));
      setMaxSeq(max);
    }
  }, [initialMessages]);

  // SSE connection for real-time updates
  const sseUrl = useMemo(() => {
    if (!sessionId) {
      return "";
    }
    return `${getApiUrl(`sessions/${sessionId}/messages/stream`)}?since=${maxSeq}`;
  }, [sessionId, maxSeq]);

  // Handle SSE message arrivals
  const handleSSEMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      // Check for duplicate messages (by seq)
      const exists = prev.some((m) => m.seq === message.seq);
      if (exists) {
        return prev;
      }

      // Append new message
      return [...prev, message];
    });

    // Update max sequence number
    setMaxSeq((prev) => Math.max(prev, message.seq));

    // If this is an assistant message, handle streaming
    if (message.role === "assistant") {
      setStreamingContent(message.content);
      setStreamingSeq(message.seq);

      // Clear streaming error on successful message
      setStreamingError(null);
    }
  }, []);

  // Handle SSE errors
  const handleSSEError = useCallback((error: Event) => {
    setStreamingError(new Error("SSE connection failed"));
    setStreamingSeq(null);
    setStreamingContent("");
  }, []);

  // Set up SSE connection
  useSSE(sseUrl, {
    onMessage: handleSSEMessage,
    onError: handleSSEError,
    enabled: !!sessionId && !!sseUrl,
  });

  // Send message mutation
  const sendMessageMutation = useSendMessage(sessionId || "");

  // Send message with optimistic update
  const sendMessage = useCallback((content: string) => {
    if (!sessionId) {
      return;
    }

    // Track for retry functionality
    setLastUserMessage(content);

    // Optimistic update: add user message immediately
    const optimisticMessage: Message = {
      seq: -1, // Temporary seq
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    // Send message to backend
    sendMessageMutation.mutate(
      { content },
      {
        onSuccess: (sentMessage) => {
          // Replace optimistic message with real message
          setMessages((prev) =>
            prev.map((m) => (m.seq === -1 ? sentMessage : m))
          );

          // Invalidate query to ensure consistency
          queryClient.invalidateQueries({
            queryKey: ["messages", sessionId],
          });

          // Clear streaming error on successful send
          setStreamingError(null);
        },
        onError: (error) => {
          // Rollback optimistic update
          setMessages((prev) => prev.filter((m) => m.seq !== -1));
          setStreamingError(error);
        },
      }
    );
  }, [sessionId, sendMessageMutation, queryClient]);

  // Load more historical messages
  const loadMore = useCallback((before: number) => {
    if (!sessionId) {
      return;
    }

    // Fetch older messages via TanStack Query
    queryClient.fetchQuery({
      queryKey: ["messages", sessionId, { before }],
      queryFn: async () => {
        const response = await fetch(
          `${getApiUrl(`sessions/${sessionId}/messages`)}?before=${before}&limit=50`
        );
        if (!response.ok) {
          throw new Error(`Failed to load messages: ${response.statusText}`);
        }
        return response.json();
      },
    }).then((olderMessages: Message[]) => {
      // Prepend older messages and deduplicate
      setMessages((prev) => {
        const existingSeqs = new Set(prev.map((m) => m.seq));
        const newMessages = olderMessages.filter(
          (m) => !existingSeqs.has(m.seq)
        );
        return [...newMessages, ...prev];
      });
    }).catch((error: Error) => {
      console.error("Failed to load more messages:", error);
      setStreamingError(error);
    });
  }, [sessionId, queryClient]);

  // Retry last message
  const retryLastMessage = useCallback(() => {
    if (lastUserMessage) {
      setStreamingError(null);
      sendMessage(lastUserMessage);
    }
  }, [lastUserMessage, sendMessage]);

  return {
    messages,
    isLoading,
    error,
    streamingContent,
    streamingSeq,
    streamingError,
    sendMessage,
    loadMore,
    retryLastMessage,
    isSending: sendMessageMutation.isPending,
  };
}
