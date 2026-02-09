/**
 * useRetry Hook
 *
 * Provides automatic retry functionality with configurable attempts and delay.
 * Shows toast notifications for retry attempts.
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";

export interface UseRetryOptions {
  maxAttempts?: number;
  delay?: number;
  onMaxAttemptsReached?: () => void;
}

/**
 * Retry hook for automatic retry with delay
 *
 * @param fn - Async function to retry
 * @param options - Retry options
 * @returns Object with retry function, attempt count, and loading state
 *
 * @example
 * ```tsx
 * const { retry, attempt, isLoading } = useRetry(
 *   async () => {
 *     await sendMessage(message);
 *   },
 *   { maxAttempts: 3, delay: 1000 }
 * );
 * ```
 */
export function useRetry<T extends () => Promise<void>>(
  fn: T,
  options: UseRetryOptions = {}
) {
  const [attempt, setAttempt] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const maxAttempts = options.maxAttempts ?? 3;
  const delay = options.delay ?? 1000;

  const retry = useCallback(async () => {
    setIsLoading(true);
    try {
      await fn();
      setAttempt(0);
    } catch (error) {
      const newAttempt = attempt + 1;
      setAttempt(newAttempt);

      if (newAttempt < maxAttempts) {
        // Show retry toast
        toast.error(
          `操作失败,${Math.floor(delay / 1000)}秒后自动重试 (${newAttempt}/${maxAttempts})`
        );

        // Auto retry after delay
        setTimeout(() => {
          // Recursively call retry with new attempt count
          retry().catch(() => {
            // Error already handled above
          });
        }, delay);
      } else {
        // Max attempts reached
        toast.error("操作失败,请手动重试");
        options.onMaxAttemptsReached?.();
      }
    } finally {
      setIsLoading(false);
    }
  }, [fn, attempt, maxAttempts, delay, options]);

  return { retry, attempt, isLoading };
}

/**
 * Manual retry hook (no automatic retry)
 *
 * @param fn - Async function to retry
 * @param options - Retry options
 * @returns Object with retry function and loading state
 *
 * @example
 * ```tsx
 * const { retry, isLoading } = useManualRetry(
 *   async () => {
 *     await fetchData();
 *   }
 * );
 *
 * // User clicks retry button
 * <Button onClick={retry} disabled={isLoading}>
 *   重试
 * </Button>
 * ```
 */
export function useManualRetry<T extends () => Promise<void>>(
  fn: T,
  options: Omit<UseRetryOptions, "maxAttempts" | "delay"> = {}
) {
  const [attempt, setAttempt] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const retry = useCallback(async () => {
    setIsLoading(true);
    try {
      await fn();
      setAttempt(0);
      toast.success("操作成功");
    } catch (error) {
      const newAttempt = attempt + 1;
      setAttempt(newAttempt);
      const apiError = error instanceof Error ? error.message : "操作失败";
      toast.error(apiError);
      options.onMaxAttemptsReached?.();
    } finally {
      setIsLoading(false);
    }
  }, [fn, attempt, options]);

  return { retry, attempt, isLoading };
}
