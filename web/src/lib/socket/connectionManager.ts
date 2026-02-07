/**
 * Socket.IO Connection State Manager
 *
 * Integrates Socket.IO connection events with Zustand store.
 * Automatically tracks connection status and updates UI state.
 *
 * Listens to Socket.IO v4 events:
 * - connect: Successfully connected to server
 * - disconnect: Disconnected from server
 * - reconnect_attempt: Trying to reconnect (with attempt number)
 * - reconnect: Successfully reconnected
 * - reconnect_failed: All reconnection attempts exhausted
 * - error: Socket error occurred
 *
 * Reference: Socket.IO v4 documentation for Manager vs Socket events
 */

import { getSocket } from './socket';
import { useConnectionStore } from '@/lib/stores/connection';

/**
 * Initialize connection event listeners
 *
 * Attaches listeners to both socket.io (Manager) and socket instance:
 * - socket.io for reconnection events (Manager level)
 * - socket for connect/disconnect events (Socket level)
 *
 * This ensures all connection state changes are tracked and reflected in UI.
 *
 * @example
 * initConnectionManager() // Call once in SocketProvider
 */
export function initConnectionManager(): void {
  const socket = getSocket();
  const setStatus = useConnectionStore.getState().setStatus;

  // Manager-level events (socket.io)
  // These track reconnection flow across multiple attempts

  socket.io.on('reconnect', (attemptNumber: number) => {
    console.log(`[Connection] Reconnected after ${attemptNumber} attempts`);
    setStatus('online');
  });

  socket.io.on('reconnect_attempt', (attemptNumber: number) => {
    console.log(`[Connection] Reconnection attempt ${attemptNumber}`);
    setStatus('reconnecting');
  });

  socket.io.on('reconnect_failed', () => {
    console.error('[Connection] Reconnection failed after 10 attempts');
    setStatus('error');
  });

  socket.io.on('error', (error: Error) => {
    console.error('[Connection] Socket error:', error);
    setStatus('error');
  });

  // Socket-level events (socket)
  // These track individual connection lifecycle

  socket.on('connect', () => {
    console.log('[Connection] Connected to server');
    setStatus('online');
  });

  socket.on('disconnect', (reason: string) => {
    console.log('[Connection] Disconnected:', reason);
    setStatus('offline');
  });
}
