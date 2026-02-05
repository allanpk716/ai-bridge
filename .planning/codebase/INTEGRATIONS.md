# External Integrations

**Analysis Date:** 2026-02-05

## APIs & External Services

**AI Services:**
- Claude API (via CLI) - AI model interaction
  - Connection: Local Claude CLI execution via stdio
  - Authentication: CLI token (from `claude auth login`)

**Web Framework:**
- Gin HTTP Server - REST API endpoints
- Gorilla WebSocket - Real-time bidirectional communication
- SSE (Server-Sent Events) - Message streaming

## Data Storage

**Databases:**
- SQLite - Primary database
  - Connection: File-based storage (`./data/ai-bridge.db`)
  - Client: GORM ORM with SQLite driver
  - Features: WAL mode enabled, connection pooling

**File Storage:**
- Local filesystem only - Session working directories
  - Path: `./data/sessions/`

**Caching:**
- In-memory caching - Recent messages and session state
  - Configuration: `maxRecentMessages: 100`

## Authentication & Identity

**Auth Provider:**
- Custom JWT implementation
  - Implementation: Server-side JWT generation/verification
  - Environment: `JWT_SECRET` env variable
  - Token type: Bearer token for API authentication

**CLI Authentication:**
- Claude CLI token
  - Environment: `CLI_API_TOKEN`
  - Purpose: Internal API access from CLI

## Monitoring & Observability

**Error Tracking:**
- Custom structured logging - Built-in error handling
  - Framework: WQGroup/logger (based on logrus)
  - Output: File rotation with 7-day retention

**Logs:**
- Multi-output logging - Console and file
  - Directory: `./logs/`
  - Format: Text format with rotation
  - Levels: Debug, Info, Warn, Error

## CI/CD & Deployment

**Hosting:**
- Docker support - Containerized deployment
  - Dockerfile: `deployments/docker/Dockerfile`
  - Docker Compose: `deployments/docker/docker-compose.yml`

**CI Pipeline:**
- GitHub Actions - Automated testing and deployment (configured)
  - Test scripts: `scripts/test-*.bat`
  - Build automation: Makefile targets

## Environment Configuration

**Required env vars:**
- `JWT_SECRET` - JWT signing secret
- `CLI_API_TOKEN` - CLI API access token
- `PATH` - System path for CLI discovery

**Secrets location:**
- Configuration file: `configs/config.yaml` (development)
- Environment variables (production)

## Webhooks & Callbacks

**Incoming:**
- HTTP endpoints - REST API for sessions, messages, permissions
- WebSocket connections - Real-time bidirectional communication
- SSE streams - Server-sent events for message streaming

**Outgoing:**
- None detected (no external service callbacks)

## CORS Configuration

**Allowed Origins:**
- `http://localhost:3000` - Local development
- `https://app.hapi.run` - HAPI frontend compatibility

**Allowed Methods:**
- GET, POST, PUT, DELETE, OPTIONS

**Allowed Headers:**
- Content-Type, Authorization, X-Requested-With

---

*Integration audit: 2026-02-05*
```