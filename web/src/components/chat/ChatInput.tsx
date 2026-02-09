/**
 * ChatInput Component
 *
 * Provides a textarea input for typing messages with a send button.
 * Supports keyboard shortcuts (Ctrl+Enter to send, Shift+Enter for newline)
 * and integrates with the messages API for sending.
 *
 * Features:
 * - Multi-line textarea with auto-resize
 * - Ctrl+Enter (Mac: Cmd+Enter) to send, Shift+Enter for new line
 * - Send button disabled when empty or sending
 * - Loading state during message sending
 * - Clears input after successful send
 *
 * @example
 * ```tsx
 * <ChatInput
 *   sessionId="session-123"
 *   onSent={() => console.log('Message sent')}
 *   placeholder="Type a message..."
 * />
 * ```
 */

import { useState, useCallback, useRef, forwardRef, useImperativeHandle, type KeyboardEvent, type ChangeEvent } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSendMessage } from "@/lib/api/messages";
import { getModifierKey } from "@/features/keyboard/shortcuts";

export interface ChatInputProps {
  /**
   * The session ID to send messages to
   */
  sessionId: string;

  /**
   * Optional callback after successful message send
   */
  onSent?: () => void;

  /**
   * Optional external disable flag
   */
  disabled?: boolean;

  /**
   * Optional custom placeholder text
   * @default "Type a message... (Ctrl+Enter to send)"
   */
  placeholder?: string;
}

/**
 * Ref interface for ChatInput
 * Allows parent components to control the textarea
 */
export interface ChatInputRef {
  /**
   * Sets the textarea value and focuses it
   */
  setValue: (value: string) => void;
  /**
   * Gets the current textarea value
   */
  getValue: () => string;
  /**
   * Focuses the textarea
   */
  focus: () => void;
}

/**
 * ChatInput - Message input component with send functionality
 * Forwarded ref allows external control of textarea value and focus
 */
export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(function ChatInput(
  {
    sessionId,
    onSent,
    disabled = false,
    placeholder = "Type a message... (Ctrl+Enter to send)",
  }: ChatInputProps,
  ref
) {
  const [messageText, setMessageText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sendMessageMutation = useSendMessage(sessionId);

  /**
   * Expose methods to parent component via ref
   */
  useImperativeHandle(ref, () => ({
    setValue: (value: string) => {
      setMessageText(value);
      // Focus textarea after setting value
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          // Place cursor at end of inserted text
          textareaRef.current.setSelectionRange(value.length, value.length);
        }
      }, 0);
    },
    getValue: () => messageText,
    focus: () => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    },
  }));

  /**
   * Checks if send should be disabled
   */
  const isSendDisabled =
    disabled ||
    messageText.trim().length === 0 ||
    sendMessageMutation.isPending;

  /**
   * Handles textarea input changes
   */
  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
  }, []);

  /**
   * Handles keyboard shortcuts
   * - Ctrl+Enter / Cmd+Enter: Send message
   * - Shift+Enter: New line
   * - Enter: New line (default behavior)
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSend();
      }
      // Shift+Enter and plain Enter use default behavior (new line)
    },
    [messageText]
  );

  /**
   * Sends the message to the backend API
   */
  const handleSend = useCallback(() => {
    const trimmedContent = messageText.trim();

    if (trimmedContent.length === 0 || sendMessageMutation.isPending) {
      return;
    }

    sendMessageMutation.mutate(
      { content: trimmedContent },
      {
        onSuccess: () => {
          // Clear textarea on success
          setMessageText("");
          // Call optional callback
          onSent?.();
        },
      }
    );
  }, [messageText, sendMessageMutation, onSent]);

  /**
   * Calculates textarea rows based on content length
   * Min 1 row, max 10 rows
   */
  const calculateRows = useCallback((text: string): number => {
    const lineCount = text.split("\n").length;
    return Math.min(Math.max(lineCount, 1), 10);
  }, []);

  return (
    <div className="flex flex-row gap-2 items-end border-t bg-background p-4" role="region" aria-label="消息输入">
      <textarea
        ref={textareaRef}
        value={messageText}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="消息输入框"
        aria-describedby="chat-input-help"
        disabled={disabled}
        rows={calculateRows(messageText)}
        className="flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[36px] max-h-[240px]"
        style={{
          overflowY: calculateRows(messageText) >= 10 ? "auto" : "hidden",
        }}
      />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleSend}
              disabled={isSendDisabled}
              size="icon"
              className="h-9 w-9 shrink-0"
              aria-label="发送消息"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>发送消息 ({getModifierKey()}+Enter)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <span id="chat-input-help" className="sr-only">
        输入消息后按 {getModifierKey()}+Enter 发送,Shift+Enter 换行
      </span>
    </div>
  );
});
