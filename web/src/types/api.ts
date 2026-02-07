/**
 * API Type Definitions and Zod Schemas
 *
 * This file defines Zod schemas for runtime validation of API responses
 * and exports inferred TypeScript types. All API responses should be
 * validated against these schemas before use.
 *
 * References:
 * - CLAUDE.md > HAPI API Compatibility
 * - Backend API endpoints documentation
 */

import { z } from "zod";

/**
 * Session Schema
 *
 * Represents a Claude Code CLI session with its current status and metadata.
 *
 * @see CLAUDE.md > Session Management
 */
export const SessionSchema = z.object({
  id: z.string(),
  // Use flexible string validation to handle backend changes
  status: z.enum(["idle", "processing", "waiting", "stopped"]),
  createdAt: z.string(), // ISO datetime string
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Message Schema
 *
 * Represents a single message in a session with sequence number for incremental sync.
 * The seq field is monotonically increasing and used for pagination.
 *
 * @see CLAUDE.md > Incremental Message Sync
 */
export const MessageSchema = z.object({
  seq: z.number(), // Monotonically increasing sequence number
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  timestamp: z.string(), // ISO datetime string
});

/**
 * Permission Schema
 *
 * Represents a permission request from Claude Code CLI.
 * Users must approve permissions for file operations, command execution, etc.
 *
 * @see CLAUDE.md > Permissions
 */
export const PermissionSchema = z.object({
  requestId: z.string(),
  sessionId: z.string(),
  operation: z.string(),
  resources: z.array(z.string()),
  // Use flexible string validation to handle future scope types
  scope: z.enum(["file-read", "file-write", "command-exec", "network"]),
});

/**
 * Command Schema
 *
 * Represents a slash command that can be executed in a session.
 *
 * @see CLAUDE.md > Slash Commands
 */
export const CommandSchema = z.object({
  path: z.string(), // e.g., "/commit"
  category: z.string(),
  description: z.string(),
  examples: z.array(z.string()),
});

/**
 * Inferred TypeScript Types
 *
 * These types are automatically inferred from the Zod schemas above,
 * ensuring type safety and zero duplication.
 */
export type Session = z.infer<typeof SessionSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type Permission = z.infer<typeof PermissionSchema>;
export type Command = z.infer<typeof CommandSchema>;

/**
 * Helper type for API responses
 */
export type ApiResponse<T> = {
  data: T;
  error?: string;
};

/**
 * Pagination options for message fetching
 */
export type MessagePaginationOptions = {
  since?: number; // Get messages after this sequence number (incremental sync)
  before?: number; // Get messages before this sequence number (historical scroll)
  limit?: number; // Maximum number of messages to return
};

/**
 * Create session request payload
 */
export type CreateSessionRequest = {
  workingDir?: string;
  model?: string;
};

/**
 * Approve permission request payload
 */
export type ApprovePermissionRequest = {
  scope: string;
};

/**
 * Execute command request payload
 */
export type ExecuteCommandRequest = {
  path: string;
  args?: string[];
};
