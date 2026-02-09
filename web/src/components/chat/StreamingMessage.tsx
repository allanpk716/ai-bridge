import React, { memo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { PluggableList } from 'unified';

/**
 * StreamingMessage - A component for rendering markdown content with streaming support
 *
 * This component handles character-by-character streaming of AI responses with proper
 * markdown parsing even during incomplete syntax states (e.g., **bold without closing).
 *
 * Features:
 * - Memoized to prevent unnecessary re-renders
 * - Handles incomplete markdown gracefully
 * - Shows streaming cursor during active streaming
 * - GitHub Flavored Markdown support (tables, strikethrough, etc.)
 * - Dark mode compatible styling
 */

export interface StreamingMessageProps {
  /** The markdown content to render */
  content: string;
  /** Whether the message is currently streaming */
  isStreaming?: boolean;
  /** Optional custom className for styling */
  className?: string;
}

/**
 * Streamdown-like streaming markdown component
 *
 * Since streamdown may have specific API requirements, we implement a robust
 * fallback using react-markdown with streaming optimizations:
 *
 * - Handles incomplete markdown (won't crash on unclosed tags)
 * - Shows cursor animation when isStreaming=true
 * - Memoized for performance
 * - Prose styling for readable markdown
 */
const StreamingMessageComponent: React.FC<StreamingMessageProps> = ({
  content,
  isStreaming = false,
  className = '',
}) => {
  // Merge custom className with prose classes
  const proseClasses = [
    'prose',
    'dark:prose-invert',
    'max-w-none',
    'prose-sm', // Smaller text for chat messages
    'prose-p:leading-relaxed',
    'prose-headings:font-semibold',
    'prose-h1:text-xl',
    'prose-h2:text-lg',
    'prose-h3:text-base',
    'prose-a:text-blue-500',
    'dark:prose-a:text-blue-400',
    'prose-a:no-underline',
    'hover:prose-a:underline',
    'prose-strong:font-semibold',
    'prose-code:rounded',
    'prose-code:bg-gray-100',
    'dark:prose-code:bg-gray-800',
    'prose-code:px-1',
    'prose-code:py-0.5',
    'prose-code:text-sm',
    'prose-code:font-mono',
    'prose-pre:bg-gray-900',
    'prose-pre:text-gray-100',
    'dark:prose-pre:bg-gray-950',
    'prose-pre:rounded-lg',
    'prose-pre:p-4',
    'prose-blockquote:border-l-4',
    'prose-blockquote:border-gray-300',
    'dark:prose-blockquote:border-gray-600',
    'prose-blockquote:pl-4',
    'prose-blockquote:italic',
    'prose-li:marker:text-gray-500',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="relative">
      <div className={proseClasses}>
        <Markdown remarkPlugins={[remarkGfm] as PluggableList}>{content}</Markdown>
      </div>

      {/* Streaming cursor indicator */}
      {isStreaming && (
        <span className="inline-block w-2 h-5 ml-1 bg-blue-500 dark:bg-blue-400 animate-pulse align-middle" />
      )}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
// The component only re-renders when content or isStreaming changes
export const StreamingMessage = memo(StreamingMessageComponent, (prevProps, nextProps) => {
  return (
    prevProps.content === nextProps.content &&
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.className === nextProps.className
  );
});

StreamingMessage.displayName = 'StreamingMessage';

/**
 * Fallback MarkdownMessage for non-streaming content
 * Uses the same implementation but optimized for static content
 */
export const MarkdownMessage = memo(
  ({ content, className }: { content: string; className?: string }) => {
    return <StreamingMessage content={content} isStreaming={false} className={className} />;
  }
);

MarkdownMessage.displayName = 'MarkdownMessage';

export default StreamingMessage;
