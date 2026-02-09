import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { toast } from "sonner";
import { handleAPIError, isNetworkError, isRetryWorthy } from "@/lib/api/errorHandler";

type QueryProviderProps = {
  children: React.ReactNode;
};

/**
 * QueryProvider - TanStack Query configuration provider
 *
 * Provides QueryClient instance to entire app with production-ready defaults:
 * - 5min staleTime: data considered fresh for 5 minutes
 * - 30min gcTime: inactive data removed from cache after 30 minutes
 * - Smart retry logic: network errors retry 3x, client errors no retry
 * - Refetch on network reconnect (not on window focus)
 * - Global error logging via QueryCache
 * - User-friendly Chinese toast notifications
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data considered fresh for 5 minutes (no refetch during this time)
            staleTime: 1000 * 60 * 5,
            // Inactive data garbage collected after 30 minutes
            gcTime: 1000 * 60 * 30,
            // Smart retry: network errors retry 3x, other errors no retry
            retry: (failureCount, error) => {
              // Network errors retry up to 3 times
              if (isNetworkError(error)) {
                return failureCount < 3;
              }

              // ApiError with retry-worthy status codes
              if ("status" in (error as any)) {
                const status = (error as any).status;
                if (isRetryWorthy(status)) {
                  return failureCount < 3;
                }
              }

              // Don't retry other errors
              return false;
            },
            // Exponential backoff: 1s, 2s, 4s, ... max 30s
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
            // Don't refetch when window regains focus
            refetchOnWindowFocus: false,
            // Refetch when network reconnects
            refetchOnReconnect: true,
          },
          mutations: {
            // Don't retry mutations by default (they might not be idempotent)
            retry: false,
          },
        },
        queryCache: new QueryCache({
          onError: (error) => {
            console.error("[Query Error]", error);
            const apiError = handleAPIError(error);
            toast.error(apiError.message);
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            console.error("[Mutation Error]", error);
            const apiError = handleAPIError(error);
            toast.error(apiError.message);
          },
          onSuccess: () => {
            // Optional: show success toast for all mutations
            // toast.success("操作成功");
          },
        }),
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools
        initialIsOpen={false}
        position="right"
        buttonPosition="bottom-right"
      />
    </QueryClientProvider>
  );
}
