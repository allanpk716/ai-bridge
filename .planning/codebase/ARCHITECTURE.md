# Architecture

**Analysis Date:** 2026-02-05

## Pattern Overview

**Overall:** Multi-layered microservice architecture with process pooling

**Key Characteristics:**
- Event-driven messaging with subscriber patterns
- Process pooling for resource efficiency
- Incremental message synchronization for performance
- RESTful API with WebSocket support
- SQLite persistence with WAL mode

## Layers

**API Layer (`internal/api/`):**
- Purpose: HTTP request handling and routing
- Location: `C:\WorkSpace\ai-bridge\internal\api\`
- Contains: Gin router, middleware, HTTP handlers
- Depends on: Session manager, WebSocket server
- Used by: External HTTP clients

**WebSocket Layer (`internal/websocket/`):**
- Purpose: Real-time bidirectional communication
- Location: `C:\WorkSpace\ai-bridge\internal\websocket\websocket.go`
- Contains: Socket.IO compatible server (TODO implementation)
- Depends on: Session manager
- Used by: Web clients for real-time updates

**Session Management Layer (`internal/session/`):**
- Purpose: Session lifecycle and message management
- Location: `C:\WorkSpace\ai-bridge\internal\session\`
- Contains: Session manager, session instances, message store
- Depends on: Process pool, SQLite store
- Used by: API layer, WebSocket layer

**Process Pool Layer (`internal/pool/`):**
- Purpose: Claude CLI process lifecycle management
- Location: `C:\WorkSpace\ai-bridge\internal\pool\`
- Contains: Process pool, instance management
- Depends on: Claude CLI wrapper
- Used by: Session manager

**Claude Wrapper Layer (`internal/claude/`):**
- Purpose: Claude CLI process communication
- Location: `C:\WorkSpace\ai-bridge\internal\claude\`
- Contains: Process management, message parsing
- Depends on: stdio communication with Claude CLI
- Used by: Process pool

**Protocol Layer (`pkg/protocol/`):**
- Purpose: Type definitions and message structures
- Location: `C:\WorkSpace\ai-bridge\pkg\protocol\`
- Contains: Message types, session states, protocol interfaces
- Depends on: None (shared package)
- Used by: All other layers

## Data Flow

**Message Processing Flow:**

1. **Client Request** → HTTP API (`/api/v1/sessions/:sessionId/messages`)
2. **Session Manager** → Acquires process from pool
3. **Process Instance** → Sends message to Claude CLI via stdio
4. **Claude CLI** → Processes and returns JSON response
5. **Message Parser** → Converts JSON to protocol.Message
6. **Session Instance** → Handles message (store, notify subscribers)
7. **Database** → Async persistence with batching
8. **Subscribers** → Real-time notifications via channels
9. **Client Response** → HTTP response or SSE stream

**State Management:**
- **Session States:** idle → processing → waiting → stopped
- **Process States:** available → acquired → released → cleaned up
- **Message States:** received → processed → persisted → notified

## Key Abstractions

**Session Abstraction:**
- Purpose: Represents a conversation with Claude CLI
- Examples: `C:\WorkSpace\ai-bridge\internal\session\session.go`
- Pattern: Context-based lifecycle with subscriber pattern

**Process Pool Abstraction:**
- Purpose: Manages reusable Claude CLI instances
- Examples: `C:\WorkSpace\ai-bridge\internal\pool\pool.go`
- Pattern: Object pool with LIFO acquisition

**Message Filter Abstraction:**
- Purpose: Enables efficient message subscription
- Examples: `C:\WorkSpace\ai-bridge\internal\session\session.go:360`
- Pattern: Publisher-subscriber with filtering

**Incremental Sync Abstraction:**
- Purpose: Optimizes large message history handling
- Pattern: Sequence-based pagination with since/before parameters

## Entry Points

**Main Application:**
- Location: `C:\WorkSpace\ai-bridge\cmd\ai-bridge\main.go`
- Triggers: Command line execution
- Responsibilities: Initialize all components, start HTTP server, handle shutdown

**HTTP Server:**
- Location: `C:\WorkSpace\ai-bridge\internal\api\server.go`
- Triggers: HTTP requests
- Responsibilities: Route requests, middleware, CORS handling

**Health Checker:**
- Location: `C:\WorkSpace\ai-bridge\internal\health\`
- Triggers: Periodic health checks
- Responsibilities: Monitor system health, generate alerts

**Command Discovery:**
- Location: `C:\WorkSpace\ai-bridge\internal\commands\`
- Triggers: API requests for commands
- Responsibilities: Find and parse slash commands from CLI, user, and project sources

## Error Handling

**Strategy:** Structured error handling with context propagation

**Patterns:**
- Context-based cancellation throughout the call stack
- Error logging with structured fields using `github.com/WQGroup/logger`
- Graceful degradation (e.g., drop messages when subscribers full)
- Process pool cleanup on errors

**Error Categories:**
- Process communication errors (retries, pool cleanup)
- Database errors (transaction retries, connection pooling)
- Validation errors (input parsing, permission checks)
- Resource errors (pool exhaustion, timeout handling)

## Cross-Cutting Concerns

**Logging:**
- Framework: `github.com/WQGroup/logger` (based on logrus)
- Pattern: Structured logging with correlation IDs
- Files: Automatic rotation, configurable levels

**Configuration:**
- Pattern: Centralized config with environment variable overrides
- Files: YAML-based configuration with validation
- Sources: `configs/config.yaml.example`

**Database:**
- Pattern: GORM with SQLite WAL mode
- Optimizations: Connection pooling, batch writes, indexed queries
- Location: `./data/sessions.db`

**CORS:**
- Pattern: Configurable origin-based allowlist
- Implementation: Gin middleware with dynamic header setting
- Support: WebSocket and HTTP requests

---

*Architecture analysis: 2026-02-05*