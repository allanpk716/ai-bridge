/**
 * Chat Components Barrel Export
 *
 * Provides clean import paths for chat-related components and hooks.
 *
 * @example
 * import ChatMessageList from '@/components/chat';
 * import { ChatInput, StreamingMessage, CodeBlock, useChatMessages } from '@/components/chat';
 */

export { default as ChatMessageList } from "./ChatMessageList";
export { default } from "./ChatMessageList";
export { ChatInput } from "./ChatInput";
export { StreamingMessage } from "./StreamingMessage";
export { CodeBlock } from "./CodeBlock";
export { StreamingIndicator } from "./StreamingIndicator";
export { default as TypingIndicator } from "./TypingIndicator";
export { StreamingErrorCard } from "./StreamingErrorCard";

// Re-export chat-related hook for convenience
export { useChatMessages } from "@/hooks/useChatMessages";
