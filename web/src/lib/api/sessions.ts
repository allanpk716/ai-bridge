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
 * Zod schema for validating single session response
 */
const SingleSessionSchema = SessionSchema;

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
 * Fetches a single session by ID from the API
 *
 * @param sessionId - The session ID to fetch
 * @returns Promise resolving to session object
 * @throws ApiError if request fails or response is invalid
 */
export async function fetchSession(sessionId: string): Promise<Session> {
  const url = getApiUrl(`sessions/${sessionId}`);
  const response = await fetchWithErrorHandling(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  const validatedData = SingleSessionSchema.parse(data);
  return validatedData;
}

/**
 * React hook for fetching a single session
 *
 * @param sessionId - The session ID to fetch
 * @returns Query result with session data, error, and loading state
 *
 * @example
 * const { data: session, error, isLoading } = useSession("abc123");
 */
export function useSession(
  sessionId: string | undefined
): UseQueryResult<Session, Error> {
  return useQuery({
    queryKey: ["session", sessionId],
    queryFn: () => fetchSession(sessionId!),
    enabled: !!sessionId, // Only run query when sessionId is defined
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

/**
 * Deletes a session by ID
 *
 * @param sessionId - The session ID to delete
 * @returns Promise resolving to void on success
 * @throws ApiError if request fails
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const url = getApiUrl(`sessions/${sessionId}`);
  await fetchWithErrorHandling(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * React hook for deleting a session
 *
 * @returns Mutation object with trigger function and state
 *
 * @example
 * const deleteMutation = useDeleteSession();
 * const handleDelete = () => {
 *   deleteMutation.mutate("abc123");
 * };
 */
export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      // Invalidate sessions query to refetch list
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      // Show success toast
      toast.success("Session deleted successfully");
    },
    onError: (error) => {
      // Show error toast
      toast.error(`Failed to delete session: ${error.message}`);
    },
  });
}

/**
 * Resume a session with specified mode
 *
 * @param sessionId - Session ID to resume
 * @param mode - Resume mode: 'continue', 'resume', or 'new'
 * @returns Promise resolving to resumed/created Session object
 * @throws ApiError if request fails
 */
export async function resumeSession(
  sessionId: string,
  mode: "continue" | "resume" | "new"
): Promise<Session> {
  const url = getApiUrl(`sessions/${sessionId}/resume`);
  const response = await fetchWithErrorHandling(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mode }),
  });
  return response as unknown as Session;
}

/**
 * React hook for resuming a session
 *
 * @param sessionId - Session ID to resume
 * @returns Mutation object with trigger function and state
 *
 * @example
 * const resumeMutation = useResumeSession("abc123");
 * const handleResume = (mode) => {
 *   resumeMutation.mutate(mode);
 * };
 */
export function useResumeSession(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mode: "continue" | "resume" | "new") =>
      resumeSession(sessionId, mode),
    onSuccess: (data) => {
      // Invalidate sessions query to refetch list
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      // Invalidate specific session query
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      // Show success toast
      toast.success("Session resumed successfully");
    },
    onError: (error) => {
      // Show error toast
      toast.error(`Failed to resume session: ${error.message}`);
    },
  });
}

/**
 * Stop a running session
 *
 * @param sessionId - Session ID to stop
 * @returns Promise resolving to updated Session object
 * @throws ApiError if request fails
 */
export async function stopSession(sessionId: string): Promise<Session> {
  const url = getApiUrl(`sessions/${sessionId}/stop`);
  const response = await fetchWithErrorHandling(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response as unknown as Session;
}

/**
 * React hook for stopping a session
 *
 * @param sessionId - Session ID to stop
 * @returns Mutation object with trigger function and state
 *
 * @example
 * const stopMutation = useStopSession("abc123");
 * const handleStop = () => {
 *   stopMutation.mutate();
 * };
 */
export function useStopSession(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => stopSession(sessionId),
    onSuccess: () => {
      // Invalidate session query to refresh status
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      // Invalidate sessions list query
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      // Show success toast
      toast.success("Session stopped successfully");
    },
    onError: (error) => {
      // Show error toast
      toast.error(`Failed to stop session: ${error.message}`);
    },
  });
}
