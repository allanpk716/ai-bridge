/**
 * TypingIndicator Component
 *
 * Animated typing indicator with three bouncing dots.
 * Shows when AI is thinking or generating response.
 *
 * Features:
 * - Three dots with staggered bounce animation
 * - Compact size (16px dots)
 * - Muted color for subtle appearance
 *
 * @see .planning/phases/04-real-time-chat/04-06-PLAN.md > Task 1
 */

import { clsx } from "clsx";

export interface TypingIndicatorProps {
  /** Optional CSS class name for styling */
  className?: string;
}

/**
 * Typing indicator with three animated dots
 *
 * Animation: Staggered bounce effect with 150ms delays
 * - Dot 1: 0ms delay
 * - Dot 2: 150ms delay
 * - Dot 3: 300ms delay
 */
export default function TypingIndicator({
  className,
}: TypingIndicatorProps) {
  return (
    <div className={clsx("flex items-center gap-1", className)}>
      {/* Dot 1 - no delay */}
      <div className="typing-dot" style={{ animationDelay: "0ms" }} />

      {/* Dot 2 - 150ms delay */}
      <div className="typing-dot" style={{ animationDelay: "150ms" }} />

      {/* Dot 3 - 300ms delay */}
      <div className="typing-dot" style={{ animationDelay: "300ms" }} />

      <style>{`
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-4px);
          }
        }

        .typing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: hsl(var(--muted-foreground));
          animation: typing 1.4s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
