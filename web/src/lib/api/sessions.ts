/**
 * Session API Service
 *
 * Provides service functions and React hooks for session management.
 *
 * Endpoints:
 * - GET /api/v1/sessions - List all sessions
 * - POST /api/v1/sessions - Create new session
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { getApiUrl, fetchWithErrorHandling } from "./client";
import {
  SessionSchema,
  type Session,
  type CreateSessionRequest,
} from "@/types/api";

/**
 * Zod schema for validating session list response
 */
const SessionListSchema = z.array(SessionSchema);

/**
 * Fetches all sessions from the API
 *
 * @returns Promise resolving to array of sessions
 * @throws ApiError if request fails or response is invalid
 */
export async function fetchSessions(): Promise<Session[]> {
  const url = getApiUrl("sessions");
  const response = await fetchWithErrorHandling(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  const validatedData = SessionListSchema.parse(data);
  return validatedData;
}

/**
 * React hook for fetching sessions
 *
 * @returns Query result with sessions data, error, and loading state
 *
 * @example
 * const { data: sessions, error, isLoading } = useSessions();
 */
export function useSessions(): UseQueryResult<Session[], Error> {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
    staleTime: 5000, // Consider data stale after 5 seconds
  });
}

/**
 * Creates a new session
 *
 * @param request - Session creation options (workingDir, model)
 * @returns Promise resolving to created session
 * @throws ApiError if request fails or response is invalid
 */
export async function createSession(
  request: CreateSessionRequest
): Promise<Session> {
  const url = getApiUrl("sessions");
  const response = await fetchWithErrorHandling(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();
  const validatedData = SessionSchema.parse(data);
  return validatedData;
}

/**
 * React hook for creating a new session
 *
 * @returns Mutation object with trigger function and state
 *
 * @example
 * const createMutation = useCreateSession();
 * const handleSubmit = () => {
 *   createMutation.mutate({ workingDir: "/path/to/project" });
 * };
 */
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSession,
    onSuccess: (data) => {
      // Invalidate sessions query to refetch list
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      // Show success toast
      toast.success(`Session "${data.id}" created successfully`);
    },
    onError: (error) => {
      // Show error toast (note: MutationCache also shows toast, but this provides context)
      toast.error(`Failed to create session: ${error.message}`);
    },
  });
}
