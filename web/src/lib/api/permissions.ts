/**
 * Permission API Service
 *
 * Provides service functions and React hooks for permission management.
 *
 * Endpoints:
 * - POST /api/v1/sessions/:sessionId/permissions/:requestId/approve
 * - POST /api/v1/sessions/:sessionId/permissions/:requestId/deny
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { getApiUrl, fetchWithErrorHandling } from "./client";
import {
  PermissionSchema,
  type Permission,
  type ApprovePermissionRequest,
} from "@/types/api";

/**
 * Approves a permission request
 *
 * @param sessionId - The session ID
 * @param requestId - The permission request ID
 * @param request - Approval request with scope
 * @returns Promise resolving to approved permission
 * @throws ApiError if request fails or response is invalid
 */
export async function approvePermission(
  sessionId: string,
  requestId: string,
  request: ApprovePermissionRequest
): Promise<Permission> {
  const url = getApiUrl(
    `sessions/${sessionId}/permissions/${requestId}/approve`
  );

  const response = await fetchWithErrorHandling(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();
  const validatedData = PermissionSchema.parse(data);
  return validatedData;
}

/**
 * Denies a permission request
 *
 * @param sessionId - The session ID
 * @param requestId - The permission request ID
 * @returns Promise resolving to denied permission
 * @throws ApiError if request fails or response is invalid
 */
export async function denyPermission(
  sessionId: string,
  requestId: string
): Promise<Permission> {
  const url = getApiUrl(
    `sessions/${sessionId}/permissions/${requestId}/deny`
  );

  const response = await fetchWithErrorHandling(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  const validatedData = PermissionSchema.parse(data);
  return validatedData;
}

/**
 * React hook for approving a permission
 *
 * @param sessionId - The session ID
 * @returns Mutation object with trigger function and state
 *
 * @example
 * const approveMutation = useApprovePermission("session-123");
 * const handleApprove = (requestId: string) => {
 *   approveMutation.mutate({
 *     requestId,
 *     request: { scope: "file-read" }
 *   });
 * };
 */
export function useApprovePermission(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      request,
    }: {
      requestId: string;
      request: ApprovePermissionRequest;
    }) => approvePermission(sessionId, requestId, request),
    onSuccess: () => {
      // Invalidate messages query to refresh after permission approval
      queryClient.invalidateQueries({ queryKey: ["messages", sessionId] });
    },
  });
}

/**
 * React hook for denying a permission
 *
 * @param sessionId - The session ID
 * @returns Mutation object with trigger function and state
 *
 * @example
 * const denyMutation = useDenyPermission("session-123");
 * const handleDeny = (requestId: string) => {
 *   denyMutation.mutate({ requestId });
 * };
 */
export function useDenyPermission(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId }: { requestId: string }) =>
      denyPermission(sessionId, requestId),
    onSuccess: () => {
      // Invalidate messages query to refresh after permission denial
      queryClient.invalidateQueries({ queryKey: ["messages", sessionId] });
    },
  });
}
