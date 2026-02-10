# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 开发规范 (Development Guidelines)

### 通用规则 (General Rules)
- **使用中文回答**: 与用户交流时使用中文,但代码注释、变量名等保持英文
- **开发环境**: 当前项目在 Windows 系统上开发,注意路径分隔符使用 `\`
- **脚本规范**: BAT 脚本中不要包含中文字符,使用英文注释和输出

### 文件组织 (File Organization)
- **临时文件**: 所有临时测试代码和数据放在项目根目录的 `tmp/` 文件夹中
- **项目计划**: 开发计划文档存放在 `docs/plans/` 目录
- **Bug 追踪**: 项目自测发现的 bug 记录在 `docs/bugs/` 目录

### 脚本修改原则 (Script Modification Principles)
- **优先修复**: 要求修复脚本时,在原有脚本基础上修改,除非必要不要新建脚本文件
- **保留上下文**: 保持脚本的整体结构和配置不变

### 图片处理 (Image Processing)
- **尺寸限制**: 使用截图 MCP 或 Agent 能力前,确保图片尺寸小于 1000x1000 像素
- **优化传输**: 减小图片尺寸可以提高识别服务的响应速度

### 测试规范 (Testing Guidelines)
- **前后端分离**: 对于前后端分离的项目,使用浏览器技能(dev-browser)进行前后端通信和交互测试
- **真实环境**: 优先在真实浏览器环境中验证功能

### 测试与提交规范 (Testing & Commit Guidelines)

#### Git 提交后必须测试

每次提交代码后，必须运行以下测试流程：

##### 1. 快速检查 (Quick Check)

```batch
# 检查服务状态
.claude\skills\ai-bridge-debug\scripts\check-services.bat

# 如果服务未运行，启动后端
.claude\skills\ai-bridge-debug\scripts\start-backend.bat
```

##### 2. 自动化测试 (Automated Tests)

```bash
# 运行单元测试
make test-unit

# 运行集成测试
make test-integration
```

##### 3. 功能验证 (Functional Verification)

根据修改的内容选择相应的验证步骤：

**后端修改**：
```bash
# 测试 API 端点
curl http://localhost:8080/health

# 查看后端日志（Windows PowerShell）
Get-Content logs\ai-bridge-*.log -Tail 20

# 或使用 CMD
powershell -Command "Get-Content logs\ai-bridge-*.log -Tail 20"
```

**前端修改**：
```bash
# 确保前端服务运行中
cd web
npm run dev

# 打开浏览器测试
# 访问 http://localhost:3000
# 检查控制台错误
```

**SDK 修改**：
```bash
# 构建 SDK
cd sdk
npm run build

# 验证 SDK 文件
# 检查 web/public/sdk/ai-bridge-sdk.es.js

# 测试 SDK 集成
# 访问 http://localhost:3000/test-sdk.html
# 验证连接成功
```

**WebSocket/API 修改**：
```bash
# 完整诊断测试
# 使用 ai-bridge-debug 技能
/ai-bridge-debug test integration
```

##### 4. 使用调试技能 (Debug Skill)

对于复杂问题或不确定的影响范围：

```bash
# 使用 ai-bridge-debug 技能进行完整诊断
/ai-bridge-debug 测试提交后的功能

# 技能会自动：
# - 检查并启动必要的服务
# - 分析日志错误
# - 浏览器自动化测试
# - 提供诊断报告
```

#### 测试检查清单 (Test Checklist)

**提交前确认**：
- [ ] 代码编译通过（Go: `go build`, Frontend: `npm run build`）
- [ ] 单元测试通过（`make test-unit`）
- [ ] 后端服务启动正常
- [ ] 前端页面加载正常
- [ ] 控制台无错误日志
- [ ] 功能验证通过

**提交后确认**：
- [ ] 服务运行稳定
- [ ] 日志无新增错误
- [ ] 相关功能正常工作

#### 调试技能使用指南

```bash
# 快速健康检查
/ai-bridge-debug --health

# 完整诊断
/ai-bridge-debug <问题描述>

# SDK 测试
/ai-bridge-debug test sdk

# 后端调试
/ai-bridge-debug backend error

# 前端调试
/ai-bridge-debug frontend error

# 集成调试
/ai-bridge-debug integration failed
```

#### 服务管理脚本速查

| 脚本 | 功能 | 使用场景 |
|------|------|----------|
| `check-services.bat` | 检查前后端服务状态 | 验证服务是否运行 |
| `start-backend.bat` | 启动后端服务 | 后端未运行时 |
| `stop-backend.bat` | 停止后端服务 | 需要重启后端时 |
| `health-check.bat` | 健康检查 | 验证服务健康状况 |
| `analyze-logs.bat` | 分析后端日志 | 查找错误和问题 |

### 日志规范 (Logging Standards)
- **日志库**: Go 项目统一使用 `github.com/WQGroup/logger`
- **基本用法**:
  ```go
  import "github.com/WQGroup/logger"

  // 设置日志文件名
  logger.SetLoggerName("AppName")
  // 默认日志级别为 Info

  // 记录不同级别的日志
  logger.Debug("调试信息")
  logger.Info("一般信息")
  logger.Warn("警告信息")
  logger.Error("错误信息")

  // 设置日志级别
  logger.SetLoggerLevel(logrus.DebugLevel)

  // 设置日志保存路径(默认为 ./Logs/)
  logger.SetLoggerRootDir("/path/to/logs")
  ```
- **日志特性**:
  - 单个日志文件记录时长: 24 小时
  - 最大保留时间: 7 天
  - 自动分片和清理
  - 基于 logrus,支持结构化日志

## Project Overview

**AI-Bridge** is a lightweight Go middleware that provides remote access to Claude Code CLI through HTTP/WebSocket APIs. It enables any web application to remotely control local Claude Code CLI instances with HAPI-compatible APIs.

### Key Goals
- **Focus**: Claude Code CLI only - does one thing well
- **Performance**: Smooth operation even with 10,000+ message sessions
- **Compatibility**: HAPI-compatible API, can use HAPI frontends directly
- **Production-Ready**: Complete error handling, logging, and monitoring

## Architecture

The system consists of several layers:

```
Web App (HAPI frontend or custom)
    ↓ HTTP/WebSocket (HAPI-compatible API)
AI-Bridge Server
    ├─ HTTP API Layer (sessions, messages, permissions, slash commands)
    ├─ WebSocket Layer (Socket.IO)
    └─ Claude Code Manager (process pool, session lifecycle, message parsing)
    ↓ exec/stdio
Claude Code CLI Instances (managed in process pool)
```

### Core Components

- **`internal/claude/`** - Claude Code CLI wrapper (core)
  - `process.go` - Process management (start/stop, communicate via stdio)
  - `session.go` - Session wrapper
  - `message.go` - Message parsing (JSON output from Claude)
  - `permission.go` - Permission handling
  - `config.go` - Configuration

- **`internal/pool/`** - Process pool management
  - `pool.go` - Pool structure
  - `instance.go` - Instance management

- **`internal/session/`** - Session management
  - `manager.go` - Session lifecycle
  - `session.go` - Session structure with **incremental sync optimization**
  - `store.go` - SQLite persistence

- **`internal/commands/`** - Slash command support
  - `discover.go` - Command discovery (builtin, user, project)
  - `parser.go` - Command parsing
  - `commands.go` - Command structures

- **`internal/api/`** - HTTP API (HAPI-compatible)
  - `handlers/session.go` - Session CRUD
  - `handlers/message.go` - Message management with pagination
  - `handlers/permission.go` - Permission approval/deny
  - `handlers/command.go` - Slash command API

- **`internal/websocket/`** - WebSocket (Socket.IO compatible)

- **`pkg/protocol/`** - HAPI-compatible protocol types

## Critical Design Patterns

### Incremental Message Sync (Performance Optimization)

This is the most important architectural pattern for handling large sessions:

**Problem**: In sessions with 10,000+ messages, sending full history causes:
- Network lag (transmitting entire history)
- Frontend rendering lag (1000+ DOM nodes)
- High memory usage (server keeps all messages in RAM)
- Slow database queries

**Solution**: Incremental sync with pagination
- Each message has a monotonically increasing `seq` number
- Server keeps only recent 100 messages in memory
- Database stores all history
- API supports `?since=123` to fetch only new messages
- API supports `?before=456&limit=50` for scrolling history
- SSE streaming for real-time incremental updates

### Message Flow

1. Client requests last 50 messages: `GET /messages?limit=50`
2. Client subscribes to SSE: `GET /messages/stream?since=50`
3. Server pushes only messages with `seq > 50`
4. For historical scroll: `GET /messages?before=1&limit=50`

## Development Commands

**注意**: 本项目在 Windows 系统上开发,以下命令适用于 Windows 环境。

### Building
```bash
# Windows
go build -o ai-bridge.exe ./cmd/ai-bridge

# 或者
go build -o ai-bridge ./cmd/ai-bridge
```

### Running
```bash
# Windows
go run cmd/ai-bridge/main.go --config configs\config.yaml

# 或者直接运行编译后的可执行文件
.\ai-bridge.exe server --config configs\config.yaml
```

### Testing
```bash
# Run all tests
make test-all

# Unit tests only
make test-unit

# Integration tests
make test-integration

# E2E tests (requires Claude CLI installed)
make test-e2e

# Coverage report
make test-coverage
```

### Linting
```bash
go vet ./...
golangci-lint run
```

## HAPI API Compatibility

The API is designed to be compatible with HAPI frontends. Key endpoints:

### Session Management
- `POST /api/v1/sessions` - Create session (returns `id`, `status`, `createdAt`, `metadata`)
- `GET /api/v1/sessions/:id` - Get session info
- `GET /api/v1/sessions` - List sessions

### Message Management (Optimized)
- `GET /api/v1/sessions/:sessionId/messages?since=123&limit=50&before=456` - Paginated messages
  - `since` - incremental sync (get messages after this seq)
  - `before` - historical scroll (get messages before this seq)
  - `limit` - max messages (default 50, max 100)
- `GET /api/v1/sessions/:sessionId/messages/stream?since=123` - SSE stream
- `POST /api/v1/sessions/:sessionId/messages` - Send message (returns `seq`)

### Permissions
- `POST /api/v1/sessions/:sessionId/permissions/:requestId/approve` - Approve with scope
- `POST /api/v1/sessions/:sessionId/permissions/:requestId/deny` - Deny

### Slash Commands
- `GET /api/v1/commands?sessionId=:id` - List all commands (returns `byCategory` grouping)
- `GET /api/v1/commands/:path` - Get single command
- `POST /api/v1/sessions/:sessionId/commands` - Execute command

## Configuration

Server configuration is in `configs/config.yaml`:

```yaml
server:
  host: "0.0.0.0"
  port: 8080
  publicUrl: "http://localhost:8080"

cors:
  origins:
    - "http://localhost:3000"
    - "https://app.hapi.run"  # Allow HAPI frontend

database:
  path: "./data/ai-bridge.db"

auth:
  jwtSecret: "${JWT_SECRET:-change-this-in-production}"
  cliApiToken: "${CLI_API_TOKEN:-your-token-here}"

pool:
  maxInstances: 5
  idleTimeout: 300s

claude:
  defaultModel: "haiku"
  timeout: 300s
  permissionMode: "normal"

# Performance optimization
performance:
  maxRecentMessages: 100    # Keep only 100 messages in memory
  messageBufferSize: 50
  subscriberBufferSize: 50
```

## Testing Strategy

This project uses **Test-Driven Development (TDD)** with a 60/30/10 test pyramid:

### Unit Tests (60%)
- Located in `internal/*/package_test.go`
- Target: 80%+ overall coverage
- Critical modules need 90%: `claude/`, `session/`

### Integration Tests (30%)
- Located in `tests/integration/`
- Test API handlers and component interaction
- Use `httptest.Server` for HTTP tests

### E2E Tests (10%)
- Located in `scripts/test-e2e.sh` (Windows 环境下为 `.bat` 脚本)
- Requires actual Claude CLI installed
- Tests complete workflows

### Frontend-Backend Integration Testing
对于前后端分离开发的项目:
- **使用浏览器测试**: 使用 `dev-browser` 技能进行前后端通信和交互操作测试
- **真实环境验证**: 在真实浏览器环境中验证 API 响应、WebSocket 连接等功能
- **交互测试**: 测试用户界面与后端 API 的完整交互流程

### TDD Workflow
1. **RED**: Write failing test
2. **GREEN**: Write minimal code to pass
3. **REFACTOR**: Clean up while tests pass

### Test Naming Convention
```go
func Test<FunctionName>_<Scenario>(t *testing.T)
// Example: TestProcess_Start_Success, TestProcess_Start_AlreadyRunning
```

## Working with Claude Code CLI

### CLI Discovery
The server discovers and executes Claude CLI commands. CLI must be:
- In system PATH
- Authenticated (`claude auth login`)
- Properly configured

### Slash Command Sources
1. **CLI builtin** - Commands built into Claude CLI
2. **User** - `~/.claude/commands/*.md`
3. **Project** - `<workingDir>/.claude/commands/**/*.md`

### Command Format (Markdown frontmatter)
```markdown
---
category: git
description: Create a git commit
examples:
  - /commit
  - /commit Fix bug
---

This is a git commit command.
```

## Common Patterns

### Starting a Process
```go
ctx := context.Background()
config := claude.Config{
    WorkingDir:     "/path/to/project",
    Model:          "haiku",
    PermissionMode: "normal",
}
proc := claude.NewProcess("id", config)
err := proc.Start(ctx)
```

### Message Subscription (Incremental)
```go
filter := session.MessageFilter{
    SinceSeq: 100,  // Only get messages after seq 100
}
msgChan, unsubscribe := sess.Subscribe(ctx, filter)
defer unsubscribe()

for msg := range msgChan {
    // Handle incremental messages
}
```

### Error Handling
- Always check and propagate errors
- Use context.Context for cancellation
- Clean up processes on error paths
- Log errors with structured logging (使用 `github.com/WQGroup/logger`)

### Logging (日志记录)
```go
import "github.com/WQGroup/logger"

// 初始化日志系统(通常在 main.go 中)
func initLogger() {
    logger.SetLoggerName("ai-bridge")        // 设置日志文件名
    logger.SetLoggerLevel(logrus.InfoLevel)  // 设置日志级别
    logger.SetLoggerRootDir("./logs")        // 设置日志目录
}

// 在代码中使用
func someFunction() {
    logger.Info("Starting process...")

    err := doSomething()
    if err != nil {
        logger.Errorf("Failed to do something: %v", err)
        return
    }

    logger.Info("Operation completed successfully")
}
```

## Performance Considerations

### Memory Management
- Only keep 100 recent messages in memory per session
- Offload older messages to SQLite database
- Use bounded channels (buffer size from config)

### Database Queries
- Use indexes on `(session_id, seq)`
- Paginated queries with LIMIT
- Consider connection pooling

### Concurrency
- Process pool limits concurrent instances
- Use mutexes for shared state
- Subscriber management is thread-safe

## Deployment

### Docker
```bash
docker build -f deployments/docker/Dockerfile -t ai-bridge .
docker run -p 8080:8080 -v ./data:/root/data ai-bridge
```

### Docker Compose
```bash
cd deployments/docker
docker-compose up
```

## Troubleshooting

### Claude CLI Issues
- **Command not found**: Ensure Claude CLI is in PATH
- **Auth errors**: Run `claude auth login`
- **Timeout**: Increase `claude.timeout` in config

### Performance Issues
- **High memory**: Check `maxRecentMessages` setting, look for leaked sessions
- **Slow messages**: Check WebSocket connection, database indexes
- **Process pool full**: Increase `pool.maxInstances`

### Debugging
- Check logs in `/tmp/ai-bridge.log`
- Use `curl` to test API endpoints directly
- Monitor with `GET /health` endpoint

## Project Status

**Current Phase**: Design/Planning (no code yet)

**Implementation Roadmap**:
1. Phase 1: Core Claude wrapper (process, message parsing, permissions) - Weeks 1-2
2. Phase 2: Process pool management - Week 3
3. Phase 3: Session management with incremental sync - Weeks 4-5
4. Phase 4: HTTP API layer - Weeks 6-8
5. Phase 5: Slash command support - Weeks 9-10
6. Phase 6: Testing & production hardening - Weeks 11-13

**Total Estimate**: ~13 weeks (3 months)
