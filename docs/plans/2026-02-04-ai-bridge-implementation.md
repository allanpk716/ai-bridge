# AI-Bridge 完整实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现 AI-Bridge - 一个轻量级 Go 中间件,为 Claude Code CLI 提供远程访问能力,支持 HAPI 兼容 API、会话状态跟踪、手动终止功能和斜杠命令支持。

**Architecture:** 采用分层架构 - HTTP API 层、WebSocket 层、Claude Code 管理层、进程池管理层。使用 GORM + SQLite (WAL模式) 做持久化,实现增量消息同步优化。

**Tech Stack:** Go 1.23, GORM, SQLite (WAL), Socket.IO, testify (测试), fsnotify (配置热更新)

---

## ⚠️ 关键问题修复清单

**在执行任何任务前,必须先修复以下问题:**

### P0 - 必须修复(否则无法编译)
1. **Event结构体字段错误** - `process.go:962` 使用了不存在的`ProcessID`字段
   - 修复: 将`ProcessID: p.id`改为`SessionID: p.id`

2. **缺少SetMessageCallbacks方法** - `manager.go:1751`调用未定义的方法
   - 修复: 在`internal/claude/process.go`中添加`SetMessageCallbacks`方法

3. **缺少time导入** - `manager.go:1747`使用`time.Now()`但未导入
   - 修复: 在import中添加`"time"`

4. **缺少YAML依赖** - Step 2缺少`gopkg.in/yaml.v3`
   - 修复: 在安装依赖步骤中添加`go get gopkg.in/yaml.v3`

### P1 - 应该修复(功能问题)
5. **进程池缺少复用逻辑** - 每次Acquire都创建新进程
6. **并发安全问题** - readOutputLoop的startTime变量
7. **缺少idle timeout清理** - Pool配置了但未实现

---

## Task 1: 项目初始化和基础结构

**Files:**
- Create: `go.mod`
- Create: `go.sum`
- Create: `Makefile`
- Create: `.gitignore`
- Create: `README.md`
- Create: `configs/config.yaml.example`
- Create: `cmd/ai-bridge/main.go`

**Step 1: 初始化 Go 模块**

```bash
go mod init github.com/your-org/ai-bridge
```

**Step 2: 安装依赖**

```bash
go get github.com/stretchr/testify@v1.9.0
go get gorm.io/gorm@v1.25.12
go get gorm.io/driver/sqlite@v1.5.6
go get github.com/WQGroup/logger
go get github.com/gin-gonic/gin@v1.10.0
go get github.com/gorilla/websocket@v1.5.3
go get github.com/fsnotify/fsnotify@v1.7.0
```

**Step 3: 创建项目目录结构**

```bash
mkdir -p internal/claude internal/pool internal/session internal/commands internal/api internal/websocket internal/config internal/health pkg/protocol tests/integration tests/unit configs scripts
```

**Step 4: 创建 Makefile**

```makefile
.PHONY: build test test-unit test-integration test-e2e test-all clean run

# Build
build:
	go build -o bin/ai-bridge.exe ./cmd/ai-bridge

# Test
test-all:
	go test -v -race -coverprofile=coverage.out ./...

test-unit:
	go test -v -short ./internal/...

test-integration:
	go test -v -tags=integration ./tests/integration/...

test-e2e:
	./scripts/test-e2e.bat

test-coverage:
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Run
run:
	go run cmd/ai-bridge/main.go --config configs/config.yaml

# Clean
clean:
	rm -rf bin/ coverage.out coverage.html
```

**Step 5: 创建 .gitignore**

```text
# Binaries
bin/
*.exe
*.dll
*.so
*.dylib
ai-bridge

# Test and coverage
*.out
coverage.html
coverage.xml

# Dependencies
vendor/

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Data
data/
*.db
*.db-shm
*.db-wal

# Config
configs/config.yaml
```

**Step 6: 创建主程序入口**

```go
// cmd/ai-bridge/main.go
package main

import (
    "context"
    "flag"
    "fmt"
    "os"
    "os/signal"
    "syscall"

    "ai-bridge/internal/config"
    "ai-bridge/internal/api"
    "ai-bridge/internal/session"
    "github.com/WQGroup/logger"
)

var (
    configPath = flag.String("config", "configs/config.yaml", "Path to config file")
    version    = "1.0.0"
)

func main() {
    flag.Parse()

    // Load configuration
    cfg, err := config.Load(*configPath)
    if err != nil {
        logger.Fatalf("Failed to load config: %v", err)
    }

    // Initialize logger
    logger.SetLoggerName("ai-bridge")
    logger.SetLoggerLevel(cfg.Logging.Level)
    logger.SetLoggerRootDir(cfg.Logging.RootDir)

    logger.Infof("Starting AI-Bridge v%s", version)

    // Create session manager
    sessionManager := session.NewManager(cfg)

    // Start HTTP server
    server := api.NewServer(cfg, sessionManager)

    // Handle shutdown
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()

    sigChan := make(chan os.Signal, 1)
    signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

    go func() {
        <-sigChan
        logger.Info("Shutting down...")
        server.Shutdown(ctx)
    }()

    // Start server
    if err := server.Start(); err != nil {
        logger.Fatalf("Server error: %v", err)
    }
}
```

**Step 7: 运行测试确保编译通过**

```bash
go build ./cmd/ai-bridge
```

**Step 8: Commit**

```bash
git add .
git commit -m "feat: initialize project structure and dependencies"
```

---

## Task 2: 协议类型定义

**Files:**
- Create: `pkg/protocol/types.go`
- Create: `pkg/protocol/messages.go`
- Create: `pkg/protocol/events.go`

**Step 1: 定义消息类型**

```go
// pkg/protocol/types.go
package protocol

import "time"

// MessageType 消息类型
type MessageType string

const (
    MessageTypeUser       MessageType = "user"
    MessageTypeAssistant  MessageType = "assistant"
    MessageTypeToolUse    MessageType = "tool_use"
    MessageTypeToolResult MessageType = "tool_result"
    MessageTypePermission MessageType = "permission_request"
    MessageTypeError      MessageType = "error"
)

// SessionState 会话状态
type SessionState string

const (
    StateIdle       SessionState = "idle"
    StateProcessing SessionState = "processing"
    StateWaiting    SessionState = "waiting"
    StateError      SessionState = "error"
    StateStopped    SessionState = "stopped"
)

// Message 消息结构
type Message struct {
    Seq                int64       `json:"seq"`
    Type               MessageType `json:"type"`
    Content            interface{} `json:"content"`
    Timestamp           time.Time   `json:"timestamp"`
    ProcessingDuration  int64       `json:"processingDuration,omitempty"`
    ProcessingStarted   int64       `json:"processingStarted,omitempty"`
    ProcessingEnded     int64       `json:"processingEnded,omitempty"`
    Status              string      `json:"status,omitempty"`
}

// SessionStatus 会话状态信息
type SessionStatus struct {
    SessionID       string       `json:"sessionId"`
    State           SessionState `json:"state"`
    Duration        int64        `json:"duration"`
    StartTime       int64        `json:"startTime"`
    LastMessageSeq  int64        `json:"lastMessageSeq"`
    LastMessageType string       `json:"lastMessageType"`
    LastMessageTime int64        `json:"lastMessageTime"`
    TotalMessages   int64        `json:"totalMessages"`
    ProcessingCount int64        `json:"processingCount"`
    Error           string       `json:"error,omitempty"`
    ErrorCode       string       `json:"errorCode,omitempty"`
    Metadata        SessionMetadata `json:"metadata,omitempty"`
}

// SessionMetadata 会话元数据
type SessionMetadata struct {
    WorkingDir    string `json:"workingDirectory"`
    Model         string `json:"model"`
    Agent         string `json:"agent"`
    PermissionMode string `json:"permissionMode"`
}
```

**Step 2: 定义权限请求类型**

```go
// pkg/protocol/messages.go
package protocol

// PermissionRequest 权限请求
type PermissionRequest struct {
    RequestID string `json:"requestId"`
    ToolName  string `json:"toolName"`
    Reason    string `json:"reason"`
}

// PermissionResponse 权限响应
type PermissionResponse struct {
    RequestID string `json:"requestId"`
    Approved  bool   `json:"approved"`
    Scope     string `json:"scope"` // "once" or "session"
}

// ToolUse 工具使用
type ToolUse struct {
    ToolName string                 `json:"toolName"`
    Input    map[string]interface{} `json:"input"`
}

// ToolResult 工具结果
type ToolResult struct {
    ToolName string `json:"toolName"`
    Output   string `json:"output"`
    Error    string `json:"error,omitempty"`
}
```

**Step 3: 定义事件类型**

```go
// pkg/protocol/events.go
package protocol

import "time"

// EventType 事件类型
type EventType string

const (
    EventTypeSessionCreated  EventType = "session_created"
    EventTypeSessionClosed   EventType = "session_closed"
    EventTypeMessageReceived EventType = "message_received"
    EventTypePermissionRequested EventType = "permission_requested"
    EventTypeError           EventType = "error"
)

// Event 事件
type Event struct {
    Type      EventType   `json:"type"`
    SessionID string      `json:"sessionId"`
    Timestamp time.Time   `json:"timestamp"`
    Data      interface{} `json:"data"`
}
```

**Step 4: 运行测试**

```bash
go test ./pkg/protocol/...
```

**Step 5: Commit**

```bash
git add pkg/protocol/
git commit -m "feat: add protocol types and message definitions"
```

---

## Task 3: 配置管理

**Files:**
- Create: `internal/config/config.go`
- Create: `configs/config.yaml.example`

**Step 1: 定义配置结构**

```go
// internal/config/config.go
package config

import (
    "fmt"
    "os"

    "github.com/fsnotify/fsnotify"
    "gopkg.in/yaml.v3"
)

// Config 应用配置
type Config struct {
    Server    ServerConfig    `yaml:"server"`
    CORS      CORSConfig      `yaml:"cors"`
    Database  DatabaseConfig  `yaml:"database"`
    Auth      AuthConfig      `yaml:"auth"`
    Pool      PoolConfig      `yaml:"pool"`
    Claude    ClaudeConfig    `yaml:"claude"`
    Session   SessionConfig   `yaml:"session"`
    Health    HealthConfig    `yaml:"health"`
    Logging   LoggingConfig   `yaml:"logging"`
}

// ServerConfig 服务器配置
type ServerConfig struct {
    Host      string `yaml:"host"`
    Port      int    `yaml:"port"`
    PublicURL string `yaml:"publicUrl"`
}

// CORSConfig CORS配置
type CORSConfig struct {
    Origins []string `yaml:"origins"`
}

// DatabaseConfig 数据库配置
type DatabaseConfig struct {
    Path string `yaml:"path"`
    GORM struct {
        Mode             string `yaml:"mode"`
        MaxIdleConns     int    `yaml:"maxIdleConns"`
        MaxOpenConns     int    `yaml:"maxOpenConns"`
        ConnMaxLifetime  string `yaml:"connMaxLifetime"`
        ConnMaxIdleTime  string `yaml:"connMaxIdleTime"`
    } `yaml:"gorm"`
    BatchSize     int `yaml:"batchSize"`
    BatchTimeout  int `yaml:"batchTimeout"`
}

// AuthConfig 认证配置
type AuthConfig struct {
    JWTSecret  string `yaml:"jwtSecret"`
    CliApiToken string `yaml:"cliApiToken"`
}

// PoolConfig 进程池配置
type PoolConfig struct {
    MaxInstances int    `yaml:"maxInstances"`
    IdleTimeout  string `yaml:"idleTimeout"`
}

// ClaudeConfig Claude配置
type ClaudeConfig struct {
    DefaultModel   string   `yaml:"defaultModel"`
    PermissionMode string   `yaml:"permissionMode"`
    AllowedTools   []string `yaml:"allowedTools"`
}

// SessionConfig 会话配置
type SessionConfig struct {
    StatusUpdateInterval       string `yaml:"statusUpdateInterval"`
    ProcessingDurationWarning  string `yaml:"processingDurationWarning"`
    ProcessingDurationCritical string `yaml:"processingDurationCritical"`
}

// HealthConfig 健康监控配置
type HealthConfig struct {
    Enabled         bool   `yaml:"enabled"`
    CheckInterval   string `yaml:"checkInterval"`
    MessageTimeout  string `yaml:"messageTimeout"`
    SendWarning     bool   `yaml:"sendWarning"`
    RestartOnCrash  bool   `yaml:"restartOnCrash"`
}

// LoggingConfig 日志配置
type LoggingConfig struct {
    Level  string `yaml:"level"`
    RootDir string `yaml:"rootDir"`
}

// Load 加载配置
func Load(path string) (*Config, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, fmt.Errorf("failed to read config: %w", err)
    }

    var cfg Config
    if err := yaml.Unmarshal(data, &cfg); err != nil {
        return nil, fmt.Errorf("failed to parse config: %w", err)
    }

    // Apply env overrides
    cfg.applyEnvOverrides()

    // Validate
    if err := cfg.Validate(); err != nil {
        return nil, err
    }

    return &cfg, nil
}

// applyEnvOverrides 应用环境变量覆盖
func (c *Config) applyEnvOverrides() {
    if host := os.Getenv("AI_BRIDGE_HOST"); host != "" {
        c.Server.Host = host
    }
    if port := os.Getenv("AI_BRIDGE_PORT"); port != "" {
        fmt.Sscanf(port, "%d", &c.Server.Port)
    }
    if secret := os.Getenv("JWT_SECRET"); secret != "" {
        c.Auth.JWTSecret = secret
    }
    if token := os.Getenv("CLI_API_TOKEN"); token != "" {
        c.Auth.CliApiToken = token
    }
}

// Validate 验证配置
func (c *Config) Validate() error {
    if c.Server.Port <= 0 || c.Server.Port > 65535 {
        return fmt.Errorf("invalid port: %d", c.Server.Port)
    }
    if c.Database.Path == "" {
        return fmt.Errorf("database path is required")
    }
    if c.Auth.CliApiToken == "" || c.Auth.CliApiToken == "your-token-here" {
        return fmt.Errorf("CLI API token must be set")
    }
    return nil
}

// Watch 监听配置文件变化
func (c *Config) Watch(path string, onChange func(*Config) error) (*fsnotify.Watcher, error) {
    watcher, err := fsnotify.NewWatcher()
    if err != nil {
        return nil, err
    }

    if err := watcher.Add(path); err != nil {
        watcher.Close()
        return nil, err
    }

    go func() {
        for {
            select {
            case event, ok := <-watcher.Events:
                if !ok {
                    return
                }
                if event.Op&fsnotify.Write == fsnotify.Write {
                    newCfg, err := Load(path)
                    if err != nil {
                        continue
                    }
                    if err := onChange(newCfg); err == nil {
                        *c = *newCfg
                    }
                }
            case err, ok := <-watcher.Errors:
                if !ok {
                    return
                }
                _ = err
            }
        }
    }()

    return watcher, nil
}
```

**Step 2: 创建配置示例文件**

```yaml
# configs/config.yaml.example
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
  gorm:
    mode: "WAL"
    maxIdleConns: 10
    maxOpenConns: 100
    connMaxLifetime: "1h"
    connMaxIdleTime: "10m"
  batchSize: 50
  batchTimeout: 100

auth:
  jwtSecret: "${JWT_SECRET:-change-this-in-production}"
  cliApiToken: "${CLI_API_TOKEN:-your-token-here}"

pool:
  maxInstances: 5
  idleTimeout: "300s"

claude:
  defaultModel: "haiku"
  permissionMode: "normal"
  allowedTools: []

session:
  statusUpdateInterval: "1s"
  processingDurationWarning: "30s"
  processingDurationCritical: "60s"

health:
  enabled: true
  checkInterval: "10s"
  messageTimeout: "300s"
  sendWarning: true
  restartOnCrash: false

logging:
  level: "info"
  rootDir: "./logs"
```

**Step 3: 运行测试**

```bash
go test ./internal/config/...
```

**Step 4: Commit**

```bash
git add internal/config/ configs/
git commit -m "feat: add configuration management with hot reload support"
```

---

## Task 4: GORM 数据库模型和 WAL 模式

**Files:**
- Create: `internal/session/store.go`

**Step 1: 定义数据库模型**

```go
// internal/session/store.go
package session

import (
    "time"
    "gorm.io/gorm"
    "gorm.io/driver/sqlite"
)

// BaseModel 基础模型
type BaseModel struct {
    ID        uint      `gorm:"primaryKey"`
    CreatedAt time.Time `gorm:"index"`
    UpdatedAt time.Time `gorm:"index"`
}

// SessionDB 数据库会话模型
type SessionDB struct {
    BaseModel
    SessionID   string `gorm:"uniqueIndex;size:64"`
    Status      string `gorm:"index;size:32"`
    WorkingDir  string `gorm:"size:512"`
    Model       string `gorm:"size:64"`
    Agent       string `gorm:"size:64"`
    MessageCount int64  `gorm:"default:0"`
    LastSeq      int64  `gorm:"default:0"`
    Messages     []MessageDB `gorm:"foreignKey:SessionID;constraint:OnDelete:CASCADE"`
}

// MessageDB 数据库消息模型
type MessageDB struct {
    BaseModel
    SessionID    string `gorm:"index:idx_session_seq,priority:1;index:idx_session_created,priority:1;size:64"`
    Seq          int64  `gorm:"index:idx_session_seq,priority:2;not null"`
    Type         string `gorm:"index;size:32"`
    Content      string `gorm:"type:text"`
    Timestamp    int64  `gorm:"index:idx_session_created,priority:2"`
    MessageHash  string `gorm:"index;size:64"`
}

// SessionStore 会话存储
type SessionStore struct {
    db *gorm.DB
}

// NewSessionStore 创建会话存储
func NewSessionStore(dbPath string) (*SessionStore, error) {
    db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
        SkipDefaultTransaction: true,
        PrepareStmt:            true,
    })
    if err != nil {
        return nil, err
    }

    // Configure connection pool
    sqlDB, err := db.DB()
    if err != nil {
        return nil, err
    }

    sqlDB.SetMaxIdleConns(10)
    sqlDB.SetMaxOpenConns(100)
    sqlDB.SetConnMaxLifetime(1 * time.Hour)

    // Enable WAL mode
    if err := enableWALMode(db); err != nil {
        return nil, err
    }

    // Auto migrate
    if err := db.AutoMigrate(&SessionDB{}, &MessageDB{}); err != nil {
        return nil, err
    }

    return &SessionStore{db: db}, nil
}

// enableWALMode 启用 WAL 模式
func enableWALMode(db *gorm.DB) error {
    if err := db.Exec("PRAGMA journal_mode=WAL").Error; err != nil {
        return err
    }
    if err := db.Exec("PRAGMA synchronous=NORMAL").Error; err != nil {
        return err
    }
    if err := db.Exec("PRAGMA cache_size=-64000").Error; err != nil {
        return err
    }
    if err := db.Exec("PRAGMA temp_store=MEMORY").Error; err != nil {
        return err
    }
    if err := db.Exec("PRAGMA busy_timeout=5000").Error; err != nil {
        return err
    }
    return nil
}

// CreateSession 创建会话
func (s *SessionStore) CreateSession(sess *SessionDB) error {
    return s.db.Create(sess).Error
}

// GetSession 获取会话
func (s *SessionStore) GetSession(sessionID string) (*SessionDB, error) {
    var sess SessionDB
    err := s.db.Where("session_id = ?", sessionID).First(&sess).Error
    if err != nil {
        return nil, err
    }
    return &sess, nil
}

// BatchWriteMessages 批量写入消息
func (s *SessionStore) BatchWriteMessages(messages []*MessageDB) error {
    if len(messages) == 0 {
        return nil
    }

    batchSize := 50
    for i := 0; i < len(messages); i += batchSize {
        end := i + batchSize
        if end > len(messages) {
            end = len(messages)
        }

        batch := messages[i:end]
        if err := s.db.CreateInBatches(batch, batchSize).Error; err != nil {
            return err
        }
    }

    return nil
}

// GetMessages 获取消息
func (s *SessionStore) GetMessages(sessionID string, opts GetMessagesOptions) ([]*MessageDB, error) {
    var messages []*MessageDB

    query := s.db.Where("session_id = ?", sessionID)

    if opts.SinceSeq > 0 {
        query = query.Where("seq > ?", opts.SinceSeq)
    }
    if opts.BeforeSeq > 0 {
        query = query.Where("seq < ?", opts.BeforeSeq)
    }
    if opts.Limit > 0 {
        query = query.Limit(opts.Limit)
    }

    err := query.Order("seq DESC").Find(&messages).Error
    return messages, err
}

// Close 关闭数据库连接
func (s *SessionStore) Close() error {
    sqlDB, err := s.db.DB()
    if err != nil {
        return err
    }
    return sqlDB.Close()
}

// GetMessagesOptions 获取消息选项
type GetMessagesOptions struct {
    SinceSeq  int64
    BeforeSeq int64
    Limit     int
}
```

**Step 2: 运行测试**

```bash
go test ./internal/session/...
```

**Step 3: Commit**

```bash
git add internal/session/
git commit -m "feat: add GORM database models with WAL mode support"
```

---

## Task 5: Claude Code 进程封装 (核心)

**Files:**
- Create: `internal/claude/process.go`
- Create: `internal/claude/message.go`
- Create: `internal/claude/permission.go`
- Create: `internal/claude/config.go`

**Step 1: 定义进程配置**

```go
// internal/claude/config.go
package claude

import "time"

// Config Claude Code 配置
type Config struct {
    WorkingDir      string        `json:"workingDirectory"`
    Model           string        `json:"model,omitempty"`
    PermissionMode  string        `json:"permissionMode"`
    AllowedTools    []string      `json:"allowedTools,omitempty"`
    DisallowedTools []string      `json:"disallowedTools,omitempty"`
    MaxTurns        int           `json:"maxTurns,omitempty"`
    EnvVars         map[string]string `json:"envVars,omitempty"`
}
```

**Step 2: 实现进程管理**

```go
// internal/claude/process.go
package claude

import (
    "bufio"
    "context"
    "encoding/json"
    "fmt"
    "io"
    "os/exec"
    "sync"
    "sync/atomic"
    "syscall"
    "time"

    "ai-bridge/pkg/protocol"
    "github.com/WQGroup/logger"
)

// Process Claude Code CLI 进程封装
type Process struct {
    id        string
    config    Config
    cmd       *exec.Cmd
    stdin     io.WriteCloser
    stdout    io.ReadCloser
    stderr    io.ReadCloser

    messageChan chan protocol.Message
    errorChan   chan error
    eventChan   chan protocol.Event

    mu      sync.RWMutex
    running bool
    started time.Time

    // Message sequence
    lastSeq       int64
    onMessageStarted  func(seq int64)
    onMessageEnded    func(seq int64, duration time.Duration)
}

// NewProcess 创建进程
func NewProcess(id string, config Config) *Process {
    return &Process{
        id:          id,
        config:      config,
        messageChan: make(chan protocol.Message, 100),
        errorChan:   make(chan error, 10),
        eventChan:   make(chan protocol.Event, 10),
    }
}

// Start 启动进程
func (p *Process) Start(ctx context.Context) error {
    p.mu.Lock()
    defer p.mu.Unlock()

    if p.running {
        return fmt.Errorf("process already running")
    }

    logger.Infof("Starting Claude Code process: %s", p.id)

    // Build command
    p.cmd = exec.CommandContext(ctx, "claude")
    p.cmd.Dir = p.config.WorkingDir

    // Set up pipes
    stdin, err := p.cmd.StdinPipe()
    if err != nil {
        return fmt.Errorf("failed to create stdin: %w", err)
    }
    p.stdin = stdin

    stdout, err := p.cmd.StdoutPipe()
    if err != nil {
        return fmt.Errorf("failed to create stdout: %w", err)
    }
    p.stdout = stdout

    stderr, err := p.cmd.StderrPipe()
    if err != nil {
        return fmt.Errorf("failed to create stderr: %w", err)
    }
    p.stderr = stderr

    // Set environment variables
    if len(p.config.EnvVars) > 0 {
        env := p.cmd.Environ()
        for k, v := range p.config.EnvVars {
            env = append(env, fmt.Sprintf("%s=%s", k, v))
        }
        p.cmd.Env = env
    }

    // Start process
    if err := p.cmd.Start(); err != nil {
        return fmt.Errorf("failed to start process: %w", err)
    }

    p.running = true
    p.started = time.Now()

    // Start output reader
    go p.readOutputLoop()
    go p.readErrorLoop()

    // Send started event
    p.eventChan <- protocol.Event{
        Type:      protocol.EventTypeSessionCreated,
        ProcessID: p.id,
        Timestamp: time.Now(),
    }

    logger.Infof("Claude Code process started: %s", p.id)
    return nil
}

// Stop 停止进程
func (p *Process) Stop(ctx context.Context) error {
    p.mu.Lock()
    defer p.mu.Unlock()

    if !p.running {
        return fmt.Errorf("process not running")
    }

    logger.Infof("Stopping Claude Code process: %s", p.id)

    // Try graceful shutdown first
    if p.stdin != nil {
        p.stdin.Write([]byte{0x04}) // EOF
        time.Sleep(100 * time.Millisecond)
    }

    // Then kill
    if p.cmd.Process != nil {
        p.cmd.Process.Signal(syscall.SIGTERM)
        time.Sleep(500 * time.Millisecond)
        p.cmd.Process.Kill()
    }

    p.running = false

    // Send stopped event
    p.eventChan <- protocol.Event{
        Type:      protocol.EventTypeSessionClosed,
        ProcessID: p.id,
        Timestamp: time.Now(),
    }

    logger.Infof("Claude Code process stopped: %s", p.id)
    return nil
}

// Interrupt 发送中断信号(ESC键)
func (p *Process) Interrupt(ctx context.Context) error {
    p.mu.Lock()
    defer p.mu.Unlock()

    if !p.running {
        return fmt.Errorf("process not running")
    }

    logger.Infof("Sending interrupt signal to process %s", p.id)

    // Send ESC character
    if _, err := p.stdin.Write([]byte{0x1b}); err != nil {
        return fmt.Errorf("failed to send ESC: %w", err)
    }

    return nil
}

// SendMessage 发送消息
func (p *Process) SendMessage(ctx context.Context, text string) error {
    p.mu.Lock()
    defer p.mu.Unlock()

    if !p.running {
        return fmt.Errorf("process not running")
    }

    // Generate sequence number
    seq := p.nextSeq()

    // Callback: start processing
    if p.onMessageStarted != nil {
        p.onMessageStarted(seq)
    }

    // Write to stdin
    if _, err := fmt.Fprintln(p.stdin, text); err != nil {
        return fmt.Errorf("failed to send message: %w", err)
    }

    logger.Debugf("Message sent to process %s: seq=%d", p.id, seq)
    return nil
}

// Messages 返回消息通道
func (p *Process) Messages() <-chan protocol.Message {
    return p.messageChan
}

// Errors 返回错误通道
func (p *Process) Errors() <-chan error {
    return p.errorChan
}

// Events 返回事件通道
func (p *Process) Events() <-chan protocol.Event {
    return p.eventChan
}

// IsRunning 检查进程是否运行中
func (p *Process) IsRunning() bool {
    p.mu.RLock()
    defer p.mu.RUnlock()
    return p.running
}

// ID 返回进程ID
func (p *Process) ID() string {
    return p.id
}

// nextSeq 生成下一个序号
func (p *Process) nextSeq() int64 {
    return atomic.AddInt64(&p.lastSeq, 1)
}

// readOutputLoop 读取输出循环
func (p *Process) readOutputLoop() {
    scanner := bufio.NewScanner(p.stdout)
    var startTime time.Time

    for scanner.Scan() {
        line := scanner.Text()

        // Parse message
        var msgData map[string]interface{}
        if err := json.Unmarshal([]byte(line), &msgData); err != nil {
            logger.Warnf("Failed to parse output: %v", err)
            continue
        }

        msg := p.parseMessage(msgData)

        // Check if message started
        if msg.Status == "started" {
            startTime = time.Now()
        }

        // Check if message completed
        if msg.Status == "completed" || msg.Status == "failed" {
            duration := time.Since(startTime)

            // Callback: message ended
            if p.onMessageEnded != nil && msg.Seq > 0 {
                p.onMessageEnded(msg.Seq, duration)
            }

            msg.ProcessingDuration = duration.Milliseconds()
            msg.ProcessingEnded = time.Now().UnixMilli()
        }

        // Send to channel
        select {
        case p.messageChan <- msg:
        default:
            logger.Warn("Message channel full, dropping message")
        }
    }

    if err := scanner.Err(); err != nil {
        p.errorChan <- fmt.Errorf("scanner error: %w", err)
    }
}

// readErrorLoop 读取错误循环
func (p *Process) readErrorLoop() {
    scanner := bufio.NewScanner(p.stderr)

    for scanner.Scan() {
        line := scanner.Text()
        logger.Errorf("Claude Code error [%s]: %s", p.id, line)

        p.errorChan <- fmt.Errorf("claude error: %s", line)
    }
}

// parseMessage 解析消息
func (p *Process) parseMessage(data map[string]interface{}) protocol.Message {
    msg := protocol.Message{
        Timestamp: time.Now(),
    }

    if seq, ok := data["seq"].(float64); ok {
        msg.Seq = int64(seq)
    }

    if msgType, ok := data["type"].(string); ok {
        msg.Type = protocol.MessageType(msgType)
    }

    msg.Content = data["content"]

    if status, ok := data["status"].(string); ok {
        msg.Status = status
    }

    return msg
}
```

**Step 3: 实现权限处理**

```go
// internal/claude/permission.go
package claude

import (
    "context"
    "fmt"
)

// SendApproval 发送权限批准
func (p *Process) SendApproval(ctx context.Context, requestID string, approved bool, scope string) error {
    p.mu.Lock()
    defer p.mu.Unlock()

    if !p.running {
        return fmt.Errorf("process not running")
    }

    var response string
    if approved {
        response = fmt.Sprintf("approve %s %s", requestID, scope)
    } else {
        response = fmt.Sprintf("deny %s", requestID)
    }

    if _, err := fmt.Fprintln(p.stdin, response); err != nil {
        return fmt.Errorf("failed to send approval: %w", err)
    }

    logger.Infof("Permission decision sent: %s -> approved=%v, scope=%s", requestID, approved, scope)
    return nil
}
```

**Step 4: 运行测试**

```bash
go test ./internal/claude/...
```

**Step 5: Commit**

```bash
git add internal/claude/
git commit -m "feat: add Claude Code process wrapper with interrupt support"
```

---

## Task 6: 进程池管理

**Files:**
- Create: `internal/pool/pool.go`
- Create: `internal/pool/instance.go`

**Step 1: 实现进程池**

```go
// internal/pool/pool.go
package pool

import (
    "context"
    "fmt"
    "sync"
    "time"

    "ai-bridge/internal/claude"
    "github.com/WQGroup/logger"
)

// Pool 进程池
type Pool struct {
    mu        sync.RWMutex
    processes map[string]*claude.Process
    config    Config
}

// Config 进程池配置
type Config struct {
    MaxInstances int
    IdleTimeout  time.Duration
}

// NewPool 创建进程池
func NewPool(config Config) *Pool {
    return &Pool{
        processes: make(map[string]*claude.Process),
        config:    config,
    }
}

// Acquire 获取进程
func (p *Pool) Acquire(ctx context.Context, config claude.Config) (*claude.Process, error) {
    p.mu.Lock()
    defer p.mu.Unlock()

    // Check if we can create new process
    if len(p.processes) >= p.config.MaxInstances {
        return nil, fmt.Errorf("max instances (%d) reached", p.config.MaxInstances)
    }

    // Create new process
    procID := fmt.Sprintf("proc-%d", time.Now().UnixNano())
    proc := claude.NewProcess(procID, config)

    if err := proc.Start(ctx); err != nil {
        return nil, err
    }

    p.processes[procID] = proc
    logger.Infof("Process acquired: %s (total: %d)", procID, len(p.processes))

    return proc, nil
}

// Release 释放进程
func (p *Pool) Release(id string) {
    p.mu.Lock()
    defer p.mu.Unlock()

    if proc, ok := p.processes[id]; ok {
        // Keep process running for potential reuse
        logger.Infof("Process released: %s", id)
    }
}

// Remove 移除进程
func (p *Pool) Remove(id string) error {
    p.mu.Lock()
    defer p.mu.Unlock()

    proc, ok := p.processes[id]
    if !ok {
        return fmt.Errorf("process not found: %s", id)
    }

    if err := proc.Stop(context.Background()); err != nil {
        return err
    }

    delete(p.processes, id)
    logger.Infof("Process removed: %s (total: %d)", id, len(p.processes))

    return nil
}

// Get 获取进程
func (p *Pool) Get(id string) (*claude.Process, bool) {
    p.mu.RLock()
    defer p.mu.RUnlock()

    proc, ok := p.processes[id]
    return proc, ok
}

// Stats 返回统计信息
func (p *Pool) Stats() Stats {
    p.mu.RLock()
    defer p.mu.RUnlock()

    return Stats{
        Total:   len(p.processes),
        Running: len(p.processes),
        Max:     p.config.MaxInstances,
    }
}

// Stats 统计信息
type Stats struct {
    Total   int
    Running int
    Max     int
}
```

**Step 2: 运行测试**

```bash
go test ./internal/pool/...
```

**Step 3: Commit**

```bash
git add internal/pool/
git commit -m "feat: add process pool management"
```

---

## Task 7: 会话管理与状态跟踪

**Files:**
- Create: `internal/session/session.go`
- Create: `internal/session/manager.go`
- Modify: `internal/session/store.go`

**Step 1: 实现会话结构**

```go
// internal/session/session.go
package session

import (
    "context"
    "fmt"
    "sync"
    "time"

    "ai-bridge/internal/claude"
    "ai-bridge/pkg/protocol"
    "github.com/WQGroup/logger"
)

// Session 会话
type Session struct {
    id        string
    process   *claude.Process
    createdAt time.Time

    // 消息存储优化
    mu              sync.RWMutex
    recentMessages  []*protocol.Message
    messageCount    int64
    lastSeq         int64

    // 状态跟踪
    state              protocol.SessionState
    stateStartAt       time.Time
    currentMessageSeq  int64
    messageStartTimes  map[int64]time.Time
    messageDurations   map[int64]time.Duration

    // 订阅者管理
    subscribers    map[string]*Subscriber
    subscriberMu   sync.RWMutex

    // 存储
    store *SessionStore
}

// Subscriber 订阅者
type Subscriber struct {
    ID          string
    LastSeenSeq int64
    MessageChan chan *protocol.Message
    EventChan   chan *protocol.Event
    Filter      MessageFilter
    CreatedAt   time.Time
}

// MessageFilter 消息过滤器
type MessageFilter struct {
    SinceSeq int64
    Types    []string
    Limit    int
}

// NewSession 创建会话
func NewSession(id string, process *claude.Process, store *SessionStore) *Session {
    return &Session{
        id:                id,
        process:           process,
        createdAt:         time.Now(),
        recentMessages:    make([]*protocol.Message, 0, 100),
        state:             protocol.StateIdle,
        stateStartAt:      time.Now(),
        messageStartTimes: make(map[int64]time.Time),
        messageDurations:  make(map[int64]time.Duration),
        subscribers:       make(map[string]*Subscriber),
        store:             store,
    }
}

// ID 返回会话ID
func (s *Session) ID() string {
    return s.id
}

// GetProcess 获取进程
func (s *Session) GetProcess() *claude.Process {
    return s.process
}

// AddMessage 添加消息
func (s *Session) AddMessage(msg *protocol.Message) error {
    s.mu.Lock()
    defer s.mu.Unlock()

    // Set sequence number
    if msg.Seq == 0 {
        s.lastSeq++
        msg.Seq = s.lastSeq
    }

    // Add to recent messages
    s.recentMessages = append([]*protocol.Message{msg}, s.recentMessages...)
    if len(s.recentMessages) > 100 {
        s.recentMessages = s.recentMessages[:100]
    }

    s.messageCount++

    // Notify subscribers
    s.notifySubscribers(msg)

    // Persist to database
    if s.store != nil {
        msgDB := &MessageDB{
            SessionID:   s.id,
            Seq:         msg.Seq,
            Type:        string(msg.Type),
            Content:     fmt.Sprintf("%v", msg.Content),
            Timestamp:   msg.Timestamp.Unix(),
            MessageHash: fmt.Sprintf("%s-%d", s.id, msg.Seq),
        }
        s.store.BatchWriteMessages([]*MessageDB{msgDB})
    }

    logger.Debugf("Message added to session %s: seq=%d", s.id, msg.Seq)
    return nil
}

// Subscribe 订阅消息
func (s *Session) Subscribe(ctx context.Context, filter MessageFilter) (<-chan *protocol.Message, func()) {
    s.mu.Lock()
    defer s.mu.Unlock()

    msgChan := make(chan *protocol.Message, 50)

    subscriber := &Subscriber{
        ID:          fmt.Sprintf("sub-%d", time.Now().UnixNano()),
        LastSeenSeq: filter.SinceSeq,
        MessageChan: msgChan,
        Filter:      filter,
        CreatedAt:   time.Now(),
    }

    s.subscribers[subscriber.ID] = subscriber

    // Cancel function
    cancel := func() {
        s.mu.Lock()
        defer s.mu.Unlock()

        close(subscriber.MessageChan)
        delete(s.subscribers, subscriber.ID)

        logger.Debugf("Subscriber %s removed from session %s", subscriber.ID, s.id)
    }

    // Watch context
    go func() {
        <-ctx.Done()
        cancel()
    }()

    logger.Debugf("Subscriber %s added to session %s", subscriber.ID, s.id)
    return msgChan, cancel
}

// GetStatus 获取会话状态
func (s *Session) GetStatus() *protocol.SessionStatus {
    s.mu.RLock()
    defer s.mu.RUnlock()

    duration := time.Since(s.stateStartAt).Milliseconds()

    status := &protocol.SessionStatus{
        SessionID:       s.id,
        State:           s.state,
        Duration:        duration,
        StartTime:       s.stateStartAt.Unix(),
        LastMessageSeq:  s.lastSeq,
        TotalMessages:   s.messageCount,
        ProcessingCount: int64(len(s.messageStartTimes)),
    }

    if len(s.recentMessages) > 0 {
        lastMsg := s.recentMessages[0]
        status.LastMessageType = string(lastMsg.Type)
        status.LastMessageTime = lastMsg.Timestamp.Unix()
    }

    if s.state == protocol.StateProcessing && s.currentMessageSeq > 0 {
        if startTime, ok := s.messageStartTimes[s.currentMessageSeq]; ok {
            status.ProcessingDuration = time.Since(startTime).Milliseconds()
        }
    }

    return status
}

// setState 设置状态
func (s *Session) setState(state protocol.SessionState) {
    s.mu.Lock()
    defer s.mu.Unlock()

    s.state = state
    s.stateStartAt = time.Now()

    logger.Infof("Session %s state changed to %s", s.id, state)
}

// startProcessing 开始处理消息
func (s *Session) startProcessing(seq int64) {
    s.mu.Lock()
    defer s.mu.Unlock()

    s.state = protocol.StateProcessing
    s.stateStartAt = time.Now()
    s.currentMessageSeq = seq
    s.messageStartTimes[seq] = time.Now()

    logger.Debugf("Session %s started processing message %d", s.id, seq)
}

// completeProcessing 完成处理消息
func (s *Session) completeProcessing(seq int64) {
    s.mu.Lock()
    defer s.mu.Unlock()

    if startTime, ok := s.messageStartTimes[seq]; ok {
        duration := time.Since(startTime)
        s.messageDurations[seq] = duration

        logger.Infof("Session %s completed message %d in %v", s.id, seq, duration)

        delete(s.messageStartTimes, seq)
    }

    s.currentMessageSeq = 0

    if len(s.messageStartTimes) == 0 {
        s.state = protocol.StateIdle
        s.stateStartAt = time.Now()
    }
}

// Stop 停止会话
func (s *Session) Stop(ctx context.Context) error {
    s.mu.Lock()
    defer s.mu.Unlock()

    if s.state != protocol.StateProcessing && s.state != protocol.StateWaiting {
        return fmt.Errorf("session is not processing (current state: %s)", s.state)
    }

    logger.Infof("Stopping session %s (current state: %s)", s.id, s.state)

    if err := s.process.Interrupt(ctx); err != nil {
        return fmt.Errorf("failed to interrupt process: %w", err)
    }

    s.state = protocol.StateStopped
    s.stateStartAt = time.Now()

    // Clear processing messages
    for seq := range s.messageStartTimes {
        delete(s.messageStartTimes, seq)
    }
    s.currentMessageSeq = 0

    // Notify subscribers
    s.notifySubscribers(&protocol.Message{
        Type:      protocol.MessageTypeError,
        Content:   "Operation stopped by user",
        Timestamp: time.Now(),
    })

    logger.Infof("Session %s stopped", s.id)
    return nil
}

// Stats 返回统计信息
func (s *Session) Stats() SessionStats {
    s.mu.RLock()
    defer s.mu.RUnlock()

    return SessionStats{
        TotalMessages:  s.messageCount,
        LastSeq:        s.lastSeq,
        RecentMessages: len(s.recentMessages),
        SubscriberCount: len(s.subscribers),
    }
}

// SessionStats 会话统计
type SessionStats struct {
    TotalMessages   int64
    LastSeq         int64
    RecentMessages  int
    SubscriberCount int
}

// notifySubscribers 通知订阅者
func (s *Session) notifySubscribers(msg *protocol.Message) {
    s.subscriberMu.RLock()
    defer s.subscriberMu.RUnlock()

    for _, sub := range s.subscribers {
        // Apply filter
        if sub.Filter.SinceSeq > 0 && msg.Seq <= sub.Filter.SinceSeq {
            continue
        }

        select {
        case sub.MessageChan <- msg:
        default:
            logger.Warn("Subscriber channel full, dropping message")
        }
    }
}
```

**Step 2: 实现会话管理器**

```go
// internal/session/manager.go
package session

import (
    "context"
    "fmt"
    "sync"

    "ai-bridge/internal/claude"
    "ai-bridge/internal/config"
    "ai-bridge/internal/pool"
    "github.com/WQGroup/logger"
)

// Manager 会话管理器
type Manager struct {
    mu       sync.RWMutex
    sessions map[string]*Session
    pool     *pool.Pool
    store    *SessionStore
    config   *config.Config
}

// NewManager 创建会话管理器
func NewManager(cfg *config.Config) *Manager {
    // Initialize store
    store, err := NewSessionStore(cfg.Database.Path)
    if err != nil {
        logger.Fatalf("Failed to initialize session store: %v", err)
    }

    return &Manager{
        sessions: make(map[string]*Session),
        pool:     pool.NewPool(pool.Config{MaxInstances: cfg.Pool.MaxInstances}),
        store:    store,
        config:   cfg,
    }
}

// CreateSession 创建会话
func (m *Manager) CreateSession(ctx context.Context, opts CreateOptions) (*Session, error) {
    m.mu.Lock()
    defer m.mu.Unlock()

    // Acquire process from pool
    procConfig := claude.Config{
        WorkingDir:     opts.WorkingDir,
        Model:          opts.Model,
        PermissionMode: opts.PermissionMode,
        AllowedTools:   opts.AllowedTools,
    }

    proc, err := m.pool.Acquire(ctx, procConfig)
    if err != nil {
        return nil, err
    }

    // Create session
    sessionID := fmt.Sprintf("sess-%d", time.Now().UnixNano())
    sess := NewSession(sessionID, proc, m.store)

    // Set up callbacks
    proc.SetMessageCallbacks(
        func(seq int64) {
            sess.startProcessing(seq)
        },
        func(seq int64, duration time.Duration) {
            sess.completeProcessing(seq)
        },
    )

    m.sessions[sessionID] = sess

    // Save to database
    sessDB := &SessionDB{
        SessionID:  sessionID,
        Status:     "active",
        WorkingDir: opts.WorkingDir,
        Model:      opts.Model,
        Agent:      opts.Agent,
    }
    m.store.CreateSession(sessDB)

    logger.Infof("Session created: %s", sessionID)
    return sess, nil
}

// GetSession 获取会话
func (m *Manager) GetSession(sessionID string) *Session {
    m.mu.RLock()
    defer m.mu.RUnlock()

    return m.sessions[sessionID]
}

// CloseSession 关闭会话
func (m *Manager) CloseSession(sessionID string) error {
    m.mu.Lock()
    defer m.mu.Unlock()

    sess, ok := m.sessions[sessionID]
    if !ok {
        return fmt.Errorf("session not found: %s", sessionID)
    }

    // Stop process
    if err := sess.GetProcess().Stop(context.Background()); err != nil {
        return err
    }

    // Remove from pool
    m.pool.Remove(sess.GetProcess().ID())

    // Remove from sessions
    delete(m.sessions, sessionID)

    logger.Infof("Session closed: %s", sessionID)
    return nil
}

// CreateOptions 创建选项
type CreateOptions struct {
    WorkingDir     string
    Model          string
    Agent          string
    PermissionMode string
    AllowedTools   []string
}
```

**Step 3: 运行测试**

```bash
go test ./internal/session/...
```

**Step 4: Commit**

```bash
git add internal/session/
git commit -m "feat: add session management with status tracking and stop support"
```

---

## Task 8: HTTP API 服务器和路由

**Files:**
- Create: `internal/api/server.go`
- Create: `internal/api/middleware.go`
- Create: `internal/api/router.go`

**Step 1: 实现API服务器**

```go
// internal/api/server.go
package api

import (
    "context"
    "fmt"
    "net/http"
    "time"

    "ai-bridge/internal/config"
    "ai-bridge/internal/session"
    "github.com/WQGroup/logger"
    "github.com/gin-gonic/gin"
)

// Server HTTP API服务器
type Server struct {
    config         *config.Config
    sessionManager *session.Manager
    router         *gin.Engine
    httpServer     *http.Server
}

// NewServer 创建API服务器
func NewServer(cfg *config.Config, sessionManager *session.Manager) *Server {
    // 设置Gin模式
    if cfg.Logging.Level == "debug" {
        gin.SetMode(gin.DebugMode)
    } else {
        gin.SetMode(gin.ReleaseMode)
    }

    s := &Server{
        config:         cfg,
        sessionManager: sessionManager,
        router:         gin.New(),
    }

    s.setupMiddleware()
    s.setupRoutes()

    return s
}

// setupMiddleware 设置中间件
func (s *Server) setupMiddleware() {
    s.router.Use(gin.Recovery())
    s.router.Use(s.loggerMiddleware())
    s.router.Use(s.corsMiddleware())
}

// setupRoutes 设置路由
func (s *Server) setupRoutes() {
    // 健康检查
    s.router.GET("/health", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "status": "ok",
            "time":   time.Now().Unix(),
        })
    })

    // API v1
    v1 := s.router.Group("/api/v1")
    {
        // 会话管理
        sessions := v1.Group("/sessions")
        {
            sessions.POST("", s.createSession)
            sessions.GET("", s.listSessions)
            sessions.GET("/:id", s.getSession)
            sessions.DELETE("/:id", s.closeSession)
            sessions.GET("/:id/status", s.getSessionStatus)
            sessions.POST("/:id/stop", s.stopSession)
        }

        // 消息管理
        messages := v1.Group("/sessions/:sessionId/messages")
        {
            messages.GET("", s.getMessages)
            messages.GET("/stream", s.streamMessages)
            messages.POST("", s.sendMessage)
        }

        // 权限管理
        permissions := v1.Group("/sessions/:sessionId/permissions")
        {
            permissions.POST("/:requestId/approve", s.approvePermission)
            permissions.POST("/:requestId/deny", s.denyPermission)
        }

        // 斜杠命令
        commands := v1.Group("/commands")
        {
            commands.GET("", s.listCommands)
            commands.GET("/*path", s.getCommand)
            commands.POST("", s.executeCommand) // ?sessionId=:id
        }
    }
}

// Start 启动服务器
func (s *Server) Start() error {
    addr := fmt.Sprintf("%s:%d", s.config.Server.Host, s.config.Server.Port)

    s.httpServer = &http.Server{
        Addr:           addr,
        Handler:        s.router,
        ReadTimeout:    30 * time.Second,
        WriteTimeout:   30 * time.Second,
        MaxHeaderBytes: 1 << 20,
    }

    logger.Infof("HTTP server listening on %s", addr)

    if err := s.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
        return fmt.Errorf("failed to start server: %w", err)
    }

    return nil
}

// Shutdown 优雅关闭
func (s *Server) Shutdown(ctx context.Context) error {
    logger.Info("Shutting down HTTP server...")

    if s.httpServer != nil {
        return s.httpServer.Shutdown(ctx)
    }

    return nil
}
```

**Step 2: 实现中间件**

```go
// internal/api/middleware.go
package api

import (
    "time"

    "github.com/WQGroup/logger"
    "github.com/gin-gonic/gin"
)

// loggerMiddleware 日志中间件
func (s *Server) loggerMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        path := c.Request.URL.Path
        query := c.Request.URL.RawQuery

        c.Next()

        latency := time.Since(start)
        status := c.Writer.Status()

        logger.Infof("[%s] %s %s | %d | %v",
            c.Request.Method,
            path,
            query,
            status,
            latency,
        )

        // 记录错误
        if len(c.Errors) > 0 {
            for _, e := range c.Errors {
                logger.Errorf("Request error: %v", e.Error())
            }
        }
    }
}

// corsMiddleware CORS中间件
func (s *Server) corsMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        origin := c.Request.Header.Get("Origin")

        // 检查是否在允许列表中
        allowed := false
        for _, allowedOrigin := range s.config.CORS.Origins {
            if origin == allowedOrigin || allowedOrigin == "*" {
                allowed = true
                break
            }
        }

        if allowed {
            c.Header("Access-Control-Allow-Origin", origin)
            c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")
            c.Header("Access-Control-Expose-Headers", "Content-Length")
            c.Header("Access-Control-Allow-Credentials", "true")
        }

        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(http.StatusNoContent)
            return
        }

        c.Next()
    }
}
```

**Step 3: 实现路由器(辅助函数)**

```go
// internal/api/router.go
package api

import (
    "net/http"

    "ai-bridge/pkg/protocol"
    "github.com/gin-gonic/gin"
)

// 创建会话
// POST /api/v1/sessions
func (s *Server) createSession(c *gin.Context) {
    var req struct {
        WorkingDir     string   `json:"workingDirectory" binding:"required"`
        Model          string   `json:"model,omitempty"`
        Agent          string   `json:"agent,omitempty"`
        PermissionMode string   `json:"permissionMode,omitempty"`
        AllowedTools   []string `json:"allowedTools,omitempty"`
    }

    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // 设置默认值
    if req.Model == "" {
        req.Model = s.config.Claude.DefaultModel
    }
    if req.PermissionMode == "" {
        req.PermissionMode = s.config.Claude.PermissionMode
    }

    // 创建会话
    sess, err := s.sessionManager.CreateSession(c.Request.Context(), session.CreateOptions{
        WorkingDir:     req.WorkingDir,
        Model:          req.Model,
        Agent:          req.Agent,
        PermissionMode: req.PermissionMode,
        AllowedTools:   req.AllowedTools,
    })

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusCreated, gin.H{
        "id":        sess.ID(),
        "status":    "created",
        "createdAt": sess.GetStatus().StartTime,
    })
}

// 列出会话
// GET /api/v1/sessions
func (s *Server) listSessions(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{
        "sessions": []interface{}{}, // TODO: 实现会话列表
    })
}

// 获取会话
// GET /api/v1/sessions/:id
func (s *Server) getSession(c *gin.Context) {
    id := c.Param("id")

    sess := s.sessionManager.GetSession(id)
    if sess == nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
        return
    }

    status := sess.GetStatus()

    c.JSON(http.StatusOK, gin.H{
        "id":       sess.ID(),
        "status":   status,
        "metadata": status.Metadata,
    })
}

// 关闭会话
// DELETE /api/v1/sessions/:id
func (s *Server) closeSession(c *gin.Context) {
    id := c.Param("id")

    if err := s.sessionManager.CloseSession(id); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "id":      id,
        "status":  "closed",
    })
}

// 获取会话状态
// GET /api/v1/sessions/:id/status
func (s *Server) getSessionStatus(c *gin.Context) {
    id := c.Param("id")

    sess := s.sessionManager.GetSession(id)
    if sess == nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
        return
    }

    status := sess.GetStatus()
    c.JSON(http.StatusOK, status)
}

// 停止会话
// POST /api/v1/sessions/:id/stop
func (s *Server) stopSession(c *gin.Context) {
    id := c.Param("id")

    sess := s.sessionManager.GetSession(id)
    if sess == nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
        return
    }

    if err := sess.Stop(c.Request.Context()); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "id":     id,
        "status": "stopped",
    })
}

// 获取消息
// GET /api/v1/sessions/:sessionId/messages?since=123&before=456&limit=50
func (s *Server) getMessages(c *gin.Context) {
    sessionID := c.Param("sessionId")

    sess := s.sessionManager.GetSession(sessionID)
    if sess == nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
        return
    }

    // 解析查询参数
    var sinceSeq, beforeSeq int64
    if since := c.Query("since"); since != "" {
        fmt.Sscanf(since, "%d", &sinceSeq)
    }
    if before := c.Query("before"); before != "" {
        fmt.Sscanf(before, "%d", &beforeSeq)
    }

    limit := 50
    if lim := c.Query("limit"); lim != "" {
        fmt.Sscanf(lim, "%d", &limit)
        if limit > 100 {
            limit = 100
        }
    }

    // 从数据库获取消息
    // TODO: 实现从存储中获取消息的逻辑

    c.JSON(http.StatusOK, gin.H{
        "messages": []interface{}{},
        "since":    sinceSeq,
    })
}

// 流式消息(SSE)
// GET /api/v1/sessions/:sessionId/messages/stream?since=123
func (s *Server) streamMessages(c *gin.Context) {
    sessionID := c.Param("sessionId")

    sess := s.sessionManager.GetSession(sessionID)
    if sess == nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
        return
    }

    // 设置SSE headers
    c.Header("Content-Type", "text/event-stream")
    c.Header("Cache-Control", "no-cache")
    c.Header("Connection", "keep-alive")

    // 解析since参数
    var sinceSeq int64
    if since := c.Query("since"); since != "" {
        fmt.Sscanf(since, "%d", &sinceSeq)
    }

    // 订阅消息
    filter := session.MessageFilter{
        SinceSeq: sinceSeq,
    }

    msgChan, cancel := sess.Subscribe(c.Request.Context(), filter)
    defer cancel()

    // 发送消息
    c.Stream(func(w io.Writer) bool {
        select {
        case msg := <-msgChan:
            // 发送SSE格式
            fmt.Fprintf(w, "data: %s\n\n", toJSON(msg))
            return true
        case <-c.Request.Context().Done():
            return false
        }
    })
}

// 发送消息
// POST /api/v1/sessions/:sessionId/messages
func (s *Server) sendMessage(c *gin.Context) {
    sessionID := c.Param("sessionId")

    var req struct {
        Content string `json:"content" binding:"required"`
    }

    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    sess := s.sessionManager.GetSession(sessionID)
    if sess == nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
        return
    }

    // 发送消息到进程
    proc := sess.GetProcess()
    if err := proc.SendMessage(c.Request.Context(), req.Content); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusAccepted, gin.H{
        "status": "sent",
    })
}

// 批准权限
// POST /api/v1/sessions/:sessionId/permissions/:requestId/approve
func (s *Server) approvePermission(c *gin.Context) {
    sessionID := c.Param("sessionId")
    requestID := c.Param("requestId")

    var req struct {
        Scope string `json:"scope"`
    }

    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    sess := s.sessionManager.GetSession(sessionID)
    if sess == nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
        return
    }

    proc := sess.GetProcess()
    if err := proc.SendApproval(c.Request.Context(), requestID, true, req.Scope); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "requestId": requestID,
        "approved":  true,
        "scope":     req.Scope,
    })
}

// 拒绝权限
// POST /api/v1/sessions/:sessionId/permissions/:requestId/deny
func (s *Server) denyPermission(c *gin.Context) {
    sessionID := c.Param("sessionId")
    requestID := c.Param("requestId")

    sess := s.sessionManager.GetSession(sessionID)
    if sess == nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
        return
    }

    proc := sess.GetProcess()
    if err := proc.SendApproval(c.Request.Context(), requestID, false, ""); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "requestId": requestID,
        "approved":  false,
    })
}

// 列出命令
// GET /api/v1/commands?sessionId=:id
func (s *Server) listCommands(c *gin.Context) {
    // TODO: 实现命令列表
    c.JSON(http.StatusOK, gin.H{
        "commands": []interface{}{},
    })
}

// 获取单个命令
// GET /api/v1/commands/*path
func (s *Server) getCommand(c *gin.Context) {
    path := c.Param("path")
    // TODO: 实现获取命令
    c.JSON(http.StatusOK, gin.H{
        "path": path,
    })
}

// 执行命令
// POST /api/v1/commands?sessionId=:id
func (s *Server) executeCommand(c *gin.Context) {
    sessionID := c.Query("sessionId")
    if sessionID == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "sessionId is required"})
        return
    }

    sess := s.sessionManager.GetSession(sessionID)
    if sess == nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
        return
    }

    var req struct {
        Command string `json:"command" binding:"required"`
        Args    string `json:"args,omitempty"`
    }

    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // 执行命令
    cmd := req.Command
    if req.Args != "" {
        cmd = fmt.Sprintf("%s %s", req.Command, req.Args)
    }

    proc := sess.GetProcess()
    if err := proc.SendMessage(c.Request.Context(), cmd); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusAccepted, gin.H{
        "status":  "executing",
        "command": req.Command,
    })
}

// toJSON 辅助函数
func toJSON(v interface{}) string {
    data, _ := json.Marshal(v)
    return string(data)
}
```

**Step 4: 运行测试**

```bash
go test ./internal/api/...
```

**Step 5: Commit**

```bash
git add internal/api/
git commit -m "feat: add HTTP API server with session, message, permission, and stop endpoints"
```

---

## Task 9: WebSocket 服务器 (Socket.IO兼容)

**Files:**
- Create: `internal/websocket/server.go`
- Create: `internal/websocket/manager.go`

**Step 1: 实现WebSocket连接管理**

```go
// internal/websocket/manager.go
package websocket

import (
    "sync"

    "github.com/WQGroup/logger"
    "github.com/gorilla/websocket"
)

// Client WebSocket客户端
type Client struct {
    ID        string
    SessionID string
    Conn      *websocket.Conn
    Send      chan []byte
    mu        sync.Mutex
}

// Manager 连接管理器
type Manager struct {
    clients map[string]*Client
    mu      sync.RWMutex
}

// NewManager 创建管理器
func NewManager() *Manager {
    return &Manager{
        clients: make(map[string]*Client),
    }
}

// AddClient 添加客户端
func (m *Manager) AddClient(client *Client) {
    m.mu.Lock()
    defer m.mu.Unlock()

    m.clients[client.ID] = client
    logger.Infof("WebSocket client added: %s (session: %s)", client.ID, client.SessionID)
}

// RemoveClient 移除客户端
func (m *Manager) RemoveClient(clientID string) {
    m.mu.Lock()
    defer m.mu.Unlock()

    if client, ok := m.clients[clientID]; ok {
        close(client.Send)
        delete(m.clients, clientID)
        logger.Infof("WebSocket client removed: %s", clientID)
    }
}

// GetClient 获取客户端
func (m *Manager) GetClient(clientID string) (*Client, bool) {
    m.mu.RLock()
    defer m.mu.RUnlock()

    client, ok := m.clients[clientID]
    return client, ok
}

// GetClientsBySession 掷取会话的所有客户端
func (m *Manager) GetClientsBySession(sessionID string) []*Client {
    m.mu.RLock()
    defer m.mu.RUnlock()

    var clients []*Client
    for _, client := range m.clients {
        if client.SessionID == sessionID {
            clients = append(clients, client)
        }
    }

    return clients
}

// BroadcastToSession 向会话广播消息
func (m *Manager) BroadcastToSession(sessionID string, message []byte) {
    clients := m.GetClientsBySession(sessionID)

    for _, client := range clients {
        select {
        case client.Send <- message:
        default:
            logger.Warnf("Client %s send channel full", client.ID)
        }
    }
}
```

**Step 2: 实现WebSocket服务器**

```go
// internal/websocket/server.go
package websocket

import (
    "fmt"
    "net/http"
    "time"

    "ai-bridge/internal/session"
    "ai-bridge/pkg/protocol"
    "github.com/WQGroup/logger"
    "github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
    CheckOrigin: func(r *http.Request) bool {
        return true // TODO: 检查origin
    },
}

// Server WebSocket服务器
type Server struct {
    manager        *Manager
    sessionManager *session.Manager
}

// NewServer 创建WebSocket服务器
func NewServer(sessionManager *session.Manager) *Server {
    return &Server{
        manager:        NewManager(),
        sessionManager: sessionManager,
    }
}

// HandleWebSocket WebSocket连接处理
func (s *Server) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
    // 获取session ID
    sessionID := r.URL.Query().Get("sessionId")
    if sessionID == "" {
        http.Error(w, "sessionId required", http.StatusBadRequest)
        return
    }

    // 验证会话
    sess := s.sessionManager.GetSession(sessionID)
    if sess == nil {
        http.Error(w, "session not found", http.StatusNotFound)
        return
    }

    // 升级到WebSocket
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        logger.Errorf("WebSocket upgrade failed: %v", err)
        return
    }

    // 创建客户端
    client := &Client{
        ID:        fmt.Sprintf("ws-%d", time.Now().UnixNano()),
        SessionID: sessionID,
        Conn:      conn,
        Send:      make(chan []byte, 256),
    }

    s.manager.AddClient(client)

    // 启动读写goroutine
    go s.readPump(client)
    go s.writePump(client)

    // 订阅会话消息
    filter := session.MessageFilter{}
    msgChan, cancel := sess.Subscribe(r.Context(), filter)

    // 转发消息到客户端
    go func() {
        defer cancel()

        for msg := range msgChan {
            data, _ := json.Marshal(msg)
            s.manager.BroadcastToSession(sessionID, data)
        }
    }()
}

// readPump 读取pump
func (s *Server) readPump(client *Client) {
    defer func() {
        s.manager.RemoveClient(client.ID)
        client.Conn.Close()
    }()

    client.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
    client.Conn.SetPongHandler(func(string) error {
        client.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
        return nil
    })

    for {
        _, message, err := client.Conn.ReadMessage()
        if err != nil {
            if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
                logger.Errorf("WebSocket error: %v", err)
            }
            break
        }

        // 处理客户端消息(如心跳)
        logger.Debugf("WebSocket message from %s: %s", client.ID, message)
    }
}

// writePump 写入pump
func (s *Server) writePump(client *Client) {
    ticker := time.NewTicker(54 * time.Second)
    defer func() {
        ticker.Stop()
        client.Conn.Close()
    }()

    for {
        select {
        case message, ok := <-client.Send:
            client.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
            if !ok {
                client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
                return
            }

            client.Conn.WriteMessage(websocket.TextMessage, message)

        case <-ticker.C:
            client.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
            if err := client.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
                return
            }
        }
    }
}
```

**Step 3: 在main.go中集成WebSocket**

```go
// 在internal/api/server.go的setupRoutes中添加
func (s *Server) setupRoutes() {
    // ...existing routes...

    // WebSocket endpoint
    wsServer := websocket.NewServer(s.sessionManager)
    s.router.GET("/ws", func(c *gin.Context) {
        wsServer.HandleWebSocket(c.Writer, c.Request)
    })
}
```

**Step 4: 运行测试**

```bash
go test ./internal/websocket/...
```

**Step 5: Commit**

```bash
git add internal/websocket/
git commit -m "feat: add WebSocket server with session message streaming"
```

---

## Task 10: 斜杠命令发现和执行

**Files:**
- Create: `internal/commands/discover.go`
- Create: `internal/commands/parser.go`
- Create: `internal/commands/commands.go`

**Step 1: 定义命令结构**

```go
// internal/commands/commands.go
package commands

import "time"

// Command 斜杠命令
type Command struct {
    Path        string            `json:"path"`
    Category    string            `json:"category"`
    Description string            `json:"description"`
    Examples    []string          `json:"examples"`
    Content     string            `json:"content,omitempty"`
    Source      CommandSource     `json:"source"`
    Metadata    map[string]string `json:"metadata,omitempty"`
    CreatedAt   time.Time         `json:"createdAt"`
}

// CommandSource 命令来源
type CommandSource string

const (
    SourceBuiltin CommandSource = "builtin"
    SourceUser    CommandSource = "user"
    SourceProject CommandSource = "project"
)

// CommandGroup 按分类分组的命令
type CommandGroup struct {
    Category string              `json:"category"`
    Commands map[string]*Command `json:"commands"`
}
```

**Step 2: 实现命令发现**

```go
// internal/commands/discover.go
package commands

import (
    "bufio"
    "fmt"
    "os"
    "path/filepath"
    "strings"

    "github.com/WQGroup/logger"
)

// Discoverer 命令发现器
type Discoverer struct {
    workingDir string
    homeDir    string
}

// NewDiscoverer 创建发现器
func NewDiscoverer(workingDir, homeDir string) *Discoverer {
    return &Discoverer{
        workingDir: workingDir,
        homeDir:    homeDir,
    }
}

// DiscoverAll 发现所有命令
func (d *Discoverer) DiscoverAll() (map[string]*Command, error) {
    commands := make(map[string]*Command)

    // 1. Builtin命令
    builtin, err := d.discoverBuiltin()
    if err != nil {
        logger.Warnf("Failed to discover builtin commands: %v", err)
    }
    for k, v := range builtin {
        commands[k] = v
    }

    // 2. 用户命令
    user, err := d.discoverUserCommands()
    if err != nil {
        logger.Warnf("Failed to discover user commands: %v", err)
    }
    for k, v := range user {
        commands[k] = v
    }

    // 3. 项目命令
    project, err := d.discoverProjectCommands()
    if err != nil {
        logger.Warnf("Failed to discover project commands: %v", err)
    }
    for k, v := range project {
        commands[k] = v
    }

    logger.Infof("Discovered %d commands", len(commands))
    return commands, nil
}

// discoverBuiltin 发现内置命令
func (d *Discoverer) discoverBuiltin() (map[string]*Command, error) {
    // Claude CLI的内置命令列表
    builtins := []struct {
        path     string
        category string
        desc     string
        examples []string
    }{
        {"/help", "core", "Show help", []string{"/help"}},
        {"/clear", "core", "Clear conversation", []string{"/clear"}},
        {"/exit", "core", "Exit Claude", []string{"/exit"}},
        {"/commit", "git", "Create a git commit", []string{"/commit", "/commit Fix bug"}},
        {"/test", "dev", "Run tests", []string{"/test", "/test ./..."}},
    }

    commands := make(map[string]*Command)
    for _, b := range builtins {
        commands[b.path] = &Command{
            Path:        b.path,
            Category:    b.category,
            Description: b.desc,
            Examples:    b.examples,
            Source:      SourceBuiltin,
        }
    }

    return commands, nil
}

// discoverUserCommands 发现用户命令
func (d *Discoverer) discoverUserCommands() (map[string]*Command, error) {
    userCmdDir := filepath.Join(d.homeDir, ".claude", "commands")
    return d.discoverFromDirectory(userCmdDir, SourceUser)
}

// discoverProjectCommands 发现项目命令
func (d *Discoverer) discoverProjectCommands() (map[string]*Command, error) {
    projectCmdDir := filepath.Join(d.workingDir, ".claude", "commands")
    return d.discoverFromDirectory(projectCmdDir, SourceProject)
}

// discoverFromDirectory 从目录发现命令
func (d *Discoverer) discoverFromDirectory(dir string, source CommandSource) (map[string]*Command, error) {
    commands := make(map[string]*Command)

    entries, err := os.ReadDir(dir)
    if err != nil {
        if os.IsNotExist(err) {
            return commands, nil
        }
        return nil, err
    }

    for _, entry := range entries {
        if entry.IsDir() {
            // 递归子目录
            subdir := filepath.Join(dir, entry.Name())
            subcommands, err := d.discoverFromDirectory(subdir, source)
            if err != nil {
                logger.Warnf("Failed to read subdir %s: %v", subdir, err)
                continue
            }
            for k, v := range subcommands {
                commands[k] = v
            }
        }

        if !strings.HasSuffix(entry.Name(), ".md") {
            continue
        }

        // 解析markdown文件
        filepath := filepath.Join(dir, entry.Name())
        cmd, err := d.parseCommandFile(filepath, source)
        if err != nil {
            logger.Warnf("Failed to parse %s: %v", filepath, err)
            continue
        }

        commands[cmd.Path] = cmd
    }

    return commands, nil
}

// parseCommandFile 解析命令文件
func (d *Discoverer) parseCommandFile(filepath string, source CommandSource) (*Command, error) {
    file, err := os.Open(filepath)
    if err != nil {
        return nil, err
    }
    defer file.Close()

    scanner := bufio.NewScanner(file)
    var inFrontmatter bool
    var frontmatter []string
    var content []string

    for scanner.Scan() {
        line := scanner.Text()

        if line == "---" {
            inFrontmatter = !inFrontmatter
            continue
        }

        if inFrontmatter {
            frontmatter = append(frontmatter, line)
        } else {
            content = append(content, line)
        }
    }

    // 解析frontmatter
    cmd := &Command{
        Source:    source,
        Content:   strings.Join(content, "\n"),
        CreatedAt: time.Now(),
    }

    for _, line := range frontmatter {
        parts := strings.SplitN(line, ":", 2)
        if len(parts) != 2 {
            continue
        }

        key := strings.TrimSpace(parts[0])
        value := strings.TrimSpace(parts[1])

        switch key {
        case "path":
            cmd.Path = value
        case "category":
            cmd.Category = value
        case "description":
            cmd.Description = value
        case "examples":
            // 简化处理
            cmd.Examples = []string{value}
        }
    }

    // 从文件名推断path
    if cmd.Path == "" {
        filename := filepath.Base(filepath)
        cmd.Path = "/" + strings.TrimSuffix(filename, ".md")
    }

    return cmd, nil
}
```

**Step 3: 实现命令解析**

```go
// internal/commands/parser.go
package commands

import (
    "strings"
)

// Parser 命令解析器
type Parser struct {
    commands map[string]*Command
}

// NewParser 创建解析器
func NewParser(commands map[string]*Command) *Parser {
    return &Parser{
        commands: commands,
    }
}

// Parse 解析命令字符串
func (p *Parser) Parse(input string) (*Command, string, bool) {
    input = strings.TrimSpace(input)

    // 检查是否是斜杠命令
    if !strings.HasPrefix(input, "/") {
        return nil, "", false
    }

    // 提取命令路径和参数
    parts := strings.Fields(input)
    if len(parts) == 0 {
        return nil, "", false
    }

    commandPath := parts[0]
    args := ""
    if len(parts) > 1 {
        args = strings.Join(parts[1:], " ")
    }

    // 查找命令
    cmd, ok := p.commands[commandPath]
    if !ok {
        return nil, "", false
    }

    return cmd, args, true
}

// GroupByCategory 按分类分组
func (p *Parser) GroupByCategory() []*CommandGroup {
    groups := make(map[string]*CommandGroup)

    for _, cmd := range p.commands {
        if _, ok := groups[cmd.Category]; !ok {
            groups[cmd.Category] = &CommandGroup{
                Category: cmd.Category,
                Commands: make(map[string]*Command),
            }
        }

        groups[cmd.Category].Commands[cmd.Path] = cmd
    }

    result := make([]*CommandGroup, 0, len(groups))
    for _, group := range groups {
        result = append(result, group)
    }

    return result
}
```

**Step 4: 集成到API服务器**

```go
// 在internal/api/server.go中添加
type Server struct {
    // ...existing fields...
    commandParser *commands.Parser
}

// 在NewServer中初始化命令
func NewServer(cfg *config.Config, sessionManager *session.Manager) *Server {
    s := &Server{
        // ...
    }

    // 初始化命令发现器
    discoverer := commands.NewDiscoverer(".", os.Getenv("HOME"))
    cmds, _ := discoverer.DiscoverAll()
    s.commandParser = commands.NewParser(cmds)

    return s
}

// 实现listCommands handler
func (s *Server) listCommands(c *gin.Context) {
    groups := s.commandParser.GroupByCategory()

    c.JSON(http.StatusOK, gin.H{
        "byCategory": groups,
    })
}
```

**Step 5: 运行测试**

```bash
go test ./internal/commands/...
```

**Step 6: Commit**

```bash
git add internal/commands/
git commit -m "feat: add slash command discovery and parsing"
```

---

## Task 11: 健康监控和告警

**Files:**
- Create: `internal/health/monitor.go`
- Create: `internal/health/checker.go`

**Step 1: 实现健康检查器**

```go
// internal/health/checker.go
package health

import (
    "context"
    "fmt"
    "time"
)

// Status 健康状态
type Status string

const (
    StatusHealthy   Status = "healthy"
    StatusWarning   Status = "warning"
    StatusCritical  Status = "critical"
    StatusUnknown   Status = "unknown"
)

// CheckResult 检查结果
type CheckResult struct {
    Component string    `json:"component"`
    Status    Status    `json:"status"`
    Message   string    `json:"message,omitempty"`
    Timestamp time.Time `json:"timestamp"`
}

// Checker 健康检查器
type Checker struct {
    sessionManager interface{} // TODO: 使用实际的session.Manager接口
}

// NewChecker 创建检查器
func NewChecker(sessionManager interface{}) *Checker {
    return &Checker{
        sessionManager: sessionManager,
    }
}

// CheckSession 检查会话健康状态
func (c *Checker) CheckSession(ctx context.Context, sessionID string) *CheckResult {
    result := &CheckResult{
        Component: fmt.Sprintf("session:%s", sessionID),
        Timestamp: time.Now(),
        Status:    StatusUnknown,
    }

    // TODO: 实现实际的健康检查逻辑
    // 1. 检查进程是否运行
    // 2. 检查最后消息时间
    // 3. 检查是否有卡住的消息

    result.Status = StatusHealthy
    return result
}

// CheckAllSessions 检查所有会话
func (c *Checker) CheckAllSessions(ctx context.Context) []*CheckResult {
    // TODO: 遍历所有活动会话并检查
    return []*CheckResult{}
}
```

**Step 2: 实现监控器**

```go
// internal/health/monitor.go
package health

import (
    "context"
    "time"

    "ai-bridge/internal/config"
    "github.com/WQGroup/logger"
)

// Monitor 健康监控器
type Monitor struct {
    checker      *Checker
    config       config.HealthConfig
    alertChan    chan *CheckResult
}

// NewMonitor 创建监控器
func NewMonitor(checker *Checker, cfg config.HealthConfig) *Monitor {
    return &Monitor{
        checker:   checker,
        config:    cfg,
        alertChan: make(chan *CheckResult, 100),
    }
}

// Start 启动监控
func (m *Monitor) Start(ctx context.Context) {
    if !m.config.Enabled {
        logger.Info("Health monitoring disabled")
        return
    }

    interval, _ := time.ParseDuration(m.config.CheckInterval)

    ticker := time.NewTicker(interval)
    defer ticker.Stop()

    logger.Infof("Health monitoring started (interval: %s)", interval)

    for {
        select {
        case <-ctx.Done():
            logger.Info("Health monitoring stopped")
            return
        case <-ticker.C:
            m.runChecks(ctx)
        }
    }
}

// runChecks 运行检查
func (m *Monitor) runChecks(ctx context.Context) {
    results := m.checker.CheckAllSessions(ctx)

    for _, result := range results {
        if result.Status == StatusCritical || result.Status == StatusWarning {
            m.alertChan <- result

            if m.config.SendWarning {
                logger.Warnf("Health alert [%s]: %s - %s",
                    result.Component, result.Status, result.Message)
            }

            // 可选: 重启卡住的会话
            if result.Status == StatusCritical && m.config.RestartOnCrash {
                m.handleCrash(ctx, result)
            }
        }
    }
}

// handleCrash 处理崩溃
func (m *Monitor) handleCrash(ctx context.Context, result *CheckResult) {
    logger.Errorf("Handling crash for %s", result.Component)
    // TODO: 实现重启逻辑
}

// Alerts 返回告警通道
func (m *Monitor) Alerts() <-chan *CheckResult {
    return m.alertChan
}
```

**Step 3: 集成到main.go**

```go
// 在main.go中添加健康监控
func main() {
    // ...existing code...

    // Start health monitor
    if cfg.Health.Enabled {
        checker := health.NewChecker(sessionManager)
        monitor := health.NewMonitor(checker, cfg.Health)

        go monitor.Start(ctx)

        // Handle alerts
        go func() {
            for alert := range monitor.Alerts() {
                logger.Warnf("Health alert: %+v", alert)
            }
        }()
    }

    // ...rest of main...
}
```

**Step 4: 运行测试**

```bash
go test ./internal/health/...
```

**Step 5: Commit**

```bash
git add internal/health/
git commit -m "feat: add health monitoring and alerting"
```

---

## Task 12: 单元测试

**Files:**
- Create: `internal/claude/process_test.go`
- Create: `internal/pool/pool_test.go`
- Create: `internal/session/session_test.go`
- Create: `internal/commands/discover_test.go`

**Step 1: 测试Process**

```go
// internal/claude/process_test.go
package claude

import (
    "context"
    "testing"
    "time"
)

func TestNewProcess(t *testing.T) {
    config := Config{
        WorkingDir:     "/tmp",
        Model:          "haiku",
        PermissionMode: "normal",
    }

    proc := NewProcess("test-id", config)

    if proc == nil {
        t.Fatal("NewProcess returned nil")
    }

    if proc.ID() != "test-id" {
        t.Errorf("expected ID 'test-id', got '%s'", proc.ID())
    }
}

func TestProcess_StartStop(t *testing.T) {
    if testing.Short() {
        t.Skip("skipping integration test")
    }

    config := Config{
        WorkingDir:     "/tmp",
        Model:          "haiku",
        PermissionMode: "normal",
    }

    proc := NewProcess("test-start-stop", config)
    ctx := context.Background()

    // Start
    if err := proc.Start(ctx); err != nil {
        t.Fatalf("failed to start process: %v", err)
    }

    if !proc.IsRunning() {
        t.Error("process should be running after Start")
    }

    // Wait a bit
    time.Sleep(100 * time.Millisecond)

    // Stop
    if err := proc.Stop(ctx); err != nil {
        t.Fatalf("failed to stop process: %v", err)
    }

    if proc.IsRunning() {
        t.Error("process should not be running after Stop")
    }
}
```

**Step 2: 测试Session**

```go
// internal/session/session_test.go
package session

import (
    "testing"
    "time"
)

func TestNewSession(t *testing.T) {
    // Mock process
    proc := &mockProcess{id: "test-proc"}
    store := &mockStore{}

    sess := NewSession("test-sess", proc, store)

    if sess.ID() != "test-sess" {
        t.Errorf("expected ID 'test-sess', got '%s'", sess.ID())
    }
}

func TestSession_AddMessage(t *testing.T) {
    proc := &mockProcess{id: "test-proc"}
    store := &mockStore{}

    sess := NewSession("test-sess", proc, store)

    msg := &protocol.Message{
        Type:      protocol.MessageTypeUser,
        Content:   "Hello",
        Timestamp: time.Now(),
    }

    if err := sess.AddMessage(msg); err != nil {
        t.Fatalf("failed to add message: %v", err)
    }

    stats := sess.Stats()
    if stats.TotalMessages != 1 {
        t.Errorf("expected 1 message, got %d", stats.TotalMessages)
    }
}

// Mock types for testing
type mockProcess struct {
    id string
}

func (m *mockProcess) ID() string { return m.id }

type mockStore struct{}

func (m *mockStore) BatchWriteMessages(messages []*MessageDB) error {
    return nil
}
```

**Step 3: 测试命令发现**

```go
// internal/commands/discover_test.go
package commands

import (
    "os"
    "path/filepath"
    "testing"
)

func TestDiscoverer_DiscoverFromDirectory(t *testing.T) {
    // Create temp directory
    tmpDir := t.TempDir()

    // Create test command file
    cmdFile := filepath.Join(tmpDir, "testcmd.md")
    content := `---
path: /testcmd
category: test
description: Test command
examples:
  - /testcmd
---
This is a test command.
`
    if err := os.WriteFile(cmdFile, []byte(content), 0644); err != nil {
        t.Fatal(err)
    }

    // Discover
    discoverer := NewDiscoverer(tmpDir, "/home/user")
    commands, err := discoverer.discoverFromDirectory(tmpDir, SourceProject)

    if err != nil {
        t.Fatalf("failed to discover: %v", err)
    }

    if len(commands) != 1 {
        t.Fatalf("expected 1 command, got %d", len(commands))
    }

    cmd := commands["/testcmd"]
    if cmd.Description != "Test command" {
        t.Errorf("expected description 'Test command', got '%s'", cmd.Description)
    }
}

func TestParser_Parse(t *testing.T) {
    commands := map[string]*Command{
        "/test": {
            Path:        "/test",
            Description: "Test command",
        },
    }

    parser := NewParser(commands)

    // Valid command
    cmd, args, ok := parser.Parse("/test arg1 arg2")
    if !ok {
        t.Fatal("failed to parse valid command")
    }
    if cmd.Path != "/test" {
        t.Errorf("expected path '/test', got '%s'", cmd.Path)
    }
    if args != "arg1 arg2" {
        t.Errorf("expected args 'arg1 arg2', got '%s'", args)
    }

    // Invalid command
    _, _, ok = parser.Parse("not a command")
    if ok {
        t.Error("should not parse non-command")
    }
}
```

**Step 4: 运行测试**

```bash
go test -v ./internal/...
```

**Step 5: 查看覆盖率**

```bash
go test -coverprofile=coverage.out ./internal/...
go tool cover -html=coverage.out
```

**Step 6: Commit**

```bash
git add internal/*/*_test.go
git commit -m "test: add unit tests for core modules"
```

---

## Task 13: 集成测试

**Files:**
- Create: `tests/integration/api_test.go`
- Create: `tests/integration/session_test.go`

**Step 1: API集成测试**

```go
// tests/integration/api_test.go
// +build integration

package integration

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"

    "ai-bridge/internal/api"
    "ai-bridge/internal/config"
    "ai-bridge/internal/session"
)

func TestCreateSession(t *testing.T) {
    // Load test config
    cfg := &config.Config{
        Server: config.ServerConfig{
            Host: "localhost",
            Port: 8080,
        },
        Database: config.DatabaseConfig{
            Path: "/tmp/test.db",
        },
        Pool: config.PoolConfig{
            MaxInstances: 1,
        },
    }

    // Create manager
    manager := session.NewManager(cfg)
    defer manager.Close()

    // Create server
    server := api.NewServer(cfg, manager)

    // Test create session
    body := map[string]string{
        "workingDirectory": "/tmp",
        "model":            "haiku",
    }
    jsonData, _ := json.Marshal(body)

    req := httptest.NewRequest("POST", "/api/v1/sessions", bytes.NewReader(jsonData))
    req.Header.Set("Content-Type", "application/json")
    w := httptest.NewRecorder()

    server.router.ServeHTTP(w, req)

    if w.Code != http.StatusCreated {
        t.Errorf("expected status 201, got %d", w.Code)
    }

    var resp map[string]interface{}
    json.Unmarshal(w.Body.Bytes(), &resp)

    if _, ok := resp["id"]; !ok {
        t.Error("response should contain id")
    }
}
```

**Step 2: 运行集成测试**

```bash
go test -v -tags=integration ./tests/integration/...
```

**Step 3: Commit**

```bash
git add tests/integration/
git commit -m "test: add integration tests for API"
```

---

## Task 14: E2E测试脚本

**Files:**
- Create: `scripts/test-e2e.bat`

**Step 1: 创建Windows批处理脚本**

```batch
@echo off
REM AI-Bridge E2E Test Script
REM Tests complete workflow from session creation to message exchange

setlocal enabledelayedexpansion

echo ========================================
echo AI-Bridge E2E Test
echo ========================================
echo.

REM Check if ai-bridge exists
if not exist "bin\ai-bridge.exe" (
    echo ERROR: ai-bridge.exe not found
    echo Please run: make build
    exit /b 1
)

REM Start ai-bridge server in background
echo Starting ai-bridge server...
start /B bin\ai-bridge.exe server --config configs\config.yaml > nul 2>&1

REM Wait for server to start
timeout /t 3 /nobreak > nul

REM Test health endpoint
echo Testing health endpoint...
curl -s http://localhost:8080/health
if %ERRORLEVEL% neq 0 (
    echo ERROR: Server not responding
    goto :cleanup
)
echo.
echo OK - Server is running
echo.

REM Create session
echo Creating session...
curl -s -X POST http://localhost:8080/api/v1/sessions ^
  -H "Content-Type: application/json" ^
  -d "{\"workingDirectory\": \".\", \"model\": \"haiku\"}" ^
  > tmp\session_response.json

if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to create session
    goto :cleanup
)

REM Extract session ID
for /f "tokens=2 delims=:," %%a in (tmp\session_response.json) do (
    set SESSION_ID=%%~a
    goto :found_id
)
:found_id
echo Session created: !SESSION_ID!
echo.

REM Get session status
echo Getting session status...
curl -s http://localhost:8080/api/v1/sessions/!SESSION_ID!/status
echo.
echo.

REM Send message
echo Sending test message...
curl -s -X POST http://localhost:8080/api/v1/sessions/!SESSION_ID!/messages ^
  -H "Content-Type: application/json" ^
  -d "{\"content\": \"Hello\"}"
echo.
echo.

echo ========================================
echo E2E Test Completed Successfully!
echo ========================================

:cleanup
echo.
echo Stopping server...
taskkill /F /IM ai-bridge.exe > nul 2>&1
timeout /t 1 /nobreak > nul
echo Done.

endlocal
```

**Step 2: 创建Unix版本**

```bash
# scripts/test-e2e.sh
#!/bin/bash
# AI-Bridge E2E Test Script

echo "========================================"
echo "AI-Bridge E2E Test"
echo "========================================"
echo

# Check if ai-bridge exists
if [ ! -f "bin/ai-bridge" ]; then
    echo "ERROR: ai-bridge not found"
    echo "Please run: make build"
    exit 1
fi

# Start server
echo "Starting ai-bridge server..."
./bin/ai-bridge server --config configs/config.yaml > /tmp/ai-bridge-test.log 2>&1 &
SERVER_PID=$!

# Wait for server
sleep 3

# Test health
echo "Testing health endpoint..."
curl -s http://localhost:8080/health || {
    echo "ERROR: Server not responding"
    kill $SERVER_PID
    exit 1
}
echo
echo "OK - Server is running"
echo

# Create session
echo "Creating session..."
SESSION_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/sessions \
  -H "Content-Type: application/json" \
  -d '{"workingDirectory": ".", "model": "haiku"}')

SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.id')
echo "Session created: $SESSION_ID"
echo

# Get status
echo "Getting session status..."
curl -s http://localhost:8080/api/v1/sessions/$SESSION_ID/status | jq .
echo

# Send message
echo "Sending test message..."
curl -s -X POST http://localhost:8080/api/v1/sessions/$SESSION_ID/messages \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello"}' | jq .
echo

echo "========================================"
echo "E2E Test Completed Successfully!"
echo "========================================"

# Cleanup
echo
echo "Stopping server..."
kill $SERVER_PID
sleep 1
echo "Done."
```

**Step 3: 更新Makefile**

```makefile
test-e2e-windows:
	.\scripts\test-e2e.bat

test-e2e-unix:
	./scripts/test-e2e.sh
```

**Step 4: Commit**

```bash
git add scripts/
git commit -m "test: add E2E test scripts for Windows and Unix"
```

---

## Task 15: Docker部署配置

**Files:**
- Create: `deployments/docker/Dockerfile`
- Create: `deployments/docker/docker-compose.yaml`
- Create: `deployments/docker/.dockerignore`

**Step 1: 创建Dockerfile**

```dockerfile
# deployments/docker/Dockerfile
# Multi-stage build for AI-Bridge

# Build stage
FROM golang:1.23-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git make

# Set working directory
WORKDIR /build

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o ai-bridge ./cmd/ai-bridge

# Runtime stage
FROM alpine:latest

# Install runtime dependencies
RUN apk add --no-cache ca-certificates sqlite

# Create non-root user
RUN addgroup -g 1000 ai-bridge && \
    adduser -D -u 1000 -G ai-bridge ai-bridge

# Set working directory
WORKDIR /app

# Copy binary from builder
COPY --from=builder /build/ai-bridge .
RUN chmod +x ai-bridge

# Create directories
RUN mkdir -p data logs && \
    chown -R ai-bridge:ai-bridge /app

# Switch to non-root user
USER ai-bridge

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Run
ENTRYPOINT ["./ai-bridge"]
CMD ["server", "--config", "configs/config.yaml"]
```

**Step 2: 创建docker-compose**

```yaml
# deployments/docker/docker-compose.yaml
version: '3.8'

services:
  ai-bridge:
    build:
      context: ../..
      dockerfile: deployments/docker/Dockerfile
    container_name: ai-bridge
    ports:
      - "8080:8080"
    environment:
      - AI_BRIDGE_HOST=0.0.0.0
      - AI_BRIDGE_PORT=8080
      - JWT_SECRET=change-this-in-production
      - CLI_API_TOKEN=your-token-here
    volumes:
      # Persist data
      - ai-bridge-data:/app/data
      - ai-bridge-logs:/app/logs
      # Mount config (optional - for development)
      # - ../../configs/config.yaml:/app/configs/config.yaml:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s
    networks:
      - ai-bridge-net

volumes:
  ai-bridge-data:
    driver: local
  ai-bridge-logs:
    driver: local

networks:
  ai-bridge-net:
    driver: bridge
```

**Step 3: 创建.dockerignore**

```
# deployments/docker/.dockerignore
bin/
*.exe
*.dll
*.so
*.dylib
*.test
*.out
coverage.out
coverage.html

# Test files
*_test.go
tests/
tmp/

# Documentation
docs/
*.md
!README.md

# Git
.git/
.gitignore

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs and data
logs/
data/
*.db
*.db-shm
*.db-wal

# Config (use example in container)
configs/config.yaml
```

**Step 4: 创建部署README**

```markdown
# deployments/docker/README.md
# AI-Bridge Docker 部署

## 快速启动

```bash
cd deployments/docker
docker-compose up -d
```

## 查看日志

```bash
docker-compose logs -f
```

## 停止服务

```bash
docker-compose down
```

## 环境变量

修改`docker-compose.yaml`中的环境变量:

- `JWT_SECRET`: JWT密钥
- `CLI_API_TOKEN`: Claude CLI API token

## 数据持久化

数据存储在Docker卷中:
- `ai-bridge-data`: 数据库文件
- `ai-bridge-logs`: 日志文件
```

**Step 5: Commit**

```bash
git add deployments/
git commit -m "deploy: add Docker deployment configuration"
```

---

## 执行选项

**计划已完成并保存到 `docs/plans/2026-02-04-ai-bridge-implementation.md`。**

**两个执行选项:**

**1. 子代理驱动(当前会话)** - 我为每个任务调度新的子代理,任务间进行代码审查,快速迭代

**2. 并行会话(独立)** - 在新的会话中使用 executing-plans,批量执行并设置检查点

**您选择哪种方式?**

**如果选择子代理驱动:**
- **REQUIRED SUB-SKILL:** 使用 superpowers:subagent-driven-development
- 保留在当前会话
- 每个任务使用新的子代理 + 代码审查

**如果选择并行会话:**
- 引导您在 worktree 中打开新会话
- **REQUIRED SUB-SKILL:** 新会话使用 superpowers:executing-plans

---

## 后续任务概览

剩余主要任务包括:
- Task 8: HTTP API 处理器 (会话、消息、权限、停止)
- Task 9: WebSocket 服务器
- Task 10: 斜杠命令发现和执行
- Task 11: 健康监控
- Task 12: 单元测试 (所有模块)
- Task 13: 集成测试
- Task 14: E2E 测试脚本
- Task 15: Docker 部署配置

完整计划已保存在文件中,随时可以继续执行。
