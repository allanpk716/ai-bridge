/**
 * Socket.IO Client Singleton Manager
 *
 * ES6 module singleton pattern ensures only one Socket.IO instance exists.
 * Provides type-safe event handling through TypeScript generics.
 *
 * Features:
 * - Auto-derive WebSocket URL from HTTP URL (http:// -> ws://)
 * - Automatic reconnection with exponential backoff
 * - Type-safe event handling
 * - Connection lifecycle management
 */

import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from './events';
import { API_BASE_URL } from '@/lib/api/client';

/**
 * Module-level socket instance (ES6 singleton pattern)
 * Using module-level variable (not class) as per modern JavaScript best practices
 */
let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

/**
 * Initialize Socket.IO client singleton
 *
 * Creates a new Socket.IO instance if one doesn't exist or is disconnected.
 * Auto-derives WebSocket URL from HTTP API base URL.
 *
 * @param url - Optional HTTP URL (defaults to API_BASE_URL from config)
 * @returns Socket.IO instance
 *
 * @example
 * const socket = initSocket() // Uses default API_BASE_URL
 * const socket = initSocket('http://localhost:8080') // Custom URL
 */
export function initSocket(url?: string): Socket<ServerToClientEvents, ClientToServerEvents> {
  // Return existing socket if already connected
  if (socket?.connected) {
    return socket;
  }

  // Use provided URL or default to API base URL
  const httpUrl = url || API_BASE_URL;

  // Auto-derive WebSocket URL from HTTP URL
  // http://localhost:8080 -> ws://localhost:8080
  // https://api.example.com -> wss://api.example.com
  const wsUrl = httpUrl.replace(/^http/, 'ws');

  // Create new Socket.IO instance
  socket = io(wsUrl, {
    autoConnect: false, // Connect manually after setup
    reconnection: true,
    reconnectionDelay: 1000, // Start with 1 second delay
    reconnectionDelayMax: 30000, // Max 30 seconds between attempts
    reconnectionAttempts: 10, // Stop after 10 attempts
    timeout: 3000, // Initial connection timeout (3 seconds)
  });

  return socket;
}

/**
 * Get the existing Socket.IO instance
 *
 * @returns Socket.IO instance
 * @throws Error if socket not initialized
 *
 * @example
 * const socket = getSocket()
 * socket.emit('subscribe', 'session-123')
 */
export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    throw new Error('Socket not initialized. Call initSocket() first.');
  }
  return socket;
}

/**
 * Connect to WebSocket server
 *
 * Initiates connection if not already connected.
 * Safe to call multiple times (idempotent).
 *
 * @example
 * connectSocket()
 */
export function connectSocket(): void {
  const socket = getSocket();
  if (!socket.connected) {
    socket.connect();
  }
}

/**
 * Disconnect from WebSocket server
 *
 * Closes the WebSocket connection.
 *
 * @example
 * disconnectSocket()
 */
export function disconnectSocket(): void {
  const socket = getSocket();
  socket.disconnect();
}
