# AI-Bridge

AI-Bridge is a lightweight Go middleware that provides remote access to Claude Code CLI through HTTP/WebSocket APIs. It enables any web application to remotely control local Claude Code CLI instances with HAPI-compatible APIs.

## Features

- **Claude Code CLI Focus**: Exclusively designed for Claude Code CLI integration
- **High Performance**: Smooth operation even with 10,000+ message sessions using incremental sync
- **HAPI-Compatible API**: Drop-in replacement for HAPI backends
- **Production-Ready**: Complete error handling, structured logging, and monitoring
- **Process Pool**: Efficient Claude CLI instance management
- **Real-time Communication**: WebSocket support for streaming messages
- **Slash Commands**: Full support for Claude CLI slash commands
- **Permission Management**: Built-in permission request handling

## Quick Start

### Prerequisites

- Go 1.21 or later
- Claude Code CLI installed and authenticated (`claude auth login`)
- Windows, Linux, or macOS

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/ai-bridge.git
cd ai-bridge

# Install dependencies
go mod download

# Copy and edit configuration
cp configs/config.yaml.example configs/config.yaml
# Edit configs/config.yaml with your settings

# Build
make build

# Run
make run
```

### Configuration

Edit `configs/config.yaml`:

```yaml
server:
  host: "0.0.0.0"
  port: 8080
  publicUrl: "http://localhost:8080"

cors:
  origins:
    - "http://localhost:3000"
    - "https://app.hapi.run"

database:
  path: "./data/ai-bridge.db"

auth:
  jwtSecret: "change-this-in-production"
  cliApiToken: "your-token-here"

pool:
  maxInstances: 5
  idleTimeout: 300s

claude:
  defaultModel: "haiku"
  timeout: 300s
  permissionMode: "normal"

performance:
  maxRecentMessages: 100
  messageBufferSize: 50
  subscriberBufferSize: 50
```

## Development

### Project Structure

```
ai-bridge/
├── cmd/ai-bridge/        # Main application entry
├── internal/
│   ├── claude/           # Claude CLI wrapper
│   ├── pool/             # Process pool management
│   ├── session/          # Session lifecycle and incremental sync
│   ├── commands/         # Slash command support
│   ├── api/              # HTTP API handlers
│   ├── websocket/        # WebSocket server
│   ├── config/           # Configuration management
│   └── health/           # Health check endpoints
├── pkg/protocol/         # HAPI-compatible protocol types
├── configs/              # Configuration files
├── scripts/              # Utility scripts
└── tests/                # Test suites
```

### Build

```bash
make build
```

### Run

```bash
make run
```

### Testing

```bash
# Run all tests
make test-all

# Unit tests only
make test-unit

# Integration tests
make test-integration

# E2E tests (requires Claude CLI)
make test-e2e

# Coverage report
make test-coverage
```

## API Endpoints

### Session Management
- `POST /api/v1/sessions` - Create session
- `GET /api/v1/sessions/:id` - Get session info
- `GET /api/v1/sessions` - List sessions
- `DELETE /api/v1/sessions/:id` - Delete session

### Message Management (Incremental Sync)
- `GET /api/v1/sessions/:sessionId/messages?since=123&limit=50&before=456` - Paginated messages
- `GET /api/v1/sessions/:sessionId/messages/stream?since=123` - SSE stream
- `POST /api/v1/sessions/:sessionId/messages` - Send message

### Permissions
- `GET /api/v1/sessions/:sessionId/permissions` - List pending permissions
- `POST /api/v1/sessions/:sessionId/permissions/:requestId/approve` - Approve
- `POST /api/v1/sessions/:sessionId/permissions/:requestId/deny` - Deny

### Slash Commands
- `GET /api/v1/commands?sessionId=:id` - List commands
- `GET /api/v1/commands/:path` - Get command details
- `POST /api/v1/sessions/:sessionId/commands` - Execute command

### Health
- `GET /health` - Health check
- `GET /metrics` - Metrics (optional)

## Architecture

AI-Bridge uses an incremental message sync architecture to handle large sessions efficiently:

1. **Process Pool**: Manages Claude CLI instances with configurable limits
2. **Session Manager**: Handles session lifecycle with incremental message tracking
3. **Message Pagination**: Each message has a monotonically increasing `seq` number
4. **Memory Optimization**: Only recent 100 messages kept in memory
5. **Database Persistence**: All messages stored in SQLite for history access
6. **Real-time Updates**: SSE streaming for incremental sync

## Performance

- Supports 10,000+ messages per session
- Handles 5+ concurrent Claude CLI instances
- Sub-second message delivery with incremental sync
- Efficient memory usage with bounded buffers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `make test-all`
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.
