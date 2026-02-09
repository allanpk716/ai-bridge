/**
 * Message API Service
 *
 * Provides service functions and React hooks for fetching and sending messages
 * with pagination support for incremental sync.
 *
 * Endpoints:
 * - GET /api/v1/sessions/:sessionId/messages?since=&before=&limit=
 * - POST /api/v1/sessions/:sessionId/messages
 *
 * Pagination parameters:
 * - since: Get messages after this sequence number (incremental sync)
 * - before: Get messages before this sequence number (historical scroll)
 * - limit: Maximum number of messages to return (default 50, max 100)
 */

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { getApiUrl, fetchWithErrorHandling } from "./client";
import {
  MessageSchema,
  type Message,
  type MessagePaginationOptions,
} from "@/types/api";

/**
 * Zod schema for validating message list response
 */
const MessageListSchema = z.array(MessageSchema);

/**
 * Constructs query parameters string from pagination options
 *
 * @param options - Pagination options (since, before, limit)
 * @returns URL-encoded query string (e.g., "?since=100&limit=50")
 */
function buildQueryParams(options?: MessagePaginationOptions): string {
  if (!options) {
    return "";
  }

  const params = new URLSearchParams();

  if (options.since !== undefined) {
    params.append("since", options.since.toString());
  }

  if (options.before !== undefined) {
    params.append("before", options.before.toString());
  }

  if (options.limit !== undefined) {
    params.append("limit", options.limit.toString());
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Fetches messages for a session with pagination
 *
 * @param sessionId - The session ID
 * @param options - Pagination options (since, before, limit)
 * @returns Promise resolving to array of messages
 * @throws ApiError if request fails or response is invalid
 *
 * @example
 * // Fetch recent messages
 * const messages = await fetchMessages("session-123", { limit: 50 });
 *
 * // Fetch messages after seq 100 (incremental sync)
 * const newMessages = await fetchMessages("session-123", { since: 100 });
 *
 * // Fetch historical messages before seq 50 (scroll back)
 * const oldMessages = await fetchMessages("session-123", { before: 50, limit: 50 });
 */
export async function fetchMessages(
  sessionId: string,
  options?: MessagePaginationOptions
): Promise<Message[]> {
  const queryParams = buildQueryParams(options);
  const url = getApiUrl(`sessions/${sessionId}/messages${queryParams}`);

  const response = await fetchWithErrorHandling(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  const validatedData = MessageListSchema.parse(data);
  return validatedData;
}

/**
 * React hook for fetching messages with pagination
 *
 * @param sessionId - The session ID (query is disabled if undefined)
 * @param options - Pagination options (since, before, limit)
 * @returns Query result with messages data, error, and loading state
 *
 * @example
 * // Fetch recent messages
 * const { data: messages, error, isLoading } = useMessages("session-123", { limit: 50 });
 *
 * // Fetch messages after seq 100 (incremental sync)
 * const { data: newMessages } = useMessages("session-123", { since: 100 });
 *
 * // Auto-disable when no session selected
 * const { data: messages } = useMessages(undefined); // Won't fetch
 */
export function useMessages(
  sessionId: string | undefined,
  options?: MessagePaginationOptions
): UseQueryResult<Message[], Error> {
  return useQuery({
    queryKey: ["messages", sessionId, options],
    queryFn: () => fetchMessages(sessionId!, options),
    enabled: !!sessionId, // Only fetch when sessionId exists
    staleTime: 2000, // Consider data stale after 2 seconds (real-time data)
  });
}

/**
 * Zod schema for validating send message request
 */
const SendMessageRequestSchema = z.object({
  content: z.string().min(1, "Message content cannot be empty"),
});

/**
 * Send message request type
 */
export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;

/**
 * Sends a message to a session
 *
 * @param sessionId - The session ID
 * @param request - Message content
 * @returns Promise resolving to sent message with assigned seq number
 * @throws ApiError if request fails or response is invalid
 *
 * @example
 * const message = await sendMessage("session-123", { content: "Hello, Claude!" });
 * console.log(`Message sent with seq: ${message.seq}`);
 */
export async function sendMessage(
  sessionId: string,
  request: SendMessageRequest
): Promise<Message> {
  const url = getApiUrl(`sessions/${sessionId}/messages`);

  // Validate request
  const validatedRequest = SendMessageRequestSchema.parse(request);

  const response = await fetchWithErrorHandling(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(validatedRequest),
  });

  const data = await response.json();
  const validatedData = MessageSchema.parse(data);
  return validatedData;
}

/**
 * React hook for sending a message to a session with optimistic UI updates
 *
 * @param sessionId - The session ID
 * @returns Mutation object with trigger function and state
 *
 * @example
 * const sendMessageMutation = useSendMessage("session-123");
 * const handleSend = (content: string) => {
 *   sendMessageMutation.mutate({ content });
 * };
 */
export function useSendMessage(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SendMessageRequest) => sendMessage(sessionId, request),
    onMutate: async (newMessage) => {
      // Cancel ongoing queries to avoid race conditions
      await queryClient.cancelQueries({ queryKey: ["messages", sessionId] });

      // Save previous messages for rollback on error
      const previousMessages = queryClient.getQueryData<Message[]>(["messages", sessionId]);

      // Optimistically add message to the UI
      queryClient.setQueryData<Message[]>(
        ["messages", sessionId],
        (old = []) => [
          ...old,
          {
            ...newMessage,
            id: `temp-${Date.now()}`,
            seq: -1, // Temporary seq until server responds
            role: "user",
            timestamp: new Date().toISOString(),
            status: "sending",
          } as Message,
        ]
      );

      return { previousMessages };
    },
    onError: (error, _newMessage, context) => {
      // Rollback to previous state on error
      if (context?.previousMessages) {
        queryClient.setQueryData(["messages", sessionId], context.previousMessages);
      }
      toast.error(`Failed to send message: ${error.message}`);
    },
    onSuccess: () => {
      // Invalidate to get server-confirmed message
      queryClient.invalidateQueries({ queryKey: ["messages", sessionId] });
    },
  });
}
