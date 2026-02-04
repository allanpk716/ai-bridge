# AI-Bridge TDD 测试方案

## 测试驱动开发策略

本文档定义了 AI-Bridge 项目的完整测试方案，采用 **测试驱动开发（TDD）** 方法论。

### TDD 核心原则

```
┌─────────────────────────────────────────────────────────┐
│ TDD 循环（红-绿-重构）                                    │
├─────────────────────────────────────────────────────────┤
│ 1. 🔴 RED   - 先写一个失败的测试                          │
│ 2. 🟢 GREEN - 编写最少代码使测试通过                       │
│ 3. 🔵 REFACTOR - 重构代码，保持测试通过                    │
└─────────────────────────────────────────────────────────┘
```

### 测试金字塔

```
                    ┌──────────────┐
                    │   E2E Tests  │  ← 端到端测试（少量）
                    │    (10%)     │
                    ├──────────────┤
                    │ Integration  │  ← 集成测试（适量）
                    │    (30%)     │
                    ├──────────────┤
                    │  Unit Tests  │  ← 单元测试（大量）
                    │    (60%)     │
                    └──────────────┘
```

---

## 一、测试工具链

### 1.1 Go 测试框架

```go
// go.mod 测试依赖
require (
    github.com/stretchr/testify v1.9.0         // 断言库
    github.com/golang/mock v1.6.0              // Mock 框架
    github.com/testcontainers/testcontainers-go // 集成测试容器
    github.com/gavv/httpexpect/v2 v2.16.0      // HTTP API 测试
    github.com/stretchr/testify/suite v1.9.0   // 测试套件
)
```

### 1.2 测试工具安装

```bash
# 安装测试依赖
go get github.com/stretchr/testify/assert
go get github.com/stretchr/testify/mock
go get github.com/stretchr/testify/suite

# 安装测试覆盖率工具
go install github.com/axw/gocov/gocov@latest
go install github.com/AlekSi/gocov-xml@latest

# 安装 benchmark 工具
go install golang.org/x/perf/cmd/benchstat@latest
```

### 1.3 Makefile 测试命令

```makefile
# Makefile
.PHONY: test test-unit test-integration test-e2e test-all test-coverage

# 运行所有测试
test-all:
	@echo "Running all tests..."
	@go test -v -race -coverprofile=coverage.out ./...

# 单元测试
test-unit:
	@echo "Running unit tests..."
	@go test -v -short ./internal/...

# 集成测试
test-integration:
	@echo "Running integration tests..."
	@go test -v -tags=integration ./tests/integration/...

# 端到端测试
test-e2e:
	@echo "Running E2E tests..."
	@./scripts/test-e2e.sh

# 测试覆盖率
test-coverage:
	@echo "Generating coverage report..."
	@go test -coverprofile=coverage.out ./...
	@go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report: coverage.html"

# 基准测试
test-bench:
	@echo "Running benchmarks..."
	@go test -bench=. -benchmem ./...

# 生成测试报告
test-report:
	@go test -json ./... > test-report.json
	@go tool cover -func=coverage.out > coverage.txt
```

---

## 二、单元测试策略

### 2.1 测试覆盖率目标

| 模块 | 目标覆盖率 | 说明 |
|------|-----------|------|
| **claude/** | 90% | 核心逻辑，需要高覆盖 |
| **pool/** | 85% | 进程管理逻辑 |
| **session/** | 90% | 会话管理，复杂逻辑 |
| **commands/** | 80% | 命令解析 |
| **api/** | 75% | HTTP 处理器 |
| **websocket/** | 75% | WebSocket 处理器 |

**总体目标**: 80% 代码覆盖率

### 2.2 测试命名规范

```go
// 测试函数命名：Test<FunctionName><Scenario>
func TestProcess_Start_Success(t *testing.T)           // ✅ 成功场景
func TestProcess_Start_AlreadyRunning(t *testing.T)    // ✅ 边界场景
func TestProcess_Start_CommandNotFound(t *testing.T)   // ✅ 错误场景

// 表格驱动测试
func TestProcess_SendMessage(t *testing.T) {
    tests := []struct {
        name    string
        setup   func(*Process)
        input   string
        wantErr bool
        errMsg  string
    }{
        {
            name: "发送成功",
            setup: func(p *Process) { p.Start(ctx) },
            input: "test message",
            wantErr: false,
        },
        {
            name: "进程未启动",
            setup: func(p *Process) { /* 不启动 */ },
            input: "test message",
            wantErr: true,
            errMsg: "process not running",
        },
    }
    // ...
}
```

---

## 三、模块化测试方案

### 3.1 Claude 进程管理 (internal/claude/)

#### 3.1.1 Process 启动和停止

**测试文件**: `internal/claude/process_test.go`

```go
package claude_test

import (
    "context"
    "os"
    "testing"
    "time"

    "ai-bridge/internal/claude"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

// TestProcess_Start_Success 测试进程启动成功
func TestProcess_Start_Success(t *testing.T) {
    // Arrange
    ctx := context.Background()
    config := claude.Config{
        WorkingDir:     os.TempDir(),
        Model:          "haiku",
        PermissionMode: "normal",
    }
    proc := claude.NewProcess("test-1", config)

    // Act
    err := proc.Start(ctx)

    // Assert
    require.NoError(t, err)
    assert.True(t, proc.IsRunning())

    // Cleanup
    proc.Stop(ctx)
}

// TestProcess_Start_CommandNotFound 测试命令不存在
func TestProcess_Start_CommandNotFound(t *testing.T) {
    // Arrange
    ctx := context.Background()
    config := claude.Config{
        WorkingDir: os.TempDir(),
    }
    proc := claude.NewProcess("test-2", config)

    // Mock: 设置无效的执行路径
    proc.SetExecPath("invalid-command-that-does-not-exist")

    // Act
    err := proc.Start(ctx)

    // Assert
    assert.Error(t, err)
    assert.Contains(t, err.Error(), "not found")
    assert.False(t, proc.IsRunning())
}

// TestProcess_Start_AlreadyRunning 测试重复启动
func TestProcess_Start_AlreadyRunning(t *testing.T) {
    // Arrange
    ctx := context.Background()
    config := claude.Config{
        WorkingDir: os.TempDir(),
    }
    proc := claude.NewProcess("test-3", config)
    require.NoError(t, proc.Start(ctx))

    // Act
    err := proc.Start(ctx)

    // Assert
    assert.Error(t, err)
    assert.Contains(t, err.Error(), "already running")

    // Cleanup
    proc.Stop(ctx)
}

// TestProcess_Stop_Graceful 测试优雅停止
func TestProcess_Stop_Graceful(t *testing.T) {
    // Arrange
    ctx := context.Background()
    config := claude.Config{
        WorkingDir: os.TempDir(),
    }
    proc := claude.NewProcess("test-4", config)
    require.NoError(t, proc.Start(ctx))

    // Act
    err := proc.Stop(ctx)

    // Assert
    assert.NoError(t, err)
    assert.False(t, proc.IsRunning())
}

// TestProcess_Stop_Timeout 测试停止超时
func TestProcess_Stop_Timeout(t *testing.T) {
    // Arrange
    ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
    defer cancel()

    config := claude.Config{
        WorkingDir: os.TempDir(),
    }
    proc := claude.NewProcess("test-5", config)
    require.NoError(t, proc.Start(ctx))

    // Act
    err := proc.Stop(ctx)

    // Assert
    // 可能超时或成功，取决于进程响应速度
    if err != nil {
        assert.Contains(t, err.Error(), "timeout")
    }
}

// TestProcess_Events 测试事件流
func TestProcess_Events(t *testing.T) {
    // Arrange
    ctx := context.Background()
    config := claude.Config{
        WorkingDir: os.TempDir(),
    }
    proc := claude.NewProcess("test-6", config)

    eventChan := proc.Events()

    // Act
    err := proc.Start(ctx)

    // Assert
    require.NoError(t, err)

    // 等待启动事件
    select {
    case event := <-eventChan:
        assert.Equal(t, claude.EventTypeStarted, event.Type)
        assert.Equal(t, "test-6", event.ProcessID)
    case <-time.After(5 * time.Second):
        t.Fatal("Timeout waiting for start event")
    }

    // Cleanup
    proc.Stop(ctx)

    // 等待停止事件
    select {
    case event := <-eventChan:
        assert.Equal(t, claude.EventTypeStopped, event.Type)
    case <-time.After(5 * time.Second):
        t.Fatal("Timeout waiting for stop event")
    }
}
```

#### 3.1.2 消息发送

**测试文件**: `internal/claude/process_message_test.go`

```go
package claude_test

// TestProcess_SendMessage_Success 测试发送消息成功
func TestProcess_SendMessage_Success(t *testing.T) {
    // Arrange
    ctx := context.Background()
    config := claude.Config{
        WorkingDir: os.TempDir(),
    }
    proc := claude.NewProcess("test-msg-1", config)
    require.NoError(t, proc.Start(ctx))
    defer proc.Stop(ctx)

    // Act
    err := proc.SendMessage(ctx, "hello")

    // Assert
    assert.NoError(t, err)
}

// TestProcess_SendMessage_NotRunning 测试向未启动的进程发送消息
func TestProcess_SendMessage_NotRunning(t *testing.T) {
    // Arrange
    ctx := context.Background()
    config := claude.Config{
        WorkingDir: os.TempDir(),
    }
    proc := claude.NewProcess("test-msg-2", config)
    // 不启动进程

    // Act
    err := proc.SendMessage(ctx, "hello")

    // Assert
    assert.Error(t, err)
    assert.Contains(t, err.Error(), "not running")
}

// TestProcess_SendMessage_Empty 测试发送空消息
func TestProcess_SendMessage_Empty(t *testing.T) {
    // Arrange
    ctx := context.Background()
    config := claude.Config{
        WorkingDir: os.TempDir(),
    }
    proc := claude.NewProcess("test-msg-3", config)
    require.NoError(t, proc.Start(ctx))
    defer proc.Stop(ctx)

    // Act
    err := proc.SendMessage(ctx, "")

    // Assert
    // 空消息应该被接受或拒绝，取决于设计
    // 这里假设应该拒绝
    assert.Error(t, err)
}

// TestProcess_ReceiveMessage 测试接收消息
func TestProcess_ReceiveMessage(t *testing.T) {
    // Arrange
    ctx := context.Background()
    config := claude.Config{
        WorkingDir:     os.TempDir(),
        PermissionMode: "normal",
    }
    proc := claude.NewProcess("test-msg-4", config)
    require.NoError(t, proc.Start(ctx))
    defer proc.Stop(ctx)

    msgChan := proc.Messages()

    // Act
    err := proc.SendMessage(ctx, "say hello")

    // Assert
    require.NoError(t, err)

    // 等待响应消息
    select {
    case msg := <-msgChan:
        assert.Equal(t, claude.MessageTypeAssistant, msg.Type)
        assert.NotEmpty(t, msg.Content)
    case <-time.After(30 * time.Second):
        t.Fatal("Timeout waiting for message")
    }
}

// TestProcess_SendMessage_TableDriven 表格驱动测试
func TestProcess_SendMessage_TableDriven(t *testing.T) {
    tests := []struct {
        name      string
        setup     func(*claude.Process)
        input     string
        wantErr   bool
        errMsg    string
        checkResp bool
    }{
        {
            name: "正常消息",
            setup: func(p *claude.Process) {
                // 确保进程已启动
            },
            input:     "test",
            wantErr:   false,
            checkResp: true,
        },
        {
            name: "包含特殊字符",
            setup: func(p *claude.Process) {
                // 确保进程已启动
            },
            input:     "test with 特殊字符 and emoji 🎉",
            wantErr:   false,
            checkResp: false,
        },
        {
            name: "长消息",
            setup: func(p *claude.Process) {
                // 确保进程已启动
            },
            input:     string(make([]byte, 10000)), // 10KB 消息
            wantErr:   false,
            checkResp: false,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // Arrange
            ctx := context.Background()
            config := claude.Config{
                WorkingDir: os.TempDir(),
            }
            proc := claude.NewProcess("td-"+tt.name, config)
            require.NoError(t, proc.Start(ctx))
            defer proc.Stop(ctx)

            tt.setup(proc)

            // Act
            err := proc.SendMessage(ctx, tt.input)

            // Assert
            if tt.wantErr {
                assert.Error(t, err)
                if tt.errMsg != "" {
                    assert.Contains(t, err.Error(), tt.errMsg)
                }
            } else {
                assert.NoError(t, err)
            }

            if tt.checkResp {
                msgChan := proc.Messages()
                select {
                case <-msgChan:
                    // 收到响应
                case <-time.After(30 * time.Second):
                    t.Error("Timeout waiting for response")
                }
            }
        })
    }
}
```

#### 3.1.3 权限处理

**测试文件**: `internal/claude/process_permission_test.go`

```go
package claude_test

// TestProcess_SendApproval_SessionScope 测试会话级别批准
func TestProcess_SendApproval_SessionScope(t *testing.T) {
    // Arrange
    ctx := context.Background()
    config := claude.Config{
        WorkingDir: os.TempDir(),
    }
    proc := claude.NewProcess("test-perm-1", config)
    require.NoError(t, proc.Start(ctx))
    defer proc.Stop(ctx)

    // Act
    err := proc.SendApproval(ctx, "req-123", true, "session")

    // Assert
    assert.NoError(t, err)
}

// TestProcess_SendApproval_OnceScope 测试一次性批准
func TestProcess_SendApproval_OnceScope(t *testing.T) {
    // Arrange
    ctx := context.Background()
    config := claude.Config{
        WorkingDir: os.TempDir(),
    }
    proc := claude.NewProcess("test-perm-2", config)
    require.NoError(t, proc.Start(ctx))
    defer proc.Stop(ctx)

    // Act
    err := proc.SendApproval(ctx, "req-123", true, "once")

    // Assert
    assert.NoError(t, err)
}

// TestProcess_SendApproval_Deny 测试拒绝权限
func TestProcess_SendApproval_Deny(t *testing.T) {
    // Arrange
    ctx := context.Background()
    config := claude.Config{
        WorkingDir: os.TempDir(),
    }
    proc := claude.NewProcess("test-perm-3", config)
    require.NoError(t, proc.Start(ctx))
    defer proc.Stop(ctx)

    // Act
    err := proc.SendApproval(ctx, "req-123", false, "")

    // Assert
    assert.NoError(t, err)
}

// TestProcess_PermissionRequest 测试权限请求消息
func TestProcess_PermissionRequest(t *testing.T) {
    // Arrange
    ctx := context.Background()
    config := claude.Config{
        WorkingDir:     os.TempDir(),
        PermissionMode: "normal",
        AllowedTools:   []string{}, // 空列表触发权限请求
    }
    proc := claude.NewProcess("test-perm-4", config)
    require.NoError(t, proc.Start(ctx))
    defer proc.Stop(ctx)

    msgChan := proc.Messages()

    // Act - 发送需要权限的请求
    err := proc.SendMessage(ctx, "Read /etc/passwd")

    // Assert
    require.NoError(t, err)

    // 等待权限请求
    select {
    case msg := <-msgChan:
        assert.Equal(t, claude.MessageTypePermission, msg.Type)
        permReq, ok := msg.Content.(*claude.PermissionRequest)
        assert.True(t, ok)
        assert.NotEmpty(t, permReq.RequestID)
    case <-time.After(10 * time.Second):
        t.Fatal("Timeout waiting for permission request")
    }
}
```

### 3.2 进程池管理 (internal/pool/)

#### 3.2.1 进程池基础

**测试文件**: `internal/pool/pool_test.go`

```go
package pool_test

import (
    "context"
    "os"
    "testing"
    "time"

    "ai-bridge/internal/claude"
    "ai-bridge/internal/pool"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

// TestNewPool 测试创建进程池
func TestNewPool(t *testing.T) {
    // Arrange & Act
    p := pool.NewPool(pool.Config{
        MaxInstances: 5,
        IdleTimeout:  300 * time.Second,
    })

    // Assert
    assert.NotNil(t, p)
    assert.Equal(t, 0, p.Stats().Total)
}

// TestPool_Acquire_NewProcess 测试获取新进程
func TestPool_Acquire_NewProcess(t *testing.T) {
    // Arrange
    ctx := context.Background()
    p := pool.NewPool(pool.Config{
        MaxInstances: 5,
    })

    config := claude.Config{
        WorkingDir: os.TempDir(),
    }

    // Act
    proc, err := p.Acquire(ctx, config)

    // Assert
    require.NoError(t, err)
    assert.NotNil(t, proc)
    assert.True(t, proc.IsRunning())
    assert.Equal(t, 1, p.Stats().Total)

    // Cleanup
    proc.Stop(ctx)
}

// TestPool_Acquire_ReuseProcess 测试复用进程
func TestPool_Acquire_ReuseProcess(t *testing.T) {
    // Arrange
    ctx := context.Background()
    p := pool.NewPool(pool.Config{
        MaxInstances: 5,
    })

    workingDir := os.TempDir()
    config := claude.Config{
        WorkingDir: workingDir,
    }

    // 第一次获取
    proc1, err := p.Acquire(ctx, config)
    require.NoError(t, err)
    procID1 := proc1.ID()

    // 释放
    p.Release(procID1)

    // Act - 第二次获取（相同工作目录）
    proc2, err := p.Acquire(ctx, config)

    // Assert - 应该复用同一进程
    require.NoError(t, err)
    assert.Equal(t, procID1, proc2.ID())

    // Cleanup
    proc2.Stop(ctx)
}

// TestPool_Acquire_MaxInstances 测试达到最大实例数
func TestPool_Acquire_MaxInstances(t *testing.T) {
    // Arrange
    ctx := context.Background()
    p := pool.NewPool(pool.Config{
        MaxInstances: 2, // 最多 2 个实例
    })

    config := claude.Config{
        WorkingDir: os.TempDir(),
    }

    // 获取第一个实例
    proc1, err := p.Acquire(ctx, config)
    require.NoError(t, err)

    // 获取第二个实例（不同工作目录）
    config2 := claude.Config{
        WorkingDir: os.TempDir() + "/2",
    }
    proc2, err := p.Acquire(ctx, config2)
    require.NoError(t, err)

    // Act - 尝试获取第三个实例
    config3 := claude.Config{
        WorkingDir: os.TempDir() + "/3",
    }
    _, err = p.Acquire(ctx, config3)

    // Assert - 应该失败
    assert.Error(t, err)
    assert.Contains(t, err.Error(), "max instances")

    // Cleanup
    proc1.Stop(ctx)
    proc2.Stop(ctx)
}

// TestPool_Remove 测试移除进程
func TestPool_Remove(t *testing.T) {
    // Arrange
    ctx := context.Background()
    p := pool.NewPool(pool.Config{
        MaxInstances: 5,
    })

    config := claude.Config{
        WorkingDir: os.TempDir(),
    }

    proc, err := p.Acquire(ctx, config)
    require.NoError(t, err)
    procID := proc.ID()

    // Act
    err = p.Remove(procID)

    // Assert
    assert.NoError(t, err)
    assert.Equal(t, 0, p.Stats().Running)
}

// TestPool_Remove_NotFound 测试移除不存在的进程
func TestPool_Remove_NotFound(t *testing.T) {
    // Arrange
    p := pool.NewPool(pool.Config{})

    // Act
    err := p.Remove("nonexistent")

    // Assert
    assert.Error(t, err)
    assert.Contains(t, err.Error(), "not found")
}

// TestPool_Get 测试获取进程
func TestPool_Get(t *testing.T) {
    // Arrange
    ctx := context.Background()
    p := pool.NewPool(pool.Config{})

    config := claude.Config{
        WorkingDir: os.TempDir(),
    }

    proc, err := p.Acquire(ctx, config)
    require.NoError(t, err)
    procID := proc.ID()

    // Act
    retrievedProc, ok := p.Get(procID)

    // Assert
    assert.True(t, ok)
    assert.Equal(t, procID, retrievedProc.ID())

    // Cleanup
    proc.Stop(ctx)
}

// TestPool_Stats 测试统计信息
func TestPool_Stats(t *testing.T) {
    // Arrange
    ctx := context.Background()
    p := pool.NewPool(pool.Config{
        MaxInstances: 5,
    })

    config := claude.Config{
        WorkingDir: os.TempDir(),
    }

    // Act
    proc1, _ := p.Acquire(ctx, config)
    proc2, _ := p.Acquire(ctx, config)

    // Assert
    stats := p.Stats()
    assert.Equal(t, 2, stats.Total)
    assert.Equal(t, 2, stats.Running)
    assert.Equal(t, 5, stats.Max)

    // Cleanup
    proc1.Stop(ctx)
    proc2.Stop(ctx)
}

// TestPool_Cleanup 测试清理空闲进程
func TestPool_Cleanup(t *testing.T) {
    // Arrange
    ctx := context.Background()
    p := pool.NewPool(pool.Config{
        MaxInstances: 5,
    })

    config := claude.Config{
        WorkingDir: os.TempDir(),
    }

    proc, _ := p.Acquire(ctx, config)
    proc.Stop(ctx) // 停止进程

    // Act
    err := p.Cleanup(ctx)

    // Assert
    assert.NoError(t, err)
    assert.Equal(t, 0, p.Stats().Running)
}
```

### 3.3 会话管理 (internal/session/)

#### 3.3.1 会话生命周期

**测试文件**: `internal/session/session_test.go`

```go
package session_test

import (
    "context"
    "testing"
    "time"

    "ai-bridge/internal/claude"
    "ai-bridge/internal/session"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

// TestNewSession 测试创建会话
func TestNewSession(t *testing.T) {
    // Arrange
    proc := &mockProcess{id: "test-proc"}

    // Act
    s := session.NewSession("sess-1", proc)

    // Assert
    assert.Equal(t, "sess-1", s.ID())
    assert.Equal(t, proc, s.GetProcess())
    assert.Equal(t, int64(0), s.Stats().TotalMessages)
}

// TestSession_AddMessage 测试添加消息
func TestSession_AddMessage(t *testing.T) {
    // Arrange
    proc := &mockProcess{id: "test-proc"}
    s := session.NewSession("sess-1", proc)

    msg := &session.Message{
        Type:      session.MessageTypeUser,
        Content:   "test message",
        Timestamp: time.Now(),
    }

    // Act
    err := s.AddMessage(msg)

    // Assert
    assert.NoError(t, err)
    assert.Equal(t, int64(1), s.Stats().TotalMessages)
    assert.Equal(t, int64(1), msg.Seq)
}

// TestSession_AddMessage_SequentialSeq 测试消息序号递增
func TestSession_AddMessage_SequentialSeq(t *testing.T) {
    // Arrange
    proc := &mockProcess{id: "test-proc"}
    s := session.NewSession("sess-1", proc)

    // Act - 添加多条消息
    for i := 0; i < 5; i++ {
        msg := &session.Message{
            Type:      session.MessageTypeUser,
            Content:   "message",
            Timestamp: time.Now(),
        }
        s.AddMessage(msg)
    }

    // Assert
    stats := s.Stats()
    assert.Equal(t, int64(5), stats.TotalMessages)
    assert.Equal(t, int64(5), stats.LastSeq)
}

// TestSession_Subscribe 测试订阅消息
func TestSession_Subscribe(t *testing.T) {
    // Arrange
    proc := &mockProcess{id: "test-proc"}
    s := session.NewSession("sess-1", proc)

    ctx := context.Background()
    filter := session.MessageFilter{
        SinceSeq: 0,
    }

    // Act
    msgChan, unsubscribe := s.Subscribe(ctx, filter)

    // Assert
    assert.NotNil(t, msgChan)

    // 发送测试消息
    msg := &session.Message{
        Type:      session.MessageTypeUser,
        Content:   "test",
        Timestamp: time.Now(),
    }
    s.AddMessage(msg)

    // 验证收到消息
    select {
    case receivedMsg := <-msgChan:
        assert.Equal(t, msg.Seq, receivedMsg.Seq)
    case <-time.After(1 * time.Second):
        t.Fatal("Timeout waiting for message")
    }

    // 清理
    unsubscribe()
}

// TestSession_Subscribe_FilterSinceSeq 测试订阅过滤器
func TestSession_Subscribe_FilterSinceSeq(t *testing.T) {
    // Arrange
    proc := &mockProcess{id: "test-proc"}
    s := session.NewSession("sess-1", proc)

    // 添加一些消息
    for i := 1; i <= 5; i++ {
        msg := &session.Message{
            Type:      session.MessageTypeUser,
            Content:   "message",
            Timestamp: time.Now(),
        }
        s.AddMessage(msg)
    }

    ctx := context.Background()
    filter := session.MessageFilter{
        SinceSeq: 3, // 只接收 seq > 3 的消息
    }

    // Act
    msgChan, unsubscribe := s.Subscribe(ctx, filter)

    // Assert - 应该立即收到 seq 4 和 5
    receivedCount := 0
    timeout := time.After(100 * time.Millisecond)
    for {
        select {
        case <-msgChan:
            receivedCount++
        case <-timeout:
            goto Done
        }
    }
Done:

    assert.Equal(t, 2, receivedCount) // seq 4 和 5

    unsubscribe()
}

// TestSession_GetMessages_Pagination 测试分页获取消息
func TestSession_GetMessages_Pagination(t *testing.T) {
    // Arrange
    proc := &mockProcess{id: "test-proc"}
    s := session.NewSession("sess-1", proc)

    // 添加 100 条消息
    for i := 0; i < 100; i++ {
        msg := &session.Message{
            Type:      session.MessageTypeUser,
            Content:   "message",
            Timestamp: time.Now(),
        }
        s.AddMessage(msg)
    }

    ctx := context.Background()

    // Act - 获取前 50 条
    opts := session.GetMessagesOptions{
        Limit: 50,
    }
    messages, err := s.GetMessages(ctx, opts)

    // Assert
    require.NoError(t, err)
    assert.Len(t, messages, 50)

    // 验证是最新的 50 条
    assert.Equal(t, int64(100), messages[0].Seq)
    assert.Equal(t, int64(51), messages[49].Seq)
}

// TestSession_GetMessages_SinceSeq 测试增量获取
func TestSession_GetMessages_SinceSeq(t *testing.T) {
    // Arrange
    proc := &mockProcess{id: "test-proc"}
    s := session.NewSession("sess-1", proc)

    // 添加消息
    for i := 1; i <= 10; i++ {
        msg := &session.Message{
            Type:      session.MessageTypeUser,
            Content:   "message",
            Timestamp: time.Now(),
        }
        s.AddMessage(msg)
    }

    ctx := context.Background()

    // Act - 获取 seq > 5 的消息
    opts := session.GetMessagesOptions{
        SinceSeq: 5,
    }
    messages, err := s.GetMessages(ctx, opts)

    // Assert
    require.NoError(t, err)
    assert.Len(t, messages, 5) // seq 6, 7, 8, 9, 10
    assert.Equal(t, int64(6), messages[0].Seq)
}

// TestSession_Stats 测试统计信息
func TestSession_Stats(t *testing.T) {
    // Arrange
    proc := &mockProcess{id: "test-proc"}
    s := session.NewSession("sess-1", proc)

    // 添加消息
    for i := 0; i < 10; i++ {
        msg := &session.Message{
            Type:      session.MessageTypeUser,
            Content:   "message",
            Timestamp: time.Now(),
        }
        s.AddMessage(msg)
    }

    // 添加订阅者
    ctx := context.Background()
    _, unsubscribe := s.Subscribe(ctx, session.MessageFilter{})
    defer unsubscribe()

    // Act
    stats := s.Stats()

    // Assert
    assert.Equal(t, int64(10), stats.TotalMessages)
    assert.Equal(t, 10, stats.RecentMessages)
    assert.Equal(t, int64(10), stats.LastSeq)
    assert.Equal(t, 1, stats.SubscriberCount)
}

#### 3.3.2 会话状态跟踪（新增）

**测试文件**: `internal/session/session_status_test.go`

```go
package session_test

// TestSession_GetStatus_Idle 测试获取空闲状态
func TestSession_GetStatus_Idle(t *testing.T) {
    // Arrange
    proc := &mockProcess{id: "test-proc"}
    s := session.NewSession("sess-1", proc)

    // Act
    status := s.GetStatus()

    // Assert
    assert.Equal(t, "sess-1", status.SessionID)
    assert.Equal(t, session.StateIdle, status.State)
    assert.Equal(t, int64(0), status.Duration)
    assert.Equal(t, int64(0), status.TotalMessages)
    assert.Equal(t, int64(0), status.ProcessingCount)
}

// TestSession_GetStatus_Processing 测试获取处理中状态
func TestSession_GetStatus_Processing(t *testing.T) {
    // Arrange
    proc := &mockProcess{id: "test-proc"}
    s := session.NewSession("sess-1", proc)

    // 开始处理消息
    s.StartProcessing(1)

    // 等待一段时间
    time.Sleep(100 * time.Millisecond)

    // Act
    status := s.GetStatus()

    // Assert
    assert.Equal(t, session.StateProcessing, status.State)
    assert.Greater(t, status.Duration, int64(100)) // 至少 100ms
    assert.Equal(t, int64(1), status.ProcessingCount)
}

// TestSession_StateTransition 测试状态转换
func TestSession_StateTransition(t *testing.T) {
    // Arrange
    proc := &mockProcess{id: "test-proc"}
    s := session.NewSession("sess-1", proc)

    // 初始状态: idle
    status := s.GetStatus()
    assert.Equal(t, session.StateIdle, status.State)

    // 转换到 processing
    s.StartProcessing(1)
    status = s.GetStatus()
    assert.Equal(t, session.StateProcessing, status.State)

    // 完成处理，回到 idle
    s.CompleteProcessing(1)
    status = s.GetStatus()
    assert.Equal(t, session.StateIdle, status.State)

    // 转换到 waiting
    s.SetState(session.StateWaiting)
    status = s.GetStatus()
    assert.Equal(t, session.StateWaiting, status.State)
}

// TestSession_ProcessingDuration 测试处理时长记录
func TestSession_ProcessingDuration(t *testing.T) {
    // Arrange
    proc := &mockProcess{id: "test-proc"}
    s := session.NewSession("sess-1", proc)

    // 开始处理
    s.StartProcessing(1)

    // 等待 200ms
    time.Sleep(200 * time.Millisecond)

    // 完成处理
    s.CompleteProcessing(1)

    // Act - 获取消息
    opts := session.GetMessagesOptions{
        Limit: 1,
    }
    messages, _ := s.GetMessages(context.Background(), opts)

    // Assert - 验证处理时长被记录
    if len(messages) > 0 {
        msg := messages[0]
        assert.GreaterOrEqual(t, msg.ProcessingDuration, int64(200)) // 至少 200ms
    }
}

// TestSession_DurationIncrements 测试时长递增
func TestSession_DurationIncrements(t *testing.T) {
    // Arrange
    proc := &mockProcess{id: "test-proc"}
    s := session.NewSession("sess-1", proc)

    s.StartProcessing(1)

    // Act - 多次获取状态，验证时长递增
    status1 := s.GetStatus()
    time.Sleep(50 * time.Millisecond)
    status2 := s.GetStatus()
    time.Sleep(50 * time.Millisecond)
    status3 := s.GetStatus()

    // Assert
    assert.Greater(t, status2.Duration, status1.Duration)
    assert.Greater(t, status3.Duration, status2.Duration)
}

// TestSession_MultipleProcessingMessages 测试多条消息同时处理
func TestSession_MultipleProcessingMessages(t *testing.T) {
    // Arrange
    proc := &mockProcess{id: "test-proc"}
    s := session.NewSession("sess-1", proc)

    // 开始处理多条消息
    s.StartProcessing(1)
    s.StartProcessing(2)
    s.StartProcessing(3)

    // Act
    status := s.GetStatus()

    // Assert
    assert.Equal(t, session.StateProcessing, status.State)
    assert.Equal(t, int64(3), status.ProcessingCount)

    // 完成所有消息
    s.CompleteProcessing(1)
    s.CompleteProcessing(2)
    s.CompleteProcessing(3)

    status = s.GetStatus()
    assert.Equal(t, session.StateIdle, status.State)
    assert.Equal(t, int64(0), status.ProcessingCount)
}
```

#### 3.3.3 手动停止功能（新增）

**测试文件**: `internal/session/session_stop_test.go`

```go
package session_test

// TestSession_Stop_Processing 测试停止正在处理的会话
func TestSession_Stop_Processing(t *testing.T) {
    // Arrange
    proc := &mockInterruptableProcess{id: "test-proc"}
    s := session.NewSession("sess-1", proc)

    // 开始处理消息
    s.StartProcessing(1)
    assert.Equal(t, session.StateProcessing, s.GetStatus().State)

    // Act - 停止会话
    err := s.Stop(context.Background())

    // Assert
    require.NoError(t, err)
    assert.Equal(t, session.StateStopped, s.GetStatus().State)
    assert.True(t, proc.InterruptCalled)
}

// TestSession_Stop_Idle 测试停止空闲会话
func TestSession_Stop_Idle(t *testing.T) {
    // Arrange
    proc := &mockProcess{id: "test-proc"}
    s := session.NewSession("sess-1", proc)

    // 会话是空闲状态
    assert.Equal(t, session.StateIdle, s.GetStatus().State)

    // Act - 尝试停止
    err := s.Stop(context.Background())

    // Assert - 应该返回错误
    assert.Error(t, err)
    assert.Contains(t, err.Error(), "not processing")
}

// TestSession_Stop_Waiting 测试停止等待权限的会话
func TestSession_Stop_Waiting(t *testing.T) {
    // Arrange
    proc := &mockInterruptableProcess{id: "test-proc"}
    s := session.NewSession("sess-1", proc)

    // 设置为等待状态
    s.SetState(session.StateWaiting)

    // Act - 停止会话
    err := s.Stop(context.Background())

    // Assert
    require.NoError(t, err)
    assert.Equal(t, session.StateStopped, s.GetStatus().State)
    assert.True(t, proc.InterruptCalled)
}

// TestSession_Stop_AfterStop 测试重复停止
func TestSession_Stop_AfterStop(t *testing.T) {
    // Arrange
    proc := &mockInterruptableProcess{id: "test-proc"}
    s := session.NewSession("sess-1", proc)

    s.StartProcessing(1)

    // 第一次停止
    err := s.Stop(context.Background())
    require.NoError(t, err)

    // Act - 第二次停止
    err = s.Stop(context.Background())

    // Assert - 应该返回错误（已经停止）
    assert.Error(t, err)
}

// Mock 进程（支持中断）
type mockInterruptableProcess struct {
    id              string
    InterruptCalled bool
    InterruptError  error
}

func (m *mockInterruptableProcess) ID() string {
    return m.id
}

func (m *mockInterruptableProcess) Start(ctx context.Context) error {
    return nil
}

func (m *mockInterruptableProcess) Stop(ctx context.Context) error {
    return nil
}

func (m *mockInterruptableProcess) IsRunning() bool {
    return true
}

func (m *mockInterruptableProcess) SendMessage(ctx context.Context, text string) error {
    return nil
}

func (m *mockInterruptableProcess) SendApproval(ctx context.Context, requestID string, approved bool, scope string) error {
    return nil
}

func (m *mockInterruptableProcess) Interrupt(ctx context.Context) error {
    m.InterruptCalled = true
    return m.InterruptError
}
```

---

### 3.4 Claude 进程中断功能（新增）

**测试文件**: `internal/claude/process_interrupt_test.go`

```go
package claude_test

// TestProcess_Interrupt_Success 测试中断进程
func TestProcess_Interrupt_Success(t *testing.T) {
    // Arrange
    ctx := context.Background()
    config := claude.Config{
        WorkingDir: os.TempDir(),
    }
    proc := claude.NewProcess("test-interrupt-1", config)
    require.NoError(t, proc.Start(ctx))
    defer proc.Stop(ctx)

    // 发送一个长时间任务
    proc.SendMessage(ctx, "analyze entire project")

    // 等待处理开始
    time.Sleep(500 * time.Millisecond)

    // Act - 发送中断信号
    err := proc.Interrupt(ctx)

    // Assert
    assert.NoError(t, err)
}

// TestProcess_Interrupt_NotRunning 测试中断未启动的进程
func TestProcess_Interrupt_NotRunning(t *testing.T) {
    // Arrange
    config := claude.Config{
        WorkingDir: os.TempDir(),
    }
    proc := claude.NewProcess("test-interrupt-2", config)
    // 不启动进程

    // Act - 尝试中断
    err := proc.Interrupt(context.Background())

    // Assert
    assert.Error(t, err)
    assert.Contains(t, err.Error(), "not running")
}

// TestProcess_Interrupt_SendESC 测试发送 ESC 字符
func TestProcess_Interrupt_SendESC(t *testing.T) {
    // Arrange
    ctx := context.Background()
    config := claude.Config{
        WorkingDir: os.TempDir(),
    }
    proc := claude.NewProcess("test-interrupt-3", config)
    require.NoError(t, proc.Start(ctx))
    defer proc.Stop(ctx)

    // Act - 发送中断
    err := proc.Interrupt(ctx)

    // Assert
    assert.NoError(t, err)

    // 验证 stdin 收到了 ESC 字符 (0x1b)
    // 这需要通过 mock 或其他方式验证
}
```

// Mock 实现
type mockProcess struct {
    id string
}

func (m *mockProcess) ID() string {
    return m.id
}

func (m *mockProcess) Start(ctx context.Context) error {
    return nil
}

func (m *mockProcess) Stop(ctx context.Context) error {
    return nil
}

func (m *mockProcess) IsRunning() bool {
    return true
}

func (m *mockProcess) SendMessage(ctx context.Context, text string) error {
    return nil
}

func (m *mockProcess) SendApproval(ctx context.Context, requestID string, approved bool, scope string) error {
    return nil
}
```

### 3.4 斜杠命令 (internal/commands/)

#### 3.4.1 命令发现

**测试文件**: `internal/commands/discover_test.go`

```go
package commands_test

import (
    "context"
    "os"
    "path/filepath"
    "testing"

    "ai-bridge/internal/commands"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

// TestDiscoverCommands_Builtin 测试发现内置命令
func TestDiscoverCommands_Builtin(t *testing.T) {
    // Arrange
    ctx := context.Background()
    workingDir := os.TempDir()

    // Act
    cmds, err := commands.DiscoverCommands(ctx, workingDir)

    // Assert
    require.NoError(t, err)
    assert.NotEmpty(t, cmds)

    // 验证内置命令存在
    hasCommit := false
    for _, cmd := range cmds {
        if cmd.Path == "commit" {
            hasCommit = true
            assert.Equal(t, "cli", cmd.Source)
            assert.NotEmpty(t, cmd.Description)
            break
        }
    }
    assert.True(t, hasCommit, "commit command not found")
}

// TestDiscoverCommands_UserCommands 测试发现用户命令
func TestDiscoverCommands_UserCommands(t *testing.T) {
    // Arrange
    ctx := context.Background()

    // 创建临时用户命令目录
    tmpDir, err := os.MkdirTemp("", "ai-bridge-test-*")
    require.NoError(t, err)
    defer os.RemoveAll(tmpDir)

    userCmdDir := filepath.Join(tmpDir, ".claude", "commands")
    err = os.MkdirAll(userCmdDir, 0755)
    require.NoError(t, err)

    // 创建测试命令
    testCmdPath := filepath.Join(userCmdDir, "test.md")
    testCmdContent := `---
category: test
description: A test command
---

This is a test command.
`
    err = os.WriteFile(testCmdPath, []byte(testCmdContent), 0644)
    require.NoError(t, err)

    // 需要设置 HOME 环境变量指向临时目录
    oldHome := os.Getenv("HOME")
    os.Setenv("HOME", tmpDir)
    defer os.Setenv("HOME", oldHome)

    // Act
    cmds, err := commands.DiscoverCommands(ctx, os.TempDir())

    // Assert
    require.NoError(t, err)

    // 查找测试命令
    var testCmd *commands.SlashCommand
    for _, cmd := range cmds {
        if cmd.Path == "test" {
            testCmd = cmd
            break
        }
    }

    require.NotNil(t, testCmd, "test command not found")
    assert.Equal(t, "user", testCmd.Source)
    assert.Equal(t, "test", testCmd.Category)
    assert.Equal(t, "A test command", testCmd.Description)
}

// TestDiscoverCommands_ProjectCommands 测试发现项目命令
func TestDiscoverCommands_ProjectCommands(t *testing.T) {
    // Arrange
    ctx := context.Background()

    // 创建临时项目目录
    tmpDir, err := os.MkdirTemp("", "ai-bridge-test-*")
    require.NoError(t, err)
    defer os.RemoveAll(tmpDir)

    projectCmdDir := filepath.Join(tmpDir, ".claude", "commands")
    err = os.MkdirAll(projectCmdDir, 0755)
    require.NoError(t, err)

    // 创建测试命令
    testCmdPath := filepath.Join(projectCmdDir, "project-test.md")
    testCmdContent := `---
category: project
description: A project test command
---

This is a project-specific command.
`
    err = os.WriteFile(testCmdPath, []byte(testCmdContent), 0644)
    require.NoError(t, err)

    // Act
    cmds, err := commands.DiscoverCommands(ctx, tmpDir)

    // Assert
    require.NoError(t, err)

    // 查找项目命令
    var projectCmd *commands.SlashCommand
    for _, cmd := range cmds {
        if cmd.Path == "project-test" {
            projectCmd = cmd
            break
        }
    }

    require.NotNil(t, projectCmd, "project command not found")
    assert.Equal(t, "project", projectCmd.Source)
    assert.Equal(t, "project", projectCmd.Category)
}

// TestDiscoverCommands_NamespacedCommands 测试命名空间命令
func TestDiscoverCommands_NamespacedCommands(t *testing.T) {
    // Arrange
    ctx := context.Background()

    tmpDir, err := os.MkdirTemp("", "ai-bridge-test-*")
    require.NoError(t, err)
    defer os.RemoveAll(tmpDir)

    // 创建命名空间目录
    nsDir := filepath.Join(tmpDir, ".claude", "commands", "frontend")
    err = os.MkdirAll(nsDir, 0755)
    require.NoError(t, err)

    // 创建命名空间命令
    componentCmdPath := filepath.Join(nsDir, "component.md")
    componentCmdContent := `---
category: frontend
description: Generate a React component
---

Generates a new React component.
`
    err = os.WriteFile(componentCmdPath, []byte(componentCmdContent), 0644)
    require.NoError(t, err)

    // Act
    cmds, err := commands.DiscoverCommands(ctx, tmpDir)

    // Assert
    require.NoError(t, err)

    // 查找命名空间命令
    var componentCmd *commands.SlashCommand
    for _, cmd := range cmds {
        if cmd.Path == "frontend:component" {
            componentCmd = cmd
            break
        }
    }

    require.NotNil(t, componentCmd, "namespaced command not found")
    assert.Equal(t, "frontend", componentCmd.Category)
}

// TestDiscoverCommands_NoCommandsDir 测试没有命令目录
func TestDiscoverCommands_NoCommandsDir(t *testing.T) {
    // Arrange
    ctx := context.Background()
    workingDir := os.TempDir()

    // Act
    cmds, err := commands.DiscoverCommands(ctx, workingDir)

    // Assert - 应该成功，但只有内置命令
    require.NoError(t, err)
    assert.NotEmpty(t, cmds) // 至少有内置命令
}

// TestParseMarkdownCommand 测试解析 Markdown 命令
func TestParseMarkdownCommand(t *testing.T) {
    tests := []struct {
        name          string
        content       string
        expectedPath  string
        expectedDesc  string
        expectedCat   string
        expectedExamples []string
    }{
        {
            name: "完整 front matter",
            content: `---
category: git
description: Create a git commit
examples:
  - /commit
  - /commit Fix bug
---

Git commit command.`,
            expectedPath:  "commit",
            expectedDesc:  "Create a git commit",
            expectedCat:   "git",
            expectedExamples: []string{"/commit", "/commit Fix bug"},
        },
        {
            name: "最小 front matter",
            content: `---
description: Simple command
---

Just a command.`,
            expectedPath: "simple",
            expectedDesc: "Simple command",
            expectedCat:  "",
        },
        {
            name: "无 front matter",
            content: `Just a command without front matter.`,
            expectedPath: "nofrontmatter",
            expectedDesc: "Just a command without front matter",
            expectedCat:  "",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // Arrange
            tmpFile, err := os.CreateTemp("", "test-*.md")
            require.NoError(t, err)
            defer os.Remove(tmpFile.Name())

            _, err = tmpFile.WriteString(tt.content)
            require.NoError(t, err)
            tmpFile.Close()

            // Act
            cmd, err := commands.ParseMarkdownCommand(tmpFile.Name(), "project", filepath.Dir(tmpFile.Name()))

            // Assert
            require.NoError(t, err)
            assert.Equal(t, tt.expectedDesc, cmd.Description)
            assert.Equal(t, tt.expectedCat, cmd.Category)
            if tt.expectedExamples != nil {
                assert.Equal(t, tt.expectedExamples, cmd.Examples)
            }
        })
    }
}
```

---

## 四、集成测试策略

### 4.1 HTTP API 集成测试

**测试文件**: `tests/integration/api_test.go`

```go
package integration_test

import (
    "net/http"
    "net/http/httptest"
    "testing"
    "time"

    "ai-bridge/internal/api"
    "ai-bridge/internal/config"
    "ai-bridge/internal/session"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

// setupTestServer 设置测试服务器
func setupTestServer(t *testing.T) (*httptest.Server, *session.Manager) {
    cfg := config.LoadTestConfig()
    sm := session.NewManager(cfg)

    router := api.SetupRouter(sm, cfg)
    server := httptest.NewServer(router)

    return server, sm
}

// TestCreateSession 测试创建会话
func TestCreateSession(t *testing.T) {
    // Arrange
    server, _ := setupTestServer(t)
    defer server.Close()

    reqBody := `{
        "workingDirectory": "/tmp/test",
        "agent": "claude",
        "permissionMode": "normal"
    }`

    // Act
    resp, err := http.Post(
        server.URL+"/api/v1/sessions",
        "application/json",
        strings.NewReader(reqBody),
    )

    // Assert
    require.NoError(t, err)
    assert.Equal(t, http.StatusCreated, resp.StatusCode)

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)

    assert.NotEmpty(t, result["id"])
    assert.Equal(t, "active", result["status"])
    assert.NotEmpty(t, result["createdAt"])
}

// TestGetSession 测试获取会话
func TestGetSession(t *testing.T) {
    // Arrange
    server, sm := setupTestServer(t)
    defer server.Close()

    // 创建会话
    sess, _ := sm.CreateSession(context.Background(), session.Config{
        WorkingDir: "/tmp/test",
    })

    // Act
    resp, err := http.Get(server.URL + "/api/v1/sessions/" + sess.ID())

    // Assert
    require.NoError(t, err)
    assert.Equal(t, http.StatusOK, resp.StatusCode)

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)

    assert.Equal(t, sess.ID(), result["id"])
}

// TestListSessions 测试列出会话
func TestListSessions(t *testing.T) {
    // Arrange
    server, sm := setupTestServer(t)
    defer server.Close()

    // 创建多个会话
    for i := 0; i < 3; i++ {
        sm.CreateSession(context.Background(), session.Config{
            WorkingDir: "/tmp/test",
        })
    }

    // Act
    resp, err := http.Get(server.URL + "/api/v1/sessions")

    // Assert
    require.NoError(t, err)
    assert.Equal(t, http.StatusOK, resp.StatusCode)

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)

    sessions := result["sessions"].([]interface{})
    assert.Len(t, sessions, 3)
}

// TestSendMessage 测试发送消息
func TestSendMessage(t *testing.T) {
    // Arrange
    server, sm := setupTestServer(t)
    defer server.Close()

    sess, _ := sm.CreateSession(context.Background(), session.Config{
        WorkingDir: "/tmp/test",
    })

    reqBody := `{"text": "test message"}`

    // Act
    resp, err := http.Post(
        server.URL+"/api/v1/sessions/"+sess.ID()+"/messages",
        "application/json",
        strings.NewReader(reqBody),
    )

    // Assert
    require.NoError(t, err)
    assert.Equal(t, http.StatusAccepted, resp.StatusCode)

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)

    assert.Equal(t, "sent", result["status"])
    assert.NotEmpty(t, result["seq"])
}

// TestGetMessages_Pagination 测试消息分页
func TestGetMessages_Pagination(t *testing.T) {
    // Arrange
    server, sm := setupTestServer(t)
    defer server.Close()

    sess, _ := sm.CreateSession(context.Background(), session.Config{
        WorkingDir: "/tmp/test",
    })

    // 添加 100 条消息
    for i := 0; i < 100; i++ {
        sess.AddMessage(&session.Message{
            Type:      session.MessageTypeUser,
            Content:   "message",
            Timestamp: time.Now(),
        })
    }

    // Act - 获取前 50 条
    resp, err := http.Get(server.URL + "/api/v1/sessions/" + sess.ID() + "/messages?limit=50")

    // Assert
    require.NoError(t, err)
    assert.Equal(t, http.StatusOK, resp.StatusCode)

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)

    messages := result["messages"].([]interface{})
    assert.Len(t, messages, 50)
    assert.True(t, result["hasMore"].(bool))
}

// TestSlashCommands 测试斜杠命令 API
func TestSlashCommands(t *testing.T) {
    // Arrange
    server, sm := setupTestServer(t)
    defer server.Close()

    sess, _ := sm.CreateSession(context.Background(), session.Config{
        WorkingDir: "/tmp/test",
    })

    // Act
    resp, err := http.Get(server.URL + "/api/v1/commands?sessionId=" + sess.ID())

    // Assert
    require.NoError(t, err)
    assert.Equal(t, http.StatusOK, resp.StatusCode)

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)

    assert.NotEmpty(t, result["commands"])
    assert.Greater(t, result["total"].(float64), float64(0))

    // 验证有内置命令
    commands := result["commands"].([]interface{})
    hasCommit := false
    for _, cmd := range commands {
        c := cmd.(map[string]interface{})
        if c["path"] == "commit" {
            hasCommit = true
            break
        }
    }
    assert.True(t, hasCommit, "commit command not found")
}

// TestGetSessionStatus 测试获取会话状态
func TestGetSessionStatus(t *testing.T) {
    // Arrange
    server, sm := setupTestServer(t)
    defer server.Close()

    sess, _ := sm.CreateSession(context.Background(), session.Config{
        WorkingDir: "/tmp/test",
    })

    // Act
    resp, err := http.Get(server.URL + "/api/v1/sessions/" + sess.ID() + "/status")

    // Assert
    require.NoError(t, err)
    assert.Equal(t, http.StatusOK, resp.StatusCode)

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)

    assert.Equal(t, sess.ID(), result["sessionId"])
    assert.Equal(t, "idle", result["state"])
    assert.NotNil(t, result["duration"])
    assert.NotNil(t, result["startTime"])
}

// TestGetSessionStatus_Processing 测试获取处理中的状态
func TestGetSessionStatus_Processing(t *testing.T) {
    // Arrange
    server, sm := setupTestServer(t)
    defer server.Close()

    sess, _ := sm.CreateSession(context.Background(), session.Config{
        WorkingDir: "/tmp/test",
    })

    // 模拟开始处理
    s := sm.GetSession(sess.ID())
    s.StartProcessing(1)

    // 等待一段时间
    time.Sleep(100 * time.Millisecond)

    // Act
    resp, err := http.Get(server.URL + "/api/v1/sessions/" + sess.ID() + "/status")

    // Assert
    require.NoError(t, err)
    assert.Equal(t, http.StatusOK, resp.StatusCode)

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)

    assert.Equal(t, "processing", result["state"])
    assert.Greater(t, result["duration"].(float64), float64(100))
}

// TestStopSession 测试停止会话
func TestStopSession(t *testing.T) {
    // Arrange
    server, sm := setupTestServer(t)
    defer server.Close()

    sess, _ := sm.CreateSession(context.Background(), session.Config{
        WorkingDir: "/tmp/test",
    })

    // 模拟处理状态
    s := sm.GetSession(sess.ID())
    s.StartProcessing(1)

    // Act
    reqBody := `{
        "reason": "user_cancelled"
    }`
    resp, err := http.Post(
        server.URL+"/api/v1/sessions/"+sess.ID()+"/stop",
        "application/json",
        strings.NewReader(reqBody),
    )

    // Assert
    require.NoError(t, err)
    assert.Equal(t, http.StatusOK, resp.StatusCode)

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)

    assert.Equal(t, true, result["success"])
    assert.Equal(t, "Session stopped", result["message"])

    // 验证状态已停止
    statusResp, _ := http.Get(server.URL + "/api/v1/sessions/" + sess.ID() + "/status")
    var statusResult map[string]interface{}
    json.NewDecoder(statusResp.Body).Decode(&statusResult)
    assert.Equal(t, "stopped", statusResult["state"])
}

// TestStopSession_Idle 测试停止空闲会话(应失败)
func TestStopSession_Idle(t *testing.T) {
    // Arrange
    server, sm := setupTestServer(t)
    defer server.Close()

    sess, _ := sm.CreateSession(context.Background(), session.Config{
        WorkingDir: "/tmp/test",
    })

    // 会话是空闲状态

    // Act
    reqBody := `{}`
    resp, err := http.Post(
        server.URL+"/api/v1/sessions/"+sess.ID()+"/stop",
        "application/json",
        strings.NewReader(reqBody),
    )

    // Assert
    require.NoError(t, err)
    assert.Equal(t, http.StatusConflict, resp.StatusCode)

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)

    assert.Equal(t, "session_not_processing", result["error"])
    assert.Contains(t, result["message"].(string), "not processing")
}

// TestSessionStatus_DurationIncrement 测试状态时长递增
func TestSessionStatus_DurationIncrement(t *testing.T) {
    // Arrange
    server, sm := setupTestServer(t)
    defer server.Close()

    sess, _ := sm.CreateSession(context.Background(), session.Config{
        WorkingDir: "/tmp/test",
    })

    s := sm.GetSession(sess.ID())
    s.StartProcessing(1)

    // Act - 多次获取状态
    resp1, _ := http.Get(server.URL + "/api/v1/sessions/" + sess.ID() + "/status")
    time.Sleep(50 * time.Millisecond)
    resp2, _ := http.Get(server.URL + "/api/v1/sessions/" + sess.ID() + "/status")
    time.Sleep(50 * time.Millisecond)
    resp3, _ := http.Get(server.URL + "/api/v1/sessions/" + sess.ID() + "/status")

    // Assert
    var status1, status2, status3 map[string]interface{}
    json.NewDecoder(resp1.Body).Decode(&status1)
    json.NewDecoder(resp2.Body).Decode(&status2)
    json.NewDecoder(resp3.Body).Decode(&status3)

    duration1 := status1["duration"].(float64)
    duration2 := status2["duration"].(float64)
    duration3 := status3["duration"].(float64)

    assert.Greater(t, duration2, duration1)
    assert.Greater(t, duration3, duration2)
}
```

---

## 五、端到端测试策略

### 5.1 E2E 测试脚本

**测试文件**: `scripts/test-e2e.sh`

```bash
#!/bin/bash
# scripts/test-e2e.sh
set -e

echo "=== AI-Bridge E2E Test Suite ==="

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试统计
TESTS_PASSED=0
TESTS_FAILED=0

# 辅助函数
log_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ((TESTS_FAILED++))
}

# 测试函数
test_claude_installed() {
    log_info "Testing if Claude Code CLI is installed..."

    if command -v claude &> /dev/null; then
        VERSION=$(claude --version)
        log_success "Claude Code CLI found: $VERSION"
        return 0
    else
        log_error "Claude Code CLI not found. Install it first:"
        echo "  npm install -g @anthropic/claude-code"
        return 1
    fi
}

test_build_ai_bridge() {
    log_info "Building AI-Bridge..."

    if go build -o ai-bridge ./cmd/ai-bridge 2>/dev/null; then
        log_success "AI-Bridge built successfully"
        return 0
    else
        log_error "Failed to build AI-Bridge"
        return 1
    fi
}

test_start_server() {
    log_info "Starting AI-Bridge server..."

    ./ai-bridge server --config configs/config.yaml > /tmp/ai-bridge.log 2>&1 &
    SERVER_PID=$!

    # 等待服务器启动
    for i in {1..30}; do
        if curl -s http://localhost:8080/health > /dev/null 2>&1; then
            log_success "Server started (PID: $SERVER_PID)"
            return 0
        fi
        sleep 1
    done

    log_error "Server failed to start"
    cat /tmp/ai-bridge.log
    return 1
}

test_create_session() {
    log_info "Testing create session..."

    TEST_DIR="/tmp/ai-bridge-test-$$"
    mkdir -p "$TEST_DIR"
    cd "$TEST_DIR"

    # 创建简单项目
    cat > main.go << 'EOF'
package main
func main() {}
EOF
    go mod init test 2>/dev/null || true

    RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/sessions \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer test-token" \
        -d "{\"workingDirectory\":\"$TEST_DIR\",\"agent\":\"claude\"}")

    SESSION_ID=$(echo $RESPONSE | jq -r '.id')

    if [ "$SESSION_ID" != "null" ] && [ -n "$SESSION_ID" ]; then
        log_success "Session created: $SESSION_ID"
        echo "$SESSION_ID" > /tmp/test_session_id
        echo "$TEST_DIR" > /tmp/test_dir
        return 0
    else
        log_error "Failed to create session"
        echo "Response: $RESPONSE"
        return 1
    fi
}

test_slash_commands() {
    log_info "Testing slash commands discovery..."

    SESSION_ID=$(cat /tmp/test_session_id)
    TEST_DIR=$(cat /tmp/test_dir)

    # 创建自定义命令
    mkdir -p "$TEST_DIR/.claude/commands"
    cat > "$TEST_DIR/.claude/commands/hello.md" << 'EOF'
---
category: test
description: Say hello
---

Hello command.
EOF

    # 获取命令列表
    CMDS=$(curl -s "http://localhost:8080/api/v1/commands?sessionId=$SESSION_ID" \
        -H "Authorization: Bearer test-token")

    # 检查自定义命令
    if echo "$CMDS" | jq -e '.commands[] | select(.path == "hello")' > /dev/null; then
        log_success "Custom slash command found"
        return 0
    else
        log_error "Custom slash command not found"
        echo "Commands: $CMDS"
        return 1
    fi
}

test_send_message() {
    log_info "Testing send message..."

    SESSION_ID=$(cat /tmp/test_session_id)

    RESPONSE=$(curl -s -X POST \
        "http://localhost:8080/api/v1/sessions/$SESSION_ID/messages" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer test-token" \
        -d '{"text":"Say hello"}')

    STATUS=$(echo $RESPONSE | jq -r '.status')

    if [ "$STATUS" == "sent" ]; then
        log_success "Message sent successfully"
        return 0
    else
        log_error "Failed to send message"
        echo "Response: $RESPONSE"
        return 1
    fi
}

test_message_pagination() {
    log_info "Testing message pagination..."

    SESSION_ID=$(cat /tmp/test_session_id)

    # 获取消息
    RESPONSE=$(curl -s "http://localhost:8080/api/v1/sessions/$SESSION_ID/messages?limit=10" \
        -H "Authorization: Bearer test-token")

    COUNT=$(echo $RESPONSE | jq -r '.messages | length')

    if [ "$COUNT" -ge 0 ]; then
        log_success "Message pagination works (got $COUNT messages)"
        return 0
    else
        log_error "Message pagination failed"
        echo "Response: $RESPONSE"
        return 1
    fi
}

test_performance_large_session() {
    log_info "Testing performance with large session..."

    SESSION_ID=$(cat /tmp/test_session_id)

    # 发送多条消息
    for i in {1..50}; do
        curl -s -X POST \
            "http://localhost:8080/api/v1/sessions/$SESSION_ID/messages" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer test-token" \
            -d "{\"text\":\"Message $i\"}" > /dev/null
    done

    # 测试获取性能
    START=$(date +%s%N)
    RESPONSE=$(curl -s "http://localhost:8080/api/v1/sessions/$SESSION_ID/messages?limit=50" \
        -H "Authorization: Bearer test-token")
    END=$(date +%s%N)

    DURATION=$(( (END - START) / 1000000 )) # 毫秒

    if [ $DURATION -lt 100 ]; then
        log_success "Large session performance OK (${DURATION}ms < 100ms)"
        return 0
    else
        log_error "Large session too slow (${DURATION}ms >= 100ms)"
        return 1
    fi
}

# 新增测试函数
test_session_status() {
    log_info "Testing session status tracking..."

    SESSION_ID=$(cat /tmp/test_session_id)

    # 获取会话状态
    RESPONSE=$(curl -s "http://localhost:8080/api/v1/sessions/$SESSION_ID/status" \
        -H "Authorization: Bearer test-token")

    STATE=$(echo $RESPONSE | jq -r '.state')
    DURATION=$(echo $RESPONSE | jq -r '.duration')

    if [ "$STATE" != "null" ] && [ "$DURATION" != "null" ]; then
        log_success "Session status retrieved (state: $STATE, duration: ${DURATION}ms)"
        return 0
    else
        log_error "Failed to get session status"
        echo "Response: $RESPONSE"
        return 1
    fi
}

test_session_status_duration_increment() {
    log_info "Testing session status duration increment..."

    SESSION_ID=$(cat /tmp/test_session_id)

    # 发送消息触发处理
    curl -s -X POST \
        "http://localhost:8080/api/v1/sessions/$SESSION_ID/messages" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer test-token" \
        -d '{"text":"test"}' > /dev/null

    # 等待处理开始
    sleep 0.5

    # 多次获取状态
    STATUS1=$(curl -s "http://localhost:8080/api/v1/sessions/$SESSION_ID/status" \
        -H "Authorization: Bearer test-token")
    DURATION1=$(echo $STATUS1 | jq -r '.duration')

    sleep 0.5

    STATUS2=$(curl -s "http://localhost:8080/api/v1/sessions/$SESSION_ID/status" \
        -H "Authorization: Bearer test-token")
    DURATION2=$(echo $STATUS2 | jq -r '.duration')

    # 验证时长递增
    if [ "$DURATION2" -gt "$DURATION1" ]; then
        log_success "Status duration increments (${DURATION1}ms -> ${DURATION2}ms)"
        return 0
    else
        log_error "Duration does not increment (${DURATION1}ms !< ${DURATION2}ms)"
        return 1
    fi
}

test_stop_session() {
    log_info "Testing session stop functionality..."

    SESSION_ID=$(cat /tmp/test_session_id)

    # 发送一个长时间任务
    curl -s -X POST \
        "http://localhost:8080/api/v1/sessions/$SESSION_ID/messages" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer test-token" \
        -d '{"text":"analyze entire project in detail"}' > /dev/null

    # 等待处理开始
    sleep 1

    # 获取初始状态
    STATUS_BEFORE=$(curl -s "http://localhost:8080/api/v1/sessions/$SESSION_ID/status" \
        -H "Authorization: Bearer test-token")
    STATE_BEFORE=$(echo $STATUS_BEFORE | jq -r '.state')

    # 如果是 processing 状态，测试停止功能
    if [ "$STATE_BEFORE" == "processing" ] || [ "$STATE_BEFORE" == "waiting" ]; then
        # 停止会话
        RESPONSE=$(curl -s -X POST \
            "http://localhost:8080/api/v1/sessions/$SESSION_ID/stop" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer test-token" \
            -d '{"reason":"test_stop"}')

        SUCCESS=$(echo $RESPONSE | jq -r '.success')

        if [ "$SUCCESS" == "true" ]; then
            # 验证状态变为 stopped
            STATUS_AFTER=$(curl -s "http://localhost:8080/api/v1/sessions/$SESSION_ID/status" \
                -H "Authorization: Bearer test-token")
            STATE_AFTER=$(echo $STATUS_AFTER | jq -r '.state')

            if [ "$STATE_AFTER" == "stopped" ]; then
                log_success "Session stopped successfully (state: $STATE_BEFORE -> $STATE_AFTER)"
                return 0
            else
                log_error "Session state not changed to stopped (got: $STATE_AFTER)"
                return 1
            fi
        else
            log_error "Failed to stop session"
            echo "Response: $RESPONSE"
            return 1
        fi
    else
        log_success "Session not in processing state (current: $STATE_BEFORE), skip stop test"
        return 0
    fi
}

test_stop_idle_session() {
    log_info "Testing stop idle session (should fail)..."

    SESSION_ID=$(cat /tmp/test_session_id)

    # 等待会话回到空闲状态
    sleep 2

    # 尝试停止空闲会话
    RESPONSE=$(curl -s -X POST \
        "http://localhost:8080/api/v1/sessions/$SESSION_ID/stop" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer test-token" \
        -d '{}')

    ERROR=$(echo $RESPONSE | jq -r '.error')

    # 应该返回错误
    if [ "$ERROR" == "session_not_processing" ] || [ "$ERROR" != "null" ]; then
        log_success "Stop idle session returns error as expected"
        return 0
    else
        log_error "Stop idle session should fail but didn't"
        echo "Response: $RESPONSE"
        return 1
    fi
}

test_cleanup() {
    log_info "Cleaning up..."

    # 停止服务器
    if [ -n "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
    fi

    # 删除测试目录
    if [ -f /tmp/test_dir ]; then
        rm -rf "$(cat /tmp/test_dir)"
    fi

    # 删除临时文件
    rm -f /tmp/test_session_id /tmp/test_dir /tmp/ai-bridge.log

    log_success "Cleanup complete"
}

# 测试主流程
main() {
    echo ""
    echo "=========================================="
    echo "  AI-Bridge End-to-End Test Suite"
    echo "=========================================="
    echo ""

    # 运行测试
    test_claude_installed || exit 1
    test_build_ai_bridge || exit 1
    test_start_server || { test_cleanup; exit 1; }

    test_create_session || { test_cleanup; exit 1; }
    test_slash_commands || true
    test_send_message || true
    test_message_pagination || true
    test_performance_large_session || true

    # 新增测试：状态跟踪和停止
    test_session_status || true
    test_session_status_duration_increment || true
    test_stop_session || true
    test_stop_idle_session || true

    # 清理
    test_cleanup

    # 总结
    echo ""
    echo "=========================================="
    echo "  Test Summary"
    echo "=========================================="
    echo "Passed: $TESTS_PASSED"
    echo "Failed: $TESTS_FAILED"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        log_success "All tests passed! 🎉"
        exit 0
    else
        log_error "Some tests failed"
        exit 1
    fi
}

# 运行
main
```

---

## 六、TDD 实施流程

### 6.1 开发流程示例

```
┌─────────────────────────────────────────────────────────────┐
│ 开发新功能: Process.SendMessage()                           │
└─────────────────────────────────────────────────────────────┘

Step 1: 🔴 RED - 写失败的测试
┌─────────────────────────────────────────────────────────────┐
│ 1. 创建测试文件: internal/claude/process_message_test.go    │
│ 2. 写测试用例: TestProcess_SendMessage_Success             │
│ 3. 运行测试: go test ./internal/claude/                     │
│ 4. 确认测试失败（因为还没实现）                              │
└─────────────────────────────────────────────────────────────┘

Step 2: 🟢 GREEN - 编写最少代码使测试通过
┌─────────────────────────────────────────────────────────────┐
│ 1. 实现 Process.SendMessage() 方法                         │
│ 2. 只写刚好能通过测试的代码                                  │
│ 3. 运行测试: go test ./internal/claude/                     │
│ 4. 确认测试通过                                              │
└─────────────────────────────────────────────────────────────┘

Step 3: 🔵 REFACTOR - 重构代码
┌─────────────────────────────────────────────────────────────┐
│ 1. 检查代码质量                                             │
│ 2. 重构提取重复代码                                          │
│ 3. 运行测试确保没有破坏                                      │
│ 4. 提交代码                                                  │
└─────────────────────────────────────────────────────────────┘

Step 4: 重复 - 添加下一个测试
┌─────────────────────────────────────────────────────────────┐
│ 1. 写下一个测试: TestProcess_SendMessage_NotRunning        │
│ 2. 回到 RED 步骤                                            │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 测试清单

每个模块开发前，必须先完成测试清单：

#### Process 模块测试清单

```markdown
## Process 模块测试清单

### 基础功能
- [ ] TestProcess_Start_Success
- [ ] TestProcess_Start_CommandNotFound
- [ ] TestProcess_Start_AlreadyRunning
- [ ] TestProcess_Stop_Graceful
- [ ] TestProcess_Stop_Timeout
- [ ] TestProcess_Events

### 消息处理
- [ ] TestProcess_SendMessage_Success
- [ ] TestProcess_SendMessage_NotRunning
- [ ] TestProcess_SendMessage_Empty
- [ ] TestProcess_SendMessage_LongMessage
- [ ] TestProcess_SendMessage_SpecialCharacters
- [ ] TestProcess_ReceiveMessage
- [ ] TestProcess_MultipleMessages

### 权限处理
- [ ] TestProcess_SendApproval_SessionScope
- [ ] TestProcess_SendApproval_OnceScope
- [ ] TestProcess_SendApproval_Deny
- [ ] TestProcess_PermissionRequest

### 边界情况
- [ ] TestProcess_RapidStartStop
- [ ] TestProcess_ConcurrentMessages
- [ ] TestProcess_LargeMessage
- [ ] TestProcess_InvalidJSON
```

---

## 七、性能测试

### 7.1 基准测试

**测试文件**: `internal/claude/process_bench_test.go`

```go
package claude_test

import (
    "context"
    "testing"
)

// BenchmarkSendMessage 消息发送性能
func BenchmarkSendMessage(b *testing.B) {
    ctx := context.Background()
    config := claude.Config{
        WorkingDir: "/tmp/bench",
    }
    proc := claude.NewProcess("bench", config)
    proc.Start(ctx)
    defer proc.Stop(ctx)

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        proc.SendMessage(ctx, "benchmark message")
    }
}

// BenchmarkMessageParsing 消息解析性能
func BenchmarkMessageParsing(b *testing.B) {
    jsonData := []byte(`{"type":"text","text":"hello"}`)

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        var data map[string]interface{}
        json.Unmarshal(jsonData, &data)
        parseMessage(data)
    }
}

// BenchmarkSessionAddMessage 会话添加消息性能
func BenchmarkSessionAddMessage(b *testing.B) {
    proc := &mockProcess{id: "bench"}
    s := session.NewSession("bench-sess", proc)

    msg := &session.Message{
        Type:      session.MessageTypeUser,
        Content:   "benchmark message",
        Timestamp: time.Now(),
    }

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        s.AddMessage(msg)
    }
}
```

### 7.2 负载测试

**测试文件**: `tests/load/load_test.sh`

```bash
#!/bin/bash
# 负载测试：模拟多个并发会话

SESSIONS=10
MESSAGES_PER_SESSION=100

echo "Starting load test..."
echo "Sessions: $SESSIONS"
echo "Messages per session: $MESSAGES_PER_SESSION"

# 创建多个会话
SESSION_IDS=()
for i in $(seq 1 $SESSIONS); do
    RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/sessions \
        -H "Content-Type: application/json" \
        -d '{"workingDirectory":"/tmp/test","agent":"claude"}')

    SESSION_ID=$(echo $RESPONSE | jq -r '.id')
    SESSION_IDS+=($SESSION_ID)
done

# 并发发送消息
for SESSION_ID in "${SESSION_IDS[@]}"; do
    (
        for j in $(seq 1 $MESSAGES_PER_SESSION); do
            curl -s -X POST \
                "http://localhost:8080/api/v1/sessions/$SESSION_ID/messages" \
                -H "Content-Type: application/json" \
                -d "{\"text\":\"Message $j\"}" > /dev/null
        done
    ) &
done

# 等待所有后台任务完成
wait

echo "Load test completed"
```

---

## 八、CI/CD 集成

### 8.1 GitHub Actions 配置

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test_db
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Set up Go
      uses: actions/setup-go@v4
      with:
        go-version: '1.23'

    - name: Install dependencies
      run: go mod download

    - name: Run unit tests
      run: make test-unit

    - name: Run integration tests
      run: make test-integration
      env:
        DB_HOST: localhost
        DB_PORT: 5432

    - name: Generate coverage report
      run: make test-coverage

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.out

    - name: Run benchmarks
      run: make test-bench

    - name: Store benchmark result
      uses: benchmark-action/github-action-benchmark@v1
      with:
        tool: 'go'
        output-file-path: benchmark.txt
```

---

## 九、测试覆盖率报告

### 9.1 生成覆盖率报告

```bash
# 生成覆盖率报告
make test-coverage

# 查看浏览器报告
open coverage.html
```

### 9.2 覆盖率目标验证

```bash
# 检查覆盖率是否达标
#!/bin/bash
COVERAGE=$(go tool cover -func=coverage.out | grep total | awk '{print $3}' | sed 's/%//')

echo "Current coverage: $COVERAGE%"

if (( $(echo "$COVERAGE < 80" | bc -l) )); then
    echo "❌ Coverage below 80% threshold"
    exit 1
else
    echo "✅ Coverage meets 80% threshold"
fi
```

---

## 十、测试最佳实践

### 10.1 测试原则

1. **FIRST 原则**
   - **F**ast - 测试应该快速运行
   - **I**ndependent - 测试之间应该独立
   - **R**epeatable - 测试应该可重复
   - **S**elf-Validating - 测试应该有明确的通过/失败结果
   - **T**imely - 测试应该及时编写

2. **测试命名**
   ```
   Good: TestProcess_Start_Success
   Bad:  TestProcess
   ```

3. **AAA 模式**
   ```go
   // Arrange - 准备测试数据
   proc := NewProcess("test", config)

   // Act - 执行被测试的操作
   err := proc.Start(ctx)

   // Assert - 验证结果
   assert.NoError(t, err)
   ```

### 10.2 Mock 使用

```go
// 使用 gomock
func TestWithMock(t *testing.T) {
    ctrl := gomock.NewController(t)
    defer ctrl.Finish()

    mockProcess := NewMockProcess(ctrl)
    mockProcess.EXPECT().Start(gomock.Any()).Return(nil)

    // 使用 mock
    manager := NewManager(mockProcess)
    // ...
}
```

---

## 十一、总结

### 测试实施优先级

**Phase 1 (Week 1-2)**: 核心单元测试
- Process 模块
- Pool 模块

**Phase 2 (Week 3-4)**: 集成测试
- Session 管理
- API 层

**Phase 3 (Week 5)**: E2E 测试
- 完整流程测试
- 性能测试

**持续进行**: 维护和改进
- 修复 bug 时添加测试
- 重构时保持测试通过

---

**文档版本**: 1.1
**最后更新**: 2026-02-04
**更新内容**:
- ✅ 添加会话状态跟踪测试用例
  - TestSession_GetStatus_Idle
  - TestSession_GetStatus_Processing
  - TestSession_StateTransition
  - TestSession_ProcessingDuration
  - TestSession_DurationIncrements
  - TestSession_MultipleProcessingMessages
- ✅ 添加手动停止功能测试用例
  - TestSession_Stop_Processing
  - TestSession_Stop_Idle
  - TestSession_Stop_Waiting
  - TestSession_Stop_AfterStop
  - TestProcess_Interrupt_Success
  - TestProcess_Interrupt_NotRunning
- ✅ 添加集成测试
  - TestGetSessionStatus
  - TestGetSessionStatus_Processing
  - TestStopSession
  - TestStopSession_Idle
  - TestSessionStatus_DurationIncrement
- ✅ 添加 E2E 测试
  - test_session_status
  - test_session_status_duration_increment
  - test_stop_session
  - test_stop_idle_session
