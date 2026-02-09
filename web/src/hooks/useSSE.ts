/**
 * useSSE Hook
 *
 * React hook for managing Server-Sent Events (SSE) connections with proper cleanup.
 * Provides real-time updates from backend SSE endpoints with automatic reconnection
 * and memory leak prevention.
 *
 * Features:
 * - EventSource creation and cleanup
 * - JSON message parsing
 * - Error handling with automatic close
 * - Memory leak prevention via cleanup function
 * - Optional enable/disable control
 *
 * @see .planning/phases/04-real-time-chat/04-RESEARCH.md > Pattern 5
 */

import { useEffect, useRef } from "react";
import type { Message } from "@/types/api";

export interface UseSSEOptions {
  /**
   * Callback function invoked when a message is received
   *
   * @param data - Parsed message data from SSE event
   */
  onMessage: (data: Message) => void;

  /**
   * Optional error callback
   *
   * @param error - Error event from EventSource
   */
  onError?: (error: Event) => void;

  /**
   * Whether the SSE connection should be enabled
   * @default true
   */
  enabled?: boolean;
}

/**
 * React hook for managing SSE connection with automatic cleanup
 *
 * @param url - SSE endpoint URL
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * useSSE(
 *   'http://localhost:8080/api/v1/sessions/abc-123/messages/stream?since=0',
 *   {
 *     onMessage: (message) => console.log('New message:', message),
 *     enabled: !!sessionId
 *   }
 * )
 * ```
 */
export function useSSE(url: string, options: UseSSEOptions) {
  const { onMessage, onError, enabled = true } = options;

  // Use ref to track EventSource for cleanup
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Skip if disabled or no URL
    if (!enabled || !url) {
      return;
    }

    // Create EventSource connection
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    // Set up message handler
    eventSource.onmessage = (event: MessageEvent) => {
      try {
        // Parse JSON data from SSE event
        const data = JSON.parse(event.data) as Message;
        onMessage(data);
      } catch (error) {
        console.error("Failed to parse SSE message:", error);
      }
    };

    // Set up error handler
    eventSource.onerror = (error: Event) => {
      console.error("SSE connection error:", error);

      // Call custom error callback if provided
      onError?.(error);

      // Close EventSource on error to prevent reconnection loops
      // Browser will attempt reconnection automatically
      eventSource.close();
    };

    // Cleanup function - closes EventSource on unmount or dependency change
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [url, onMessage, onError, enabled]);
}
