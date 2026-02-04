# AI-Bridge 设计文档

## 项目概述

**AI-Bridge** 是一个用 Go 语言实现的轻量级中间件，专注于为 Claude Code CLI 提供远程访问能力。通过 HTTP/WebSocket API，任何 Web 应用都能远程控制本地运行的 Claude Code CLI 实例。

### 核心目标

- **专注**: 只支持 Claude Code CLI，做好一件事
- **高性能**: 即使在 10,000+ 条消息的会话中依然流畅
- **兼容**: API 与 HAPI 兼容，可直接使用 HAPI 的前端
- **生产就绪**: 完善的错误处理、日志、监控

### 关键特性

- ✅ 多会话管理（进程池）
- ✅ 斜杠命令发现和执行
- ✅ 权限处理
- ✅ 增量消息同步（解决大会话卡顿）
- ✅ WebSocket 实时通信
- ✅ HAPI 兼容 API
- ✅ 会话状态实时跟踪
- ✅ 手动终止功能（类似 ESC 键）

---

## 一、系统架构

### 1.1 整体架构图

```
┌───────────────────────────────────────────────────────────┐
│                   Web 应用层                               │
│        (PPT助手、文档助手、你的任何应用)                    │
└─────────────────────┬─────────────────────────────────────┘
                      │ HTTP/WebSocket (HAPI 兼容 API)
                      ↓
┌───────────────────────────────────────────────────────────┐
│                    AI-Bridge Server                        │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              HTTP API Layer                         │  │
│  │  • Session Management                               │  │
│  │  • Message Routing                                  │  │
│  │  • Permission Handling                              │  │
│  │  • Slash Commands Discovery                         │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │            WebSocket Layer (Socket.IO)               │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │           Claude Code Manager                        │  │
│  │  • Process Pool (管理多个 claude 进程)               │  │
│  │  • Session Lifecycle                                │  │
│  │  • Message Parsing (JSON 输出解析)                   │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────┬─────────────────────────────────────┘
                      │ exec/stdio
                      ↓
┌───────────────────────────────────────────────────────────┐
│              Claude Code CLI Instances                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ claude #1│  │ claude #2│  │ claude #3│  ...           │
│  └──────────┘  └──────────┘  └──────────┘               │
└───────────────────────────────────────────────────────────┘
```

### 1.2 项目结构

```
ai-bridge/
├── cmd/
│   └── ai-bridge/              # 主服务入口
│       └── main.go
│
├── internal/
│   ├── claude/                 # Claude Code CLI 封装（核心）
│   │   ├── process.go          # 进程管理
│   │   ├── session.go          # 会话封装
│   │   ├── message.go          # 消息解析
│   │   ├── permission.go       # 权限处理
│   │   └── config.go           # 配置
│   │
│   ├── pool/                   # 进程池
│   │   ├── pool.go
│   │   └── instance.go
│   │
│   ├── commands/               # 斜杠命令支持
│   │   ├── discover.go         # 命令发现
│   │   ├── parser.go           # 命令解析
│   │   └── commands.go         # 命令结构
│   │
│   ├── session/                # 会话管理
│   │   ├── manager.go
│   │   ├── session.go
│   │   └── store.go            # SQLite 持久化
│   │
│   ├── api/                    # HTTP API
│   │   ├── server.go
│   │   ├── router.go
│   │   ├── handlers/
│   │   │   ├── session.go
│   │   │   ├── message.go
│   │   │   ├── permission.go
│   │   │   └── command.go      # 斜杠命令 API
│   │   └── middleware/
│   │
│   ├── websocket/              # WebSocket (Socket.IO)
│   │   └── server.go
│   │
│   └── config/                 # 配置管理
│       └── config.go
│
├── pkg/
│   └── protocol/               # HAPI 兼容协议
│       ├── types.go
│       ├── events.go
│       └── messages.go
│
├── configs/
│   └── config.yaml.example
│
├── deployments/
│   └── docker/
│       ├── Dockerfile
│       └── docker-compose.yaml
│
├── tests/
│   ├── e2e/                    # 端到端测试
│   │   └── api_test.go
│   └── integration/            # 集成测试
│
├── scripts/
│   ├── build.sh
│   └── test.sh
│
├── go.mod
├── go.sum
├── Makefile
└── README.md
```

---

## 二、核心组件设计

### 2.1 Claude Code 进程封装

#### 数据结构

```go
// internal/claude/process.go
package claude

// Process Claude Code CLI 进程封装
type Process struct {
    id          string
    config      Config
    cmd         *exec.Cmd
    stdin       io.WriteCloser
    stdout      io.ReadCloser
    stderr      io.ReadCloser

    // 事件通道
    messageChan chan Message
    errorChan   chan error
    eventChan   chan Event

    // 状态
    mu      sync.RWMutex
    running bool
    started time.Time
}

// Config Claude Code 配置
type Config struct {
    WorkingDir      string        `json:"workingDirectory"`
    Model           string        `json:"model,omitempty"`
    PermissionMode  string        `json:"permissionMode"` // normal, acceptEdits
    AllowedTools    []string      `json:"allowedTools,omitempty"`
    DisallowedTools []string      `json:"disallowedTools,omitempty"`
    MaxTurns        int           `json:"maxTurns,omitempty"`
    Timeout         time.Duration `json:"timeout,omitempty"`
    EnvVars         map[string]string `json:"envVars,omitempty"`
}

// Message 消息
type Message struct {
    Seq       int64       `json:"seq"`
    Type      MessageType `json:"type"`
    Content   interface{} `json:"content"`
    Timestamp time.Time   `json:"timestamp"`

    // 处理时长（新增）
    ProcessingDuration int64  `json:"processingDuration,omitempty"` // 处理时长(毫秒)
    ProcessingStarted  int64  `json:"processingStarted,omitempty"`  // 开始处理时间
    ProcessingEnded    int64  `json:"processingEnded,omitempty"`    // 结束处理时间
    Status             string `json:"status,omitempty"`             // started, in_progress, completed, failed
}

type MessageType string

const (
    MessageTypeUser         MessageType = "user"
    MessageTypeAssistant    MessageType = "assistant"
    MessageTypeToolUse      MessageType = "tool_use"
    MessageTypeToolResult   MessageType = "tool_result"
    MessageTypePermission   MessageType = "permission_request"
    MessageTypeError        MessageType = "error"
)

// Event 进程事件
type Event struct {
    Type      EventType `json:"type"`
    ProcessID string    `json:"processId"`
    Timestamp time.Time `json:"timestamp"`
    Error     error     `json:"error,omitempty"`
}

type EventType string

const (
    EventTypeStarted      EventType = "started"
    EventTypeStopped      EventType = "stopped"
    EventTypeMessage      EventType = "message"
    EventTypeError        EventType = "error"
)
```

#### 核心方法

```go
// 启动进程
func (p *Process) Start(ctx context.Context) error

// 停止进程
func (p *Process) Stop(ctx context.Context) error

// 发送消息
func (p *Process) SendMessage(ctx context.Context, text string) error

// 发送权限批准
func (p *Process) SendApproval(ctx context.Context, requestID string, approved bool, scope string) error

// 中断进程（手动终止，类似 ESC 键）
func (p *Process) Interrupt(ctx context.Context) error

// 消息通道
func (p *Process) Messages() <-chan Message
func (p *Process) Errors() <-chan error
func (p *Process) Events() <-chan Event
```

### 2.2 进程池管理

```go
// internal/pool/pool.go
package pool

// Pool Claude Code 进程池
type Pool struct {
    mu        sync.RWMutex
    processes map[string]*claude.Process
    config    Config
}

type Config struct {
    MaxInstances int           `json:"maxInstances"` // 最大实例数
    IdleTimeout  time.Duration `json:"idleTimeout"`  // 空闲超时
}

// 核心方法
func NewPool(config Config) *Pool
func (p *Pool) Acquire(ctx context.Context, config claude.Config) (*claude.Process, error)
func (p *Pool) Release(id string)
func (p *Pool) Remove(id string) error
func (p *Pool) Get(id string) (*claude.Process, bool)
func (p *Pool) List() []*claude.Process
func (p *Pool) Stats() Stats
```

### 2.3 会话管理（优化版）

```go
// internal/session/session.go
package session

// Session 会话（优化版 + 状态跟踪）
type Session struct {
    id            string
    process       *claude.Process
    createdAt     time.Time

    // 消息存储优化：内存 + 数据库分层
    mu              sync.RWMutex
    recentMessages  []*Message          // 只保留最近的 100 条
    messageCount    int64               // 总消息数
    lastSeq         int64               // 最后一条消息的序号

    // 状态跟踪
    state           SessionState        // 当前状态：idle, processing, waiting, error, stopped
    stateStartAt    time.Time           // 当前状态开始时间
    currentMessageSeq int64             // 当前正在处理的消息序号
    messageStartTimes map[int64]time.Time // 消息开始处理时间
    messageDurations  map[int64]time.Duration // 消息处理时长

    // 订阅者管理
    subscribers     map[string]*Subscriber
    subscriberMu    sync.RWMutex
}

// SessionState 会话状态
type SessionState string

const (
    StateIdle        SessionState = "idle"         // 空闲,等待用户输入
    StateProcessing  SessionState = "processing"   // AI 正在处理
    StateWaiting     SessionState = "waiting"      // 等待权限批准
    StateError       SessionState = "error"        // 错误状态
    StateStopped     SessionState = "stopped"      // 已停止
)

// Subscriber 订阅者（增量同步）
type Subscriber struct {
    ID          string
    LastSeenSeq int64
    MessageChan chan *Message
    EventChan   chan *Event
    Filter      MessageFilter
}

// MessageFilter 消息过滤器
type MessageFilter struct {
    SinceSeq  int64     // 只返回此序号之后的消息
    Types     []string  // 只返回特定类型的消息
    Limit     int       // 限制数量
}

// 核心方法
func NewSession(id string, process *claude.Process) *Session
func (s *Session) AddMessage(msg *Message) error
func (s *Session) Subscribe(ctx context.Context, filter MessageFilter) (<-chan *Message, func())
func (s *Session) GetMessages(ctx context.Context, opts GetMessagesOptions) ([]*Message, error)
func (s *Session) Stats() SessionStats

// 状态跟踪方法
func (s *Session) GetStatus() *SessionStatus          // 获取会话状态
func (s *Session) setState(state SessionState)        // 设置状态
func (s *Session) startProcessing(seq int64)          // 开始处理消息
func (s *Session) completeProcessing(seq int64)       // 完成处理消息
func (s *Session) Stop(ctx context.Context) error     // 手动停止会话

// SessionStatus 会话状态信息
type SessionStatus struct {
    SessionID         string       `json:"sessionId"`
    State             SessionState `json:"state"`
    Duration          int64        `json:"duration"`    // 当前状态持续时长(毫秒)
    StartTime         int64        `json:"startTime"`   // 当前状态开始时间
    LastMessageSeq    int64        `json:"lastMessageSeq"`
    LastMessageType   string       `json:"lastMessageType"`
    TotalMessages     int64        `json:"totalMessages"`
    ProcessingCount   int64        `json:"processingCount"` // 正在处理的消息数
}
```

### 2.4 斜杠命令支持

```go
// internal/commands/commands.go
package commands

// SlashCommand 斜杠命令
type SlashCommand struct {
    Path        string   `json:"path"`        // 命令路径，如 "frontend:component"
    Name        string   `json:"name"`
    Description string   `json:"description"`
    Category    string   `json:"category,omitempty"`
    Examples    []string `json:"examples,omitempty"`
    Source      string   `json:"source"`      // cli, user, project
    Enabled     bool     `json:"enabled"`
}

// 核心方法
func DiscoverCommands(ctx context.Context, workingDir string) ([]*SlashCommand, error)
func builtinCommands() []*SlashCommand
func discoverUserCommands(ctx context.Context) ([]*SlashCommand, error)
func discoverProjectCommands(ctx context.Context, workingDir string) ([]*SlashCommand, error)
```

---

## 三、API 设计（HAPI 兼容）

### 3.1 会话管理

#### 创建会话

```http
POST /api/v1/sessions

Request:
{
  "workingDirectory": "/path/to/project",
  "agent": "claude",
  "model": "haiku",
  "permissionMode": "normal",
  "allowedTools": ["Read", "Write", "Bash"]
}

Response (201 Created):
{
  "id": "sess_xxx",
  "status": "active",
  "createdAt": 1234567890,
  "metadata": {
    "workingDirectory": "/path/to/project",
    "agent": "claude",
    "model": "haiku",
    "permissionMode": "normal"
  }
}
```

#### 获取会话信息

```http
GET /api/v1/sessions/:id

Response (200 OK):
{
  "id": "sess_xxx",
  "status": "active",
  "createdAt": 1234567890,
  "updatedAt": 1234567890,
  "metadata": { ... }
}
```

#### 列出会话

```http
GET /api/v1/sessions

Response (200 OK):
{
  "sessions": [...]
}
```

#### 获取会话状态（新增）

```http
GET /api/v1/sessions/:id/status

Response (200 OK):
{
  "sessionId": "sess_xxx",
  "state": "processing",           // idle, processing, waiting, error, stopped
  "duration": 15000,               // 当前状态持续时长(毫秒)
  "startTime": 1707048380000,      // 当前状态开始时间
  "lastMessageSeq": 124,
  "lastMessageType": "user",
  "lastMessageTime": 1707048390000,
  "totalMessages": 124,
  "processingCount": 1,
  "metadata": {
    "workingDirectory": "/path/to/project",
    "model": "haiku",
    "agent": "claude"
  }
}
```

#### 停止会话（新增）

```http
POST /api/v1/sessions/:id/stop

Request (可选):
{
  "reason": "user_cancelled",  // 可选: user_cancelled, timeout, error
  "force": false                // 是否强制终止(使用信号)
}

Response (200 OK):
{
  "success": true,
  "message": "Session stopped",
  "previousState": "processing",
  "stoppedAt": 1707048400000
}

Response (409 Conflict) - 如果当前没有正在处理的消息:
{
  "error": "session_not_processing",
  "message": "Session is not processing (current state: idle)",
  "currentState": "idle"
}
```

### 3.2 消息管理（优化版）

#### 获取消息列表（分页、增量）

```http
GET /api/v1/sessions/:sessionId/messages?since=123&limit=50&before=456

Response (200 OK):
{
  "messages": [...],
  "hasMore": true,    // 是否还有更多消息
  "lastSeq": 456      // 当前最新消息序号
}
```

**参数说明**:
- `since`: 只返回此序号之后的消息（用于增量同步）
- `before`: 获取此序号之前的消息（用于向上滚动加载历史）
- `limit`: 限制数量（默认 50，最大 100）

#### 流式接收新消息（SSE）

```http
GET /api/v1/sessions/:sessionId/messages/stream?since=123

Response (text/event-stream):
event: message
data: {"seq":124,"type":"assistant","content":"..."}

event: heartbeat
data: 1234567890
```

#### 发送消息

```http
POST /api/v1/sessions/:sessionId/messages

Request:
{
  "text": "帮我分析这个项目"
}

Response (202 Accepted):
{
  "status": "sent",
  "seq": 124    // 消息序号
}
```

**注意**: 此调用立即返回，不等待响应。响应会通过 SSE 推送。

### 3.3 权限处理

#### 批准权限请求

```http
POST /api/v1/sessions/:sessionId/permissions/:requestId/approve

Request:
{
  "scope": "session"  // "once" 或 "session"
}

Response (200 OK):
{
  "status": "approved"
}
```

#### 拒绝权限请求

```http
POST /api/v1/sessions/:sessionId/permissions/:requestId/deny

Response (200 OK):
{
  "status": "denied"
}
```

### 3.4 斜杠命令

#### 列出所有命令

```http
GET /api/v1/commands?sessionId=:sessionId

Response (200 OK):
{
  "commands": [
    {
      "path": "commit",
      "name": "commit",
      "description": "Create a git commit",
      "category": "git",
      "examples": ["/commit", "/commit Fix bug"],
      "source": "cli",
      "enabled": true
    },
    {
      "path": "frontend:component",
      "name": "component",
      "description": "Generate a React component",
      "category": "frontend",
      "examples": ["/frontend:component Button"],
      "source": "project",
      "enabled": true
    }
  ],
  "byCategory": {
    "git": [...],
    "frontend": [...]
  },
  "total": 15
}
```

#### 获取单个命令

```http
GET /api/v1/commands/:path?sessionId=:sessionId

Response (200 OK):
{
  "path": "frontend:component",
  ...
}
```

#### 执行命令

```http
POST /api/v1/sessions/:sessionId/commands

Request:
{
  "commandPath": "git:commit",
  "arguments": {
    "type": "feat",
    "message": "Add new feature"
  }
}

Response (202 Accepted):
{
  "messageId": "msg_xxx",
  "command": "git:commit"
}
```

### 3.5 WebSocket（Socket.IO 兼容）

#### 连接

```javascript
// 连接到 /cli namespace
const socket = io('/cli', {
  auth: {
    token: 'your-cli-api-token'
  }
});

// 监听消息
socket.on('message', (msg) => {
  console.log('New message:', msg);
});

// 发送消息
socket.emit('message', {
  sessionId: 'sess_xxx',
  text: '帮我分析代码'
});
```

---

## 四、性能优化：大会话场景

### 4.1 问题分析

```
卡顿的主要原因：
┌─────────────────────────────────────────────────────────┐
│ 1. 消息累积          → 会话有 1000+ 条消息              │
│ 2. 全量传输          → WebSocket 传输整个历史            │
│ 3. 前端渲染          → 渲染 1000+ 个 DOM 节点            │
│ 4. 内存占用          → 服务端保存所有消息在内存          │
│ 5. 数据库查询        → 每次都查询所有历史消息            │
└─────────────────────────────────────────────────────────┘
```

### 4.2 核心解决方案：**增量同步 + 分页加载**

#### 优化措施对比

| 问题 | 优化方案 | 效果 |
|------|---------|------|
| **消息累积** | 内存只保留最近 100 条 | 内存占用降低 90% |
| **全量传输** | 增量同步（since 序号） | 网络传输降低 95% |
| **前端渲染** | 虚拟滚动 + 增量追加 | 渲染性能提升 10x |
| **数据库查询** | 分页查询 + 索引优化 | 查询时间 < 10ms |
| **长连接卡顿** | 心跳保活 + 连接池 | 稳定性提升 |

#### 增量消息传输流程

```
客户端启动：
1. 请求最近 50 条消息
   GET /messages?limit=50
   → 返回 messages[1-50]

2. 订阅新消息（SSE）
   GET /messages/stream?since=50
   → 只推送 seq > 50 的新消息

3. 向上滚动加载历史
   GET /messages?before=1&limit=50
   → 返回更早的 messages[-49-0]

服务端存储：
- 内存：最近 100 条消息
- 数据库：所有历史消息

关键：每个消息有唯一的递增序号（seq）
```

### 4.3 数据库设计

```sql
-- 会话表
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    metadata TEXT NOT NULL  -- JSON
);

-- 消息表（分片存储）
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    seq INTEGER NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,  -- JSON
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- 索引优化
CREATE INDEX idx_messages_session_seq ON messages(session_id, seq);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);

-- 定期清理旧消息（可选）
DELETE FROM messages WHERE timestamp < strftime('%s', 'now', '-30 days');
```

---

## 五、配置文件

### 5.1 服务器配置

```yaml
# configs/config.yaml
server:
  host: "0.0.0.0"
  port: 8080
  publicUrl: "http://localhost:8080"

cors:
  origins:
    - "http://localhost:3000"
    - "https://app.hapi.run"  # 允许 HAPI 前端

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
  permissionMode: "normal"
  allowedTools: []  # 留空表示所有工具

# 会话状态跟踪配置（新增）
session:
  # 状态更新频率（前端建议的轮询间隔）
  statusUpdateInterval: 1s

  # 处理时长阈值（仅用于前端显示警告，不强制停止）
  processingDurationWarning: 30s   # 超过此时长前端显示警告
  processingDurationCritical: 60s  # 超过此时长前端显示严重警告

# 健康监控配置（仅监控，不自动重启）
health:
  enabled: true
  checkInterval: 10s
  messageTimeout: 300s  # 仅用于发送警告事件，不自动终止
  sendWarning: true     # 发送超时警告
  restartOnCrash: false # ❌ 不自动重启

# 性能优化配置
performance:
  maxRecentMessages: 100    # 内存中保留的最大消息数
  messageBufferSize: 50     # WebSocket 消息缓冲区大小
  subscriberBufferSize: 50  # 订阅者消息通道缓冲区大小
```

---

## 六、部署方案

### 6.1 Docker 部署

```dockerfile
# deployments/docker/Dockerfile
FROM golang:1.23-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o ai-bridge ./cmd/ai-bridge

FROM alpine:latest

RUN apk add --no-cache ca-certificates

WORKDIR /root/

COPY --from=builder /app/ai-bridge .
COPY configs/ ./configs/

EXPOSE 8080

CMD ["./ai-bridge", "server", "--config", "./configs/config.yaml"]
```

```yaml
# deployments/docker/docker-compose.yaml
version: '3.8'

services:
  ai-bridge:
    build: .
    ports:
      - "8080:8080"
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - CLI_API_TOKEN=${CLI_API_TOKEN}
    volumes:
      - ./data:/root/data
      - ./configs:/root/configs
    restart: unless-stopped
```

### 6.2 本地开发

```bash
# 克隆项目
git clone https://github.com/your-org/ai-bridge.git
cd ai-bridge

# 安装依赖
go mod download

# 运行
go run cmd/ai-bridge/main.go --config configs/config.yaml

# 或编译后运行
go build -o ai-bridge ./cmd/ai-bridge
./ai-bridge server --config configs/config.yaml
```

---

## 七、测试方案

### 7.1 单元测试

```go
// tests/unit/process_test.go
func TestProcess_StartAndStop(t *testing.T) {
    proc := claude.NewProcess("test", claude.Config{
        WorkingDir: "/tmp/test",
    })

    ctx := context.Background()
    err := proc.Start(ctx)
    assert.NoError(t, err)
    assert.True(t, proc.IsRunning())

    err = proc.Stop(ctx)
    assert.NoError(t, err)
    assert.False(t, proc.IsRunning())
}

func TestProcess_SendMessage(t *testing.T) {
    // 测试发送消息
}
```

### 7.2 集成测试

```go
// tests/integration/api_test.go
func TestCreateSession(t *testing.T) {
    // 启动测试服务器
    server := setupTestServer()
    defer server.Close()

    // 创建会话
    resp := createSession(t, server.URL, "/tmp/test")
    assert.Equal(t, http.StatusCreated, resp.StatusCode)
}

func TestMessagePagination(t *testing.T) {
    // 测试分页加载
}
```

### 7.3 端到端测试

```bash
#!/bin/bash
# scripts/test-e2e.sh

echo "=== AI-Bridge E2E Test ==="

# 1. 检查环境
echo "1. Checking Claude Code CLI..."
if ! command -v claude &> /dev/null; then
    echo "❌ Claude Code CLI not found"
    exit 1
fi
echo "✅ Claude Code CLI: $(claude --version)"

# 2. 创建测试项目
echo ""
echo "2. Creating test project..."
TEST_DIR="/tmp/ai-bridge-test"
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# 创建简单项目
cat > main.go << 'EOF'
package main
func main() {}
EOF
go mod init test

# 创建自定义斜杠命令
mkdir -p .claude/commands
cat > .claude/commands/hello.md << 'EOF'
---
category: test
description: Say hello
---

This is a test command.
EOF

echo "✅ Test project created"

# 3. 编译并启动 ai-bridge
echo ""
echo "3. Starting ai-bridge..."
cd -
go build -o ai-bridge ./cmd/ai-bridge
./ai-bridge server --config configs/config.yaml &
SERVER_PID=$!
sleep 3

# 4. 创建会话
echo ""
echo "4. Creating session..."
RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d "{\"workingDirectory\":\"$TEST_DIR\",\"agent\":\"claude\"}")

SESSION_ID=$(echo $RESPONSE | jq -r '.id')
echo "✅ Session: $SESSION_ID"

# 5. 测试斜杠命令发现
echo ""
echo "5. Testing slash commands..."
CMDS=$(curl -s "http://localhost:8080/api/v1/commands?sessionId=$SESSION_ID" \
  -H "Authorization: Bearer test-token")
echo "$CMDS" | jq '.commands[] | select(.path == "hello")'
echo "✅ Custom command found"

# 6. 发送消息
echo ""
echo "6. Sending message..."
curl -s -X POST "http://localhost:8080/api/v1/sessions/$SESSION_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"text":"列出文件"}'
echo "✅ Message sent"

# 7. 清理
echo ""
echo "7. Cleanup..."
kill $SERVER_PID
rm -rf "$TEST_DIR"
echo "✅ Done"

echo ""
echo "=== All tests passed! ==="
```

---

## 八、实施计划

### Phase 1: 核心功能（4-5 周）

- [ ] **Week 1-2**: Claude Code 进程封装
  - [ ] Process 结构和配置
  - [ ] 启动/停止逻辑
  - [ ] 消息解析（JSON）
  - [ ] 权限处理

- [ ] **Week 3**: 进程池管理
  - [ ] Pool 结构
  - [ ] 进程复用逻辑
  - [ ] 健康检查

- [ ] **Week 4-5**: 会话管理
  - [ ] Session 结构
  - [ ] 会话状态跟踪（新增）
    - [ ] 状态枚举定义
    - [ ] GetStatus() 方法
    - [ ] 状态转换逻辑
  - [ ] 增量消息同步
  - [ ] 订阅者管理
  - [ ] 手动终止功能（新增）
    - [ ] Process.Interrupt() 方法
    - [ ] Session.Stop() 方法
    - [ ] 消息处理时长记录

### Phase 2: API 层（2-3 周）

- [ ] **Week 6-7**: HTTP API
  - [ ] 会话管理 API
    - [ ] 创建会话
    - [ ] 获取会话信息
    - [ ] 获取会话状态（新增）
    - [ ] 停止会话（新增）
  - [ ] 消息管理 API（分页、SSE）
  - [ ] 权限处理 API

- [ ] **Week 8**: WebSocket
  - [ ] Socket.IO 兼容实现
  - [ ] 增量推送

### Phase 3: 斜杠命令（1-2 周）

- [ ] **Week 9**: 命令发现和解析
  - [ ] 内置命令
  - [ ] 用户/项目命令
  - [ ] Markdown/TOML 解析

- [ ] **Week 10**: 命令 API
  - [ ] 列出命令
  - [ ] 执行命令

### Phase 4: 测试验证（1-2 周）

- [ ] **Week 11**: 单元测试和集成测试
- [ ] **Week 12**: 端到端测试（实际调用 Claude Code CLI）

### Phase 5: 生产就绪（1 周）

- [ ] **Week 13**: 错误处理、日志、文档、Docker 部署

**总计: 13 周（约 3 个月）**

---

## 九、前端集成示例

### 9.1 基础使用

```typescript
import { ClaudeBridge } from '@your-org/ai-bridge-sdk'

// 初始化
const bridge = new ClaudeBridge({
  serverUrl: 'http://localhost:8080',
  authToken: 'your-token'
})

// 创建会话
const session = await bridge.sessions.create({
  workingDirectory: '/my/project',
  agent: 'claude'
})

// 监听新消息（增量）
session.on('message', (msg) => {
  console.log('新消息:', msg)
})

// 发送消息
await session.sendMessage('帮我重构这个组件')

// 获取历史消息（分页）
const messages = await session.getMessages({
  limit: 50,
  since: 100
})
```

### 9.2 与 HAPI 前端集成

```bash
# 1. 克隆 HAPI web 仓库
git clone https://github.com/tiann/hapi.git
cd hapi/web

# 2. 修改 API endpoint
export VITE_API_URL=http://localhost:8080

# 3. 启动前端
npm install
npm run dev
```

### 9.3 会话状态监控（新增）

```typescript
// 会话状态监控
class AIBridgeClient {
  private statusInterval?: NodeJS.Timeout;

  // 开始监控会话状态
  startStatusMonitoring(sessionId: string, callback: (status: SessionStatus) => void) {
    this.statusInterval = setInterval(async () => {
      const status = await this.getSessionStatus(sessionId);
      callback(status);
    }, 1000); // 每秒更新
  }

  // 停止监控
  stopStatusMonitoring() {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
      this.statusInterval = undefined;
    }
  }

  // 获取会话状态
  async getSessionStatus(sessionId: string): Promise<SessionStatus> {
    const response = await fetch(
      `${this.serverUrl}/api/v1/sessions/${sessionId}/status`,
      {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.statusText}`);
    }

    return response.json();
  }

  // 停止会话
  async stopSession(sessionId: string, options?: StopOptions): Promise<StopResult> {
    const response = await fetch(
      `${this.serverUrl}/api/v1/sessions/${sessionId}/stop`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options || {}),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to stop session');
    }

    return response.json();
  }
}

// 使用示例
const client = new AIBridgeClient({
  serverUrl: 'http://localhost:8080',
  authToken: 'your-token',
});

const session = await client.createSession({
  workingDirectory: '/my/project',
});

// 开始监控状态
client.startStatusMonitoring(session.id, (status) => {
  console.log(`Session ${status.sessionId}: ${status.state}`);

  // 更新 UI
  if (status.state === 'processing') {
    const seconds = Math.floor(status.duration / 1000);
    updateStatus(`正在思考中... ${seconds}秒`);

    // 超过 30 秒显示警告
    if (status.duration > 30000) {
      showWarning('AI 正在深度思考,请耐心等待...');
    }
  } else if (status.state === 'idle') {
    updateStatus('就绪');
  }
});

// ESC 键停止
document.addEventListener('keydown', async (e) => {
  if (e.key === 'Escape') {
    e.preventDefault();

    // 检查是否有正在处理的会话
    const status = await client.getSessionStatus(session.id);

    if (status.state === 'processing') {
      // 确认对话框
      const confirmed = confirm('确定要停止当前操作吗?');
      if (confirmed) {
        await client.stopSession(session.id);
      }
    }
  }
});
```

### 9.4 React 状态组件示例（新增）

```typescript
// React 状态指示器组件
function SessionStatusIndicator({ sessionId }: { sessionId: string }) {
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 定期获取状态
    const interval = setInterval(async () => {
      try {
        const s = await client.getSessionStatus(sessionId);
        setStatus(s);
      } catch (error) {
        console.error('Failed to get status:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId]);

  if (!status) {
    return <div>加载中...</div>;
  }

  // 状态指示器
  const statusColor = {
    idle: 'gray',
    processing: 'blue',
    waiting: 'yellow',
    error: 'red',
    stopped: 'gray',
  }[status.state];

  const duration = Math.floor(status.duration / 1000);

  return (
    <div className="flex items-center gap-2">
      {/* 状态指示灯 */}
      <div className={`w-2 h-2 rounded-full bg-${statusColor}-500`} />

      {/* 状态文本 */}
      <span>
        {status.state === 'processing' && `正在思考中... ${duration}秒`}
        {status.state === 'idle' && '就绪'}
        {status.state === 'waiting' && '等待权限...'}
        {status.state === 'error' && '错误'}
        {status.state === 'stopped' && '已停止'}
      </span>

      {/* 停止按钮 */}
      {(status.state === 'processing' || status.state === 'waiting') && (
        <button
          onClick={() => client.stopSession(sessionId)}
          className="px-2 py-1 bg-red-500 text-white rounded"
        >
          停止 (ESC)
        </button>
      )}
    </div>
  );
}
```

---

## 十、性能指标

### 目标性能

| 指标 | 目标值 |
|------|--------|
| **单会话内存占用** | < 50MB (即使有 10,000 条消息) |
| **消息传输延迟** | < 100ms (增量推送) |
| **API 响应时间** | < 50ms (P95) |
| **并发会话数** | 100+ |
| **消息吞吐量** | 1000 msg/s |
| **数据库查询** | < 10ms (分页查询) |

### 监控指标

```go
// internal/metrics/metrics.go
type Metrics struct {
    // 会话统计
    ActiveSessions   int64
    TotalMessages    int64
    MessagesPerSec   float64

    // WebSocket 统计
    ActiveConnections int64
    MessagesSent      int64

    // 性能指标
    AvgMessageLatency time.Duration
    P95MessageLatency time.Duration
    P99MessageLatency time.Duration
}
```

---

## 十一、安全考虑

### 11.1 访问控制

- JWT 认证
- API Token 验证
- CORS 配置

### 11.2 权限隔离

- 每个会话独立工作目录
- 工具白名单/黑名单
- 文件系统访问限制

### 11.3 资源限制

- 最大并发实例数
- 会话超时清理
- 内存/CPU 使用监控

---

## 十二、故障排查

### 常见问题

**Q: Claude Code CLI 启动失败**
```
A: 检查：
1. claude 命令是否在 PATH 中
2. 是否已登录 (claude auth login)
3. 配置文件是否正确
```

**Q: 消息延迟很高**
```
A: 可能原因：
1. 网络问题 → 检查 WebSocket 连接
2. 进程池满 → 增加 maxInstances
3. 数据库慢 → 检查索引
```

**Q: 内存占用高**
```
A: 检查：
1. maxRecentMessages 设置
2. 是否有泄漏的会话
3. 数据库连接池大小
```

**Q: 会话一直处于 processing 状态**
```
A: 可能原因：
1. AI 正在处理复杂任务（查看 duration 判断）
2. 进程卡死（使用手动终止功能）
3. 网络中断（检查连接状态）

解决方案：
- 使用 GET /api/v1/sessions/:id/status 查看状态
- 如果需要，使用 POST /api/v1/sessions/:id/stop 手动停止
- 按 ESC 键（前端集成）快速停止
```

**Q: 手动停止不生效**
```
A: 检查：
1. 会话是否处于 processing 或 waiting 状态
2. Claude Code CLI 是否支持 ESC 中断
3. 尝试强制停止（force: true）

示例：
POST /api/v1/sessions/:id/stop
{
  "force": true
}
```

---

## 附录

### A. 相关资源

- [Claude Code CLI 文档](https://code.claude.com/docs)
- [HAPI 项目](https://github.com/tiann/hapi)
- [Socket.IO 文档](https://socket.io/docs/)

### B. 贡献指南

欢迎贡献！请查看 CONTRIBUTING.md

### C. 许可证

MIT License

---

**文档版本**: 1.1
**最后更新**: 2026-02-04
**更新内容**:
- ✅ 添加会话状态跟踪功能
- ✅ 添加手动终止功能（类似 ESC 键）
- ✅ 新增 GET /api/v1/sessions/:id/status API
- ✅ 新增 POST /api/v1/sessions/:id/stop API
- ✅ 添加前端状态监控和停止示例
- ✅ 移除自动超时配置（改为手动控制）
- ✅ 更新健康监控策略（仅警告，不自动重启）
