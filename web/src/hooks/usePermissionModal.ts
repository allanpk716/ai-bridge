/**
 * usePermissionModal Hook
 *
 * React hook for managing permission requests that arrive via SSE message stream.
 * Provides state management for permission cards embedded in the message stream.
 *
 * Features:
 * - Listens to SSE message stream for permission messages
 * - Tracks permissions by requestId for deduplication
 * - Provides approve/deny handlers with API mutations
 * - Updates permission status after actions
 * - Cleans up permissions on unmount or session change
 *
 * IMPORTANT: Permissions come through SSE message stream, NOT WebSocket events.
 * The message type will be 'permission' with requestId, operation, resources.
 *
 * @see .planning/phases/04-real-time-chat/04-CONTEXT.md > Permission Request Interaction
 */

import { useState, useCallback, useEffect } from "react";
import { useApprovePermission, useDenyPermission } from "@/lib/api/permissions";
import type { Permission } from "@/types/api";

/**
 * Extended Permission type with status tracking
 */
export interface PermissionWithStatus extends Permission {
  status: "pending" | "approved" | "denied";
}

export interface UsePermissionModalReturn {
  /** Array of permissions (pending and historical) */
  permissions: PermissionWithStatus[];
  /** Approve permission with scope */
  handleApprove: (requestId: string, scope: string) => void;
  /** Deny permission */
  handleDeny: (requestId: string) => void;
  /** Whether a mutation is in progress */
  isLoading: boolean;
}

/**
 * React hook for managing permission state from SSE stream
 *
 * @param sessionId - The session ID (undefined disables the hook)
 * @returns Permission state and action handlers
 *
 * @example
 * ```tsx
 * const {
 *   permissions,
 *   handleApprove,
 *   handleDeny,
 *   isLoading
 * } = usePermissionModal("session-123");
 *
 * // Render permissions in ChatMessageList
 * {permissions.map((permission) => (
 *   <PermissionCard
 *     key={permission.requestId}
 *     permission={permission}
 *     onApprove={(scope) => handleApprove(permission.requestId, scope)}
 *     onDeny={() => handleDeny(permission.requestId)}
 *     isLoading={isLoading}
 *     status={permission.status}
 *   />
 * ))}
 * ```
 */
export function usePermissionModal(sessionId: string | undefined): UsePermissionModalReturn {
  // Permission state array
  const [permissions, setPermissions] = useState<PermissionWithStatus[]>([]);

  // Mutation hooks
  const approveMutation = useApprovePermission(sessionId || "");
  const denyMutation = useDenyPermission(sessionId || "");

  // Track loading state
  const isLoading = approveMutation.isPending || denyMutation.isPending;

  // Clear permissions when session changes
  useEffect(() => {
    if (!sessionId) {
      setPermissions([]);
    }
  }, [sessionId]);

  /**
   * Add permission from SSE stream
   * Call this when SSE message type is 'permission'
   */
  const addPermission = useCallback((permission: Permission) => {
    setPermissions((prev) => {
      // Check for duplicate permissions by requestId
      const exists = prev.some((p) => p.requestId === permission.requestId);
      if (exists) {
        return prev;
      }

      // Add new permission as pending
      return [
        ...prev,
        {
          ...permission,
          status: "pending",
        },
      ];
    });
  }, []);

  /**
   * Approve permission with scope
   */
  const handleApprove = useCallback(
    (requestId: string, scope: string) => {
      if (!sessionId) {
        return;
      }

      approveMutation.mutate(
        {
          requestId,
          request: { scope },
        },
        {
          onSuccess: (approvedPermission) => {
            // Update permission status to approved
            setPermissions((prev) =>
              prev.map((p) =>
                p.requestId === requestId
                  ? { ...p, status: "approved" as const }
                  : p
              )
            );
          },
          onError: (error) => {
            console.error("Failed to approve permission:", error);
            // Remove permission on error or keep with pending status?
            // Keep it so user can try again
          },
        }
      );
    },
    [sessionId, approveMutation]
  );

  /**
   * Deny permission
   */
  const handleDeny = useCallback(
    (requestId: string) => {
      if (!sessionId) {
        return;
      }

      denyMutation.mutate(
        { requestId },
        {
          onSuccess: () => {
            // Update permission status to denied
            setPermissions((prev) =>
              prev.map((p) =>
                p.requestId === requestId
                  ? { ...p, status: "denied" as const }
                  : p
              )
            );
          },
          onError: (error) => {
            console.error("Failed to deny permission:", error);
          },
        }
      );
    },
    [sessionId, denyMutation]
  );

  /**
   * Cleanup permissions on unmount
   */
  useEffect(() => {
    return () => {
      setPermissions([]);
    };
  }, []);

  return {
    permissions,
    handleApprove,
    handleDeny,
    isLoading,
  };
}

/**
 * Helper function to check if SSE message is a permission
 * Call this from SSE onMessage callback
 *
 * @example
 * ```tsx
 * const handleSSEMessage = useCallback((message: Message) => {
 *   if (isPermissionMessage(message)) {
 *     // Extract permission data and add to state
 *     addPermission(message.metadata?.permission as Permission);
 *   } else {
 *     // Handle regular message
 *     setMessages((prev) => [...prev, message]);
 *   }
 * }, [addPermission]);
 * ```
 */
export function isPermissionMessage(message: unknown): message is Permission {
  if (!message || typeof message !== "object") {
    return false;
  }

  const msg = message as Record<string, unknown>;
  return (
    "requestId" in msg &&
    "operation" in msg &&
    "resources" in msg &&
    Array.isArray(msg.resources)
  );
}
