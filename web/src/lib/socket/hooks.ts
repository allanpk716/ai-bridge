/**
 * Custom React hooks for Socket.IO
 *
 * Provides React-friendly API for Socket.IO with automatic cleanup
 * to prevent memory leaks from accumulated event listeners.
 */

import { useEffect, useState } from 'react';
import { getSocket } from './socket';
import type { ServerToClientEvents, ClientToServerEvents } from './events';
import type { Socket } from 'socket.io-client';

/**
 * Socket connection status hook
 *
 * Tracks Socket.IO connection state and provides socket instance.
 * Automatically subscribes to connect/disconnect events with cleanup.
 *
 * @returns Object with isConnected boolean and socket instance
 *
 * @example
 * function MyComponent() {
 *   const { isConnected, socket } = useSocket()
 *
 *   return <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
 * }
 */
export function useSocket(): {
  isConnected: boolean;
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
} {
  const [isConnected, setIsConnected] = useState(false);
  const socket = getSocket();

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Cleanup: Remove event listeners on unmount
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket]);

  return { isConnected, socket };
}

/**
 * Generic Socket.IO event listener hook
 *
 * Subscribes to a specific Socket.IO event with automatic cleanup.
 * Provides type-safe event handling through TypeScript generics.
 *
 * @param event - Event name from ServerToClientEvents
 * @param callback - Event handler function
 *
 * @example
 * function MessageList({ sessionId }) {
 *   useSocketEvent('message', (data) => {
 *     console.log('New message:', data.message)
 *   })
 *
 *   return <div>Messages...</div>
 * }
 *
 * @example
 * function SessionStatus({ sessionId }) {
 *   useSocketEvent('session:status', (data) => {
 *     if (data.sessionId === sessionId) {
 *       console.log('Status changed:', data.status)
 *     }
 *   })
 *
 *   return <div>Status: ...</div>
 * }
 */
export function useSocketEvent<K extends keyof ServerToClientEvents>(
  event: K,
  callback: ServerToClientEvents[K]
): void {
  const { socket } = useSocket();

  useEffect(() => {
    // Type assertion to handle Socket.IO's complex type system
    socket.on(event, callback as (...args: any[]) => void);

    // Cleanup: Remove event listener on unmount or when callback changes
    return () => {
      socket.off(event, callback as (...args: any[]) => void);
    };
  }, [socket, event, callback]);
}
