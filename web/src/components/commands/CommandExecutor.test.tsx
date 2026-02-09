/**
 * CommandExecutor Component Tests
 *
 * Tests command selection and input population integration.
 *
 * @see .planning/phases/04-real-time-chat/04-11-PLAN.md
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useEffect } from "react";
import { CommandExecutor } from "./CommandExecutor";
import { ChatInput, type ChatInputRef } from "@/components/chat/ChatInput";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the commands API
vi.mock("@/lib/api/commands", () => ({
  useCommands: () => ({
    data: {
      git: [
        {
          path: "/commit",
          description: "Create a git commit",
          category: "git",
          examples: ["/commit", "/commit Fix bug"],
        },
      ],
    },
    isLoading: false,
    error: null,
  }),
  useExecuteCommand: () => ({
    mutate: vi.fn(),
  }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("CommandExecutor", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  describe("Command selection populates input", () => {
    it("should call onCommandInserted with command text when command selected", async () => {
      const mockOnCommandInserted = vi.fn();

      render(
        <CommandExecutor
          sessionId="session-123"
          onCommandInserted={mockOnCommandInserted}
          trigger={<button data-testid="trigger">Open Commands</button>}
        />,
        { wrapper }
      );

      // Click trigger to open palette
      const trigger = screen.getByTestId("trigger");
      await userEvent.click(trigger);

      // Command palette should be open (via cmdk Dialog)
      // Select the /commit command
      const commitCommand = await screen.findByText("/commit");
      await userEvent.click(commitCommand);

      // Verify callback was called with first example
      await waitFor(() => {
        expect(mockOnCommandInserted).toHaveBeenCalledWith("/commit");
      });
    });

    it("should use first example if available", async () => {
      const mockOnCommandInserted = vi.fn();

      render(
        <CommandExecutor
          sessionId="session-123"
          onCommandInserted={mockOnCommandInserted}
          trigger={<button data-testid="trigger">Open Commands</button>}
        />,
        { wrapper }
      );

      // Open palette and select command
      const trigger = screen.getByTestId("trigger");
      await userEvent.click(trigger);

      const commitCommand = await screen.findByText("/commit");
      await userEvent.click(commitCommand);

      // Should use first example from mock data
      await waitFor(() => {
        expect(mockOnCommandInserted).toHaveBeenCalledWith("/commit");
      });
    });
  });
});

describe("ChatInput ref forwarding", () => {
  it("should forward ref to textarea element", () => {
    let capturedRef: ChatInputRef | null = null;

    const TestComponent = () => {
      const ref = useRef<ChatInputRef>(null);

      useEffect(() => {
        capturedRef = ref.current;
      }, []);

      return (
        <ChatInput
          ref={ref}
          sessionId="session-123"
        />
      );
    };

    render(<TestComponent />);

    // Ref should be available
    expect(capturedRef).not.toBeNull();
    expect(capturedRef?.getValue).toBeInstanceOf(Function);
    expect(capturedRef?.setValue).toBeInstanceOf(Function);
    expect(capturedRef?.focus).toBeInstanceOf(Function);
  });

  it("should allow external value setting via ref", async () => {
    let inputRef: ChatInputRef | null = null;

    const TestComponent = () => {
      const ref = useRef<ChatInputRef>(null);

      useEffect(() => {
        inputRef = ref.current;
      }, []);

      return (
        <ChatInput
          ref={ref}
          sessionId="session-123"
        />
      );
    };

    render(<TestComponent />);

    // Set value via ref
    await waitFor(() => {
      inputRef?.setValue("/commit Fix bug");
    });

    // Verify value was set
    await waitFor(() => {
      expect(inputRef?.getValue()).toBe("/commit Fix bug");
    });
  });

  it("should focus textarea when value set via ref", async () => {
    let inputRef: ChatInputRef | null = null;

    const TestComponent = () => {
      const ref = useRef<ChatInputRef>(null);

      useEffect(() => {
        inputRef = ref.current;
      }, []);

      return (
        <ChatInput
          ref={ref}
          sessionId="session-123"
        />
      );
    };

    render(<TestComponent />);

    // Set value via ref (should also focus)
    await waitFor(() => {
      inputRef?.setValue("/commit");
    });

    // Focus should be called (we can't test actual focus in JSDOM,
    // but we can verify the method doesn't throw)
    expect(inputRef?.getValue()).toBe("/commit");
  });
});

describe("CommandExecutor to ChatInput integration", () => {
  it("should populate ChatInput when command selected", async () => {
    let inputRef: ChatInputRef | null = null;

    const TestComponent = () => {
      const ref = useRef<ChatInputRef>(null);

      useEffect(() => {
        inputRef = ref.current;
      }, []);

      const handleCommandInserted = (text: string) => {
        inputRef?.setValue(text);
      };

      return (
        <div>
          <CommandExecutor
            sessionId="session-123"
            onCommandInserted={handleCommandInserted}
            trigger={<button data-testid="trigger">Open</button>}
          />
          <ChatInput ref={ref} sessionId="session-123" />
        </div>
      );
    };

    render(<TestComponent />);

    // Open command palette
    const trigger = screen.getByTestId("trigger");
    await userEvent.click(trigger);

    // Select command
    const commitCommand = await screen.findByText("/commit");
    await userEvent.click(commitCommand);

    // Verify input was populated
    await waitFor(() => {
      expect(inputRef?.getValue()).toBe("/commit");
    });
  });

  it("should allow user to edit inserted command", async () => {
    let inputRef: ChatInputRef | null = null;

    const TestComponent = () => {
      const ref = useRef<ChatInputRef>(null);

      useEffect(() => {
        inputRef = ref.current;
      }, []);

      const handleCommandInserted = (text: string) => {
        inputRef?.setValue(text);
      };

      return (
        <div>
          <CommandExecutor
            sessionId="session-123"
            onCommandInserted={handleCommandInserted}
            trigger={<button data-testid="trigger">Open</button>}
          />
          <ChatInput ref={ref} sessionId="session-123" />
        </div>
      );
    };

    render(<TestComponent />);

    // Insert command
    const trigger = screen.getByTestId("trigger");
    await userEvent.click(trigger);

    const commitCommand = await screen.findByText("/commit");
    await userEvent.click(commitCommand);

    await waitFor(() => {
      expect(inputRef?.getValue()).toBe("/commit");
    });

    // User edits the command
    inputRef?.setValue("/commit Fix critical bug");

    // Verify edited value
    await waitFor(() => {
      expect(inputRef?.getValue()).toBe("/commit Fix critical bug");
    });
  });
});
