# Technology Stack

**Analysis Date:** 2026-02-05

## Languages

**Primary:**
- Go 1.24.0 - Core server, API endpoints, WebSocket management, process pooling
- Go 1.24.13 - Toolchain version

**Secondary:**
- YAML - Configuration files
- SQL (SQLite) - Database operations
- JSON - API message formatting and WebSocket communication

## Runtime

**Environment:**
- Go 1.24 runtime
- Cross-platform (Windows, Linux, macOS) - Native binary compilation

**Package Manager:**
- Go modules (go.mod/go.sum)
- No external package manager dependency

## Frameworks

**Core:**
- Gin v1.10.0 - HTTP web framework for REST API
- Gorilla WebSocket v1.5.3 - WebSocket implementation for real-time communication

**Testing:**
- Testify v1.9.0 - Assertion library for unit tests

**Build/Dev:**
- Standard Go toolchain - Build, test, and deployment
- Makefile - Build automation and development workflow

## Key Dependencies

**Critical:**
- github.com/WQGroup/logger v0.0.16 - Structured logging system (based on logrus)
- github.com/gin-gonic/gin v1.10.0 - HTTP server and routing
- github.com/gorilla/websocket v1.5.3 - WebSocket support

**Infrastructure:**
- gorm.io/gorm v1.25.12 - ORM for database operations
- gorm.io/driver/sqlite v1.5.6 - SQLite database driver
- gopkg.in/yaml.v3 v3.0.1 - YAML configuration parsing

**Utilities:**
- sirupsen/logrus v1.6.0 - Logging framework (used by logger package)

## Configuration

**Environment:**
- YAML configuration file: `configs/config.yaml`
- Environment variable support for secrets (JWT secret, API tokens)

**Build:**
- Go modules dependency management
- Standard Go build output: `ai-bridge.exe` (Windows)

## Platform Requirements

**Development:**
- Go 1.24+ installed
- Claude CLI installed for E2E testing
- Make command (optional, for build automation)

**Production:**
- No external runtime dependencies
- SQLite database file storage
- Static binary deployment

---

*Stack analysis: 2026-02-05*
```