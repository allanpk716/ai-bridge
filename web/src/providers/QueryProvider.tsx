import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { toast } from "sonner";

type QueryProviderProps = {
  children: React.ReactNode;
};

/**
 * QueryProvider - TanStack Query configuration provider
 *
 * Provides QueryClient instance to entire app with production-ready defaults:
 * - 5min staleTime: data considered fresh for 5 minutes
 * - 30min gcTime: inactive data removed from cache after 30 minutes
 * - 3 retries with exponential backoff for failed requests
 * - Refetch on network reconnect (not on window focus)
 * - Global error logging via QueryCache
 * - Toast notifications for query and mutation errors
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
            // Retry failed requests 3 times
            retry: 3,
            // Exponential backoff: 1s, 2s, 4s, ... max 30s
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
            // Don't refetch when window regains focus
            refetchOnWindowFocus: false,
            // Refetch when network reconnects
            refetchOnReconnect: true,
          },
        },
        queryCache: new QueryCache({
          onError: (error) => {
            console.error("[Query Error]", error);
            toast.error(`Request failed: ${error.message}`);
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            console.error("[Mutation Error]", error);
            toast.error(`Operation failed: ${error.message}`);
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
