/**
 * Socket.IO Provider
 *
 * Initializes Socket.IO connection on app startup and provides
 * Socket context to all child components.
 *
 * Features:
 * - Initializes socket on mount (not in render)
 * - Auto-connects on app startup
 * - Cleans up connection on unmount
 */

import { useEffect } from 'react';
import type { PropsWithChildren } from 'react';
import { initSocket, connectSocket, disconnectSocket } from '@/lib/socket/socket';

/**
 * Socket.IO Provider component
 *
 * Initializes the Socket.IO singleton connection when mounted.
 * Should be rendered near the root of the app to ensure socket
 * is available to all components.
 *
 * @param children - Child components to render
 *
 * @example
 * function App() {
 *   return (
 *     <SocketProvider>
 *       <MyComponents />
 *     </SocketProvider>
 *   )
 * }
 */
export function SocketProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    // Initialize socket on mount (uses default API_BASE_URL from config)
    const socket = initSocket();

    // Auto-connect on app startup
    connectSocket();

    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, []);

  return <>{children}</>;
}
