# Codebase Structure

**Analysis Date:** 2026-02-05

## Directory Layout

```
C:\WorkSpace\ai-bridge\
├── cmd/ai-bridge/          # Application entry point
├── internal/               # Internal application code
│   ├── api/               # HTTP API layer
│   ├── claude/            # Claude CLI wrapper
│   ├── commands/          # Slash command discovery
│   ├── config/            # Configuration management
│   ├── health/            # Health monitoring
│   ├── pool/              # Process pool management
│   ├── session/          # Session management
│   └── websocket/         # WebSocket server
├── pkg/protocol/          # Shared protocol types
├── configs/               # Configuration files
├── data/                 # Runtime data (sessions, logs)
├── docs/                 # Documentation
├── scripts/               # Utility scripts
├── tests/                 # Test files
├── tmp/                  # Temporary files
└── deployments/          # Deployment configurations
```

## Directory Purposes

**`cmd/ai-bridge/`:**
- Purpose: Application entry point and main orchestration
- Contains: `main.go` - Initializes all components, starts server
- Key files: `C:\WorkSpace\ai-bridge\cmd\ai-bridge\main.go`

**`internal/api/`:**
- Purpose: HTTP API server and handlers
- Contains: Gin router, middleware, HTTP request handlers
- Key files: `C:\WorkSpace\ai-bridge\internal\api\server.go`
- Key subdirectories:
  - `handlers/` - Route handlers for sessions, messages, permissions, commands

**`internal/claude/`:**
- Purpose: Claude CLI process wrapper and communication
- Contains: Process management, stdio communication, message parsing
- Key files: `C:\WorkSpace\ai-bridge\internal\claude\message.go`
- Note: Core process management in separate files not visible in scan

**`internal/pool/`:**
- Purpose: Claude CLI process instance pooling and lifecycle
- Contains: Pool management, instance acquisition/release
- Key files: `C:\WorkSpace\ai-bridge\internal\pool\pool.go`
- Key subdirectories:
  - `instance.go` - Individual process instance management

**`internal/session/`:**
- Purpose: Session lifecycle and message management
- Contains: Session manager, session instances, message persistence
- Key files: `C:\WorkSpace\ai-bridge\internal\session\manager.go`
- Key subdirectories:
  - `session.go` - Session implementation with incremental sync
  - `store.go` - SQLite persistence with WAL mode

**`internal/commands/`:**
- Purpose: Slash command discovery and execution
- Contains: Command discovery from CLI, user, and project sources
- Key files:
  - `discover.go` - Command discovery implementation
  - `parser.go` - Command parsing
  - `commands.go` - Command structures

**`internal/config/`:**
- Purpose: Configuration management and validation
- Contains: Configuration structures and loading
- Key files: Configuration definitions in internal package

**`internal/health/`:**
- Purpose: Health monitoring and alerting
- Contains: Health checks for processes, sessions, system
- Key files: Health check implementation

**`internal/websocket/`:**
- Purpose: Real-time WebSocket communication
- Contains: Socket.IO compatible server (TODO implementation)
- Key files: `C:\WorkSpace\ai-bridge\internal\websocket\websocket.go`

**`pkg/protocol/`:**
- Purpose: Shared protocol types and interfaces
- Contains: Message types, session states, protocol definitions
- Key files:
  - `C:\WorkSpace\ai-bridge\pkg\protocol\types.go`
  - `C:\WorkSpace\ai-bridge\pkg\protocol\messages.go`
  - `C:\WorkSpace\ai-bridge\pkg\protocol\events.go`

## Key File Locations

**Entry Points:**
- `C:\WorkSpace\ai-bridge\cmd\ai-bridge\main.go`: Main application entry

**Configuration:**
- `C:\WorkSpace\ai-bridge\configs\config.yaml.example`: Configuration template

**Core Logic:**
- `C:\WorkSpace\ai-bridge\internal\api\server.go`: HTTP server setup
- `C:\WorkSpace\ai-bridge\internal\session\manager.go`: Session management
- `C:\WorkSpace\ai-bridge\internal\pool\pool.go`: Process pooling
- `C:\WorkSpace\ai-bridge\internal\session\session.go`: Session implementation
- `C:\WorkSpace\ai-bridge\internal\claude\message.go`: Message parsing

**Testing:**
- `C:\WorkSpace\ai-bridge\tests/unit/`: Unit tests
- `C:\WorkSpace\ai-bridge\tests/integration/`: Integration tests
- `C:\WorkSpace\ai-bridge\scripts/`: Test scripts and utilities

## Naming Conventions

**Files:**
- Go files: lowercase with underscores (e.g., `session_manager.go`)
- Config files: lowercase with extensions (e.g., `config.yaml`)
- Test files: `_test.go` suffix

**Functions:**
- Exported: PascalCase (e.g., `CreateSession`, `GetMessages`)
- Unexported: lowercase with underscores (e.g., `watchMessages`, `cleanupLoop`)

**Variables:**
- Exported: PascalCase (e.g., `SessionManager`, `ProcessPool`)
- Unexported: lowercase with underscores (e.g., `msgChan`, `sessionID`)

**Types:**
- Structs: PascalCase (e.g., `Session`, `Pool`)
- Interfaces: PascalCase with -er suffix (e.g., `MessageHandler`)

**Constants:**
- Package level: PascalCase (e.g., `StateProcessing`)
- Type constants: PascalType + Constant (e.g., `MessageTypeAssistant`)

## Where to Add New Code

**New API Endpoint:**
- Primary code: `C:\WorkSpace\ai-bridge\internal\api\handlers\`
- Implementation: Add handler function, register in `server.go`
- Tests: `C:\WorkSpace\ai-bridge\tests\integration\`

**New Session Feature:**
- Primary code: `C:\WorkSpace\ai-bridge\internal\session\`
- Implementation: Update `session.go`, add to manager
- Tests: `C:\WorkSpace\ai-bridge\tests\unit\session_`

**New Process Type:**
- Primary code: `C:\WorkSpace\ai-bridge\internal\claude\`
- Implementation: Update process management
- Pool updates: `C:\WorkSpace\ai-bridge\internal\pool\`

**New Command Integration:**
- Primary code: `C:\WorkSpace\ai-bridge\internal\commands\`
- Implementation: Add command discovery source
- Handler: `C:\WorkSpace\ai-bridge\internal\api\handlers\command.go`

**Utilities and Helpers:**
- Shared utilities: `C:\WorkSpace\ai-bridge\pkg\protocol\`
- Internal utilities: Create new package under `internal\`

## Special Directories

**`data/`:**
- Purpose: Runtime data storage
- Contains: SQLite databases, session files
- Generated: Yes
- Committed: No (should be in .gitignore)

**`logs/`:**
- Purpose: Application logs
- Contains: Rotated log files
- Generated: Yes
- Committed: No

**`tmp/`:**
- Purpose: Temporary test files and screenshots
- Contains: Testing artifacts
- Generated: Yes
- Committed: No

**`deployments/`:**
- Purpose: Deployment configurations
- Contains: Docker files, docker-compose
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-02-05*