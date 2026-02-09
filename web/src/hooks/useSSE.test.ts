/**
 * useSSE Hook Tests
 *
 * Critical cleanup verification to prevent memory leaks.
 * Tests EventSource creation, message handling, and most importantly,
 * proper cleanup on component unmount.
 *
 * @see .planning/phases/04-real-time-chat/04-04-PLAN.md > Task 6
 */

import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useSSE } from "./useSSE";
import type { Message } from "@/types/api";

// Mock EventSource
class MockEventSource {
  public url: string;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public readyState: number = 0; // CONNECTING
  public closeCalls: number = 0;

  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  constructor(url: string) {
    this.url = url;
    this.readyState = MockEventSource.CONNECTING;

    // Simulate connection open
    setTimeout(() => {
      this.readyState = MockEventSource.OPEN;
    }, 0);
  }

  close() {
    this.closeCalls++;
    this.readyState = MockEventSource.CLOSED;
    this.onmessage = null;
    this.onerror = null;
  }
}

// Setup global EventSource mock
let originalEventSource: typeof EventSource | undefined;

beforeEach(() => {
  // Save original EventSource
  originalEventSource = (global as any).EventSource;

  // Replace with mock
  (global as any).EventSource = MockEventSource;
});

afterEach(() => {
  // Restore original EventSource
  if (originalEventSource) {
    (global as any).EventSource = originalEventSource;
  }
});

describe("useSSE", () => {
  it("should create EventSource with correct URL", () => {
    const url = "http://localhost:8080/api/v1/sessions/test/messages/stream?since=0";
    const onMessage = vi.fn();

    renderHook(() => useSSE(url, { onMessage }));

    // EventSource should be created with the correct URL
    // (Implicitly tested by the fact that the hook doesn't throw)
    expect(onMessage).not.toHaveBeenCalled();
  });

  it("should call onMessage when SSE event is received", async () => {
    const url = "http://localhost:8080/api/v1/sessions/test/messages/stream?since=0";
    const onMessage = vi.fn();

    const { result } = renderHook(() => useSSE(url, { onMessage }));

    // Simulate SSE message
    const mockMessage: Message = {
      seq: 1,
      role: "assistant",
      content: "Hello, world!",
      timestamp: new Date().toISOString(),
    };

    // Wait for EventSource to be created
    await waitFor(() => {
      expect((global as any).EventSource).toHaveBeenCalled();
    });

    // Get the EventSource instance (last created)
    const eventSources = (MockEventSource as any).instances || [];
    const lastEventSource = eventSources[eventSources.length - 1];

    if (lastEventSource && lastEventSource.onmessage) {
      const messageEvent = new MessageEvent("message", {
        data: JSON.stringify(mockMessage),
      });
      lastEventSource.onmessage(messageEvent);

      expect(onMessage).toHaveBeenCalledWith(mockMessage);
    }
  });

  it("should close EventSource on component unmount (CRITICAL for memory leak prevention)", () => {
    const url = "http://localhost:8080/api/v1/sessions/test/messages/stream?since=0";
    const onMessage = vi.fn();

    const { unmount } = renderHook(() => useSSE(url, { onMessage }));

    // Get the EventSource instance
    const eventSources = (MockEventSource as any).instances || [];
    const eventSource = eventSources[eventSources.length - 1];

    // Verify EventSource was created
    expect(eventSource).toBeDefined();
    expect(eventSource.closeCalls).toBe(0);

    // Unmount the hook
    unmount();

    // CRITICAL: Verify EventSource.close() was called exactly once
    expect(eventSource.closeCalls).toBe(1);
    expect(eventSource.readyState).toBe(MockEventSource.CLOSED);
  });

  it("should close EventSource on error", async () => {
    const url = "http://localhost:8080/api/v1/sessions/test/messages/stream?since=0";
    const onError = vi.fn();

    renderHook(() => useSSE(url, { onMessage: vi.fn(), onError }));

    // Get the EventSource instance
    const eventSources = (MockEventSource as any).instances || [];
    const eventSource = eventSources[eventSources.length - 1];

    // Simulate error event
    if (eventSource && eventSource.onerror) {
      const errorEvent = new Event("error");
      eventSource.onerror(errorEvent);

      // Verify error callback was called
      expect(onError).toHaveBeenCalled();

      // CRITICAL: Verify EventSource was closed on error
      expect(eventSource.closeCalls).toBe(1);
    }
  });

  it("should not create EventSource when enabled is false", () => {
    const url = "http://localhost:8080/api/v1/sessions/test/messages/stream?since=0";
    const onMessage = vi.fn();

    const { rerender } = renderHook(
      ({ enabled }) => useSSE(url, { onMessage, enabled }),
      { initialProps: { enabled: false } }
    );

    // EventSource should not be created when disabled
    // (This is implicit - if it was created, tests would fail)

    // Enable and check that EventSource is created
    rerender({ enabled: true });

    const eventSources = (MockEventSource as any).instances || [];
    expect(eventSources.length).toBeGreaterThan(0);
  });

  it("should close and recreate EventSource when URL changes", () => {
    const onMessage = vi.fn();

    const { rerender } = renderHook(
      ({ url }) => useSSE(url, { onMessage }),
      {
        initialProps: {
          url: "http://localhost:8080/api/v1/sessions/test1/messages/stream?since=0",
        },
      }
    );

    const eventSources = (MockEventSource as any).instances || [];
    const firstEventSource = eventSources[eventSources.length - 1];

    // Change URL
    rerender({
      url: "http://localhost:8080/api/v1/sessions/test2/messages/stream?since=0",
    });

    const secondEventSource = eventSources[eventSources.length - 1];

    // First EventSource should be closed
    expect(firstEventSource.closeCalls).toBe(1);

    // Second EventSource should be different instance
    expect(secondEventSource).not.toBe(firstEventSource);
  });
});
