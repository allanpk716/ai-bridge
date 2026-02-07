/**
 * Socket.IO event type definitions
 * Defines type-safe events for real-time communication with AI-Bridge backend
 */

// Message type (from CLAUDE.md - HAPI API compatibility)
export interface Message {
  seq: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// Permission type (from CLAUDE.md)
export interface Permission {
  requestId: string;
  type: string;
  description: string;
  createdAt: string;
}

/**
 * Server-to-client events
 * Events that the backend sends to the frontend
 */
export interface ServerToClientEvents {
  // Real-time message updates
  message: (data: { sessionId: string; message: Message }) => void;

  // Session status changes
  'session:status': (data: { sessionId: string; status: string }) => void;

  // Permission requests
  'permission:request': (data: { sessionId: string; permission: Permission }) => void;

  // Connection events (built-in Socket.IO)
  connect: () => void;
  disconnect: (reason: string) => void;
  error: (error: Error) => void;
}

/**
 * Client-to-server events
 * Events that the frontend sends to the backend
 */
export interface ClientToServerEvents {
  // Subscribe to session updates
  subscribe: (sessionId: string) => void;

  // Unsubscribe from session
  unsubscribe: (sessionId: string) => void;
}
