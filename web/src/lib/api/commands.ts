/**
 * Command API Service
 *
 * Provides service functions and React hooks for slash command management.
 *
 * Endpoints:
 * - GET /api/v1/commands?sessionId=
 * - POST /api/v1/sessions/:sessionId/commands
 */

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { z } from "zod";
import { getApiUrl, fetchWithErrorHandling } from "./client";
import { CommandSchema, type Command, type ExecuteCommandRequest } from "@/types/api";

/**
 * Zod schema for validating command list response
 */
const CommandListSchema = z.array(CommandSchema);

/**
 * Zod schema for validating grouped commands response
 * Commands are grouped by category
 */
export const CommandsByCategorySchema = z.record(z.array(CommandSchema));

/**
 * Type for grouped commands by category
 */
export type CommandsByCategory = z.infer<typeof CommandsByCategorySchema>;

/**
 * Fetches all available slash commands
 *
 * @param sessionId - Optional session ID to get project-specific commands
 * @returns Promise resolving to commands grouped by category
 * @throws ApiError if request fails or response is invalid
 */
export async function fetchCommands(
  sessionId?: string
): Promise<CommandsByCategory> {
  const params = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
  const url = getApiUrl(`commands${params}`);

  const response = await fetchWithErrorHandling(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  const validatedData = CommandsByCategorySchema.parse(data);
  return validatedData;
}

/**
 * React hook for fetching commands
 *
 * @param sessionId - Optional session ID
 * @returns Query result with commands data grouped by category
 *
 * @example
 * const { data: commands, error, isLoading } = useCommands("session-123");
 * // commands = { git: [...], cli: [...], project: [...] }
 */
export function useCommands(sessionId?: string): UseQueryResult<CommandsByCategory, Error> {
  return useQuery({
    queryKey: ["commands", sessionId],
    queryFn: () => fetchCommands(sessionId),
    staleTime: 60000, // Commands don't change often (1 minute)
  });
}

/**
 * Executes a slash command in a session
 *
 * @param sessionId - The session ID
 * @param request - Command execution request (path, args)
 * @returns Promise resolving to execution result
 * @throws ApiError if request fails
 */
export async function executeCommand(
  sessionId: string,
  request: ExecuteCommandRequest
): Promise<{ message: string }> {
  const url = getApiUrl(`sessions/${sessionId}/commands`);

  const response = await fetchWithErrorHandling(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();
  return data;
}

/**
 * React hook for executing a command
 *
 * @param sessionId - The session ID
 * @returns Mutation object with trigger function and state
 *
 * @example
 * const executeMutation = useExecuteCommand("session-123");
 * const handleExecute = () => {
 *   executeMutation.mutate({
 *     path: "/commit",
 *     args: ["Fix bug"]
 *   });
 * };
 */
export function useExecuteCommand(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ExecuteCommandRequest) =>
      executeCommand(sessionId, request),
    onSuccess: () => {
      // Invalidate messages query to refresh after command execution
      queryClient.invalidateQueries({ queryKey: ["messages", sessionId] });
    },
  });
}
