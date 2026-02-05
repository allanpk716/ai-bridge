# 测试模式

**分析日期:** 2026-02-05

## 测试框架

### 测试运行器
- **框架**: Go 内置 `testing` 包
- **Assertion 库**: `testify/assert` 和 `testify/require`
- **Mock 框架**: `testify/mock` (通过依赖注入)

### 配置文件
- 通过 Makefile 管理测试命令
- 没有独立的配置文件，使用命令行标志

### 运行命令
```bash
# 运行所有测试（覆盖率 + race 检测）
make test-all
# 或
go test -v -race -coverprofile=coverage.out ./...

# 仅运行单元测试
make test-unit
# 或
go test -v -short ./internal/...

# 运行集成测试
make test-integration
# 或
go test -v -tags=integration ./tests/integration/

# 运行 E2E 测试
make test-e2e
# 或
.\scripts\test-e2e.bat

# 生成覆盖率报告
make test-coverage
# 或
go tool cover -html=coverage.out -o coverage.html
```

## 测试文件组织

### 目录结构
```
ai-bridge/
├── internal/
│   ├── claude/           # 单元测试
│   │   └── process_test.go
│   ├── session/          # 单元测试
│   │   ├── session_test.go
│   │   └── store_test.go
│   ├── commands/         # 单元测试
│   │   └── discover_test.go
│   └── pool/            # 单元测试
│       └── pool_test.go
├── pkg/
│   └── protocol/        # 单元测试
│       └── types_test.go
└── tests/
    └── integration/    # 集成测试
        └── api_test.go
```

### 测试类型分布
- **单元测试 (60%)**: 位于各个 internal 包中
- **集成测试 (30%)**: 位于 `tests/integration/`
- **E2E 测试 (10%)**: 位于 `scripts/test-e2e.bat`

## 测试结构

### 单元测试模式
```go
package claude

import (
    "context"
    "testing"
    "time"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestNewProcess(t *testing.T) {
    // 1. 准备测试数据
    config := Config{
        WorkingDir:     "/tmp",
        Model:          "haiku",
        PermissionMode: "normal",
    }

    // 2. 执行测试
    proc := NewProcess("test-id", config)

    // 3. 断言结果
    require.NotNil(t, proc)
    assert.Equal(t, "test-id", proc.ID())
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

    // 启动进程
    err := proc.Start(ctx)
    if err != nil {
        t.Skip("Claude CLI not available:", err)
    }

    // 验证状态
    assert.True(t, proc.IsRunning())

    // 停止进程
    err = proc.Stop(ctx)
    require.NoError(t, err)

    assert.False(t, proc.IsRunning())
}
```

### 集成测试模式
```go
// +build integration

package integration

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
    "github.com/your-org/ai-bridge/internal/api"
    "github.com/your-org/ai-bridge/internal/config"
    "github.com/your-org/ai-bridge/internal/health"
    "github.com/your-org/ai-bridge/internal/pool"
    "github.com/your-org/ai-bridge/internal/session"
)

func TestCreateSession(t *testing.T) {
    // 1. 准备测试配置
    cfg := &config.Config{
        Server: config.ServerConfig{
            Host: "localhost",
            Port: 8080,
        },
        Database: config.DatabaseConfig{
            Path: ":memory:",
        },
        Pool: config.PoolConfig{
            MaxInstances: 1,
        },
        Logging: config.LoggingConfig{
            Level: "error",
        },
    }

    // 2. 初始化测试组件
    processPool := pool.NewPool(cfg.Pool, cfg.Claude)
    sessionManager, err := session.NewManager(cfg.Session, processPool)
    require.NoError(t, err)
    defer sessionManager.Shutdown(nil)

    healthChecker := health.NewChecker(cfg.Health, processPool, sessionManager)
    server := api.NewServer(cfg, sessionManager, processPool, healthChecker)

    // 3. 执行测试
    body := map[string]string{
        "workingDirectory": "/tmp",
        "model":            "haiku",
    }
    jsonData, _ := json.Marshal(body)

    req := httptest.NewRequest("POST", "/api/v1/sessions", bytes.NewReader(jsonData))
    req.Header.Set("Content-Type", "application/json")
    w := httptest.NewRecorder()

    server.Router().ServeHTTP(w, req)

    // 4. 验证结果
    if w.Code != http.StatusCreated {
        t.Skipf("Session creation failed (Claude CLI may not be available): %d", w.Code)
    }

    var resp map[string]interface{}
    err = json.Unmarshal(w.Body.Bytes(), &resp)
    require.NoError(t, err)

    _, ok := resp["id"]
    assert.True(t, ok, "Response should contain id")
}
```

## 模拟和存根

### Mock 框架
- 使用 `testify/mock` 进行接口模拟
- 通过依赖注入实现可测试性

### 模拟模式
```go
// 1. 定义接口
type SessionManager interface {
    CreateSession(opts CreateOptions) (*Session, error)
    GetSession(id string) (*Session, error)
}

// 2. 创建 Mock
type MockSessionManager struct {
    mock.Mock
}

func (m *MockSessionManager) CreateSession(opts CreateOptions) (*Session, error) {
    args := m.Called(opts)
    return args.Get(0).(*Session), args.Error(1)
}

func (m *MockSessionManager) GetSession(id string) (*Session, error) {
    args := m.Called(id)
    return args.Get(0).(*Session), args.Error(1)
}

// 3. 在测试中使用
func TestApiHandler_CreateSession(t *testing.T) {
    mockManager := new(MockSessionManager)
    handler := NewSessionHandler(mockManager)

    // 设置 Mock 行为
    mockManager.On("CreateSession", mock.Anything).Return(&Session{}, nil)

    // 执行测试
    req, _ := http.NewRequest("POST", "/sessions", nil)
    w := httptest.NewRecorder()

    handler.CreateSession(w, req)

    // 验证 Mock 被调用
    mockManager.AssertExpectations(t)
}
```

### 存根模式
```go
func TestProcess_HandleMessage(t *testing.T) {
    // 创建测试用的 Process
    proc := NewProcess("test", Config{})

    // 创建消息通道
    msgChan := make(chan protocol.Message, 1)
    proc.messageChan = msgChan

    // 创建错误通道
    errorChan := make(chan error, 1)
    proc.errorChan = errorChan

    // 启动消息处理
    go proc.readOutputLoop()

    // 发送测试消息
    testMsg := `{"type": "assistant", "content": "Hello"}`
    go func() {
        msgChan <- protocol.Message{
            Type:     MessageTypeAssistant,
            Content:  "Hello",
            Seq:      1,
            Timestamp: time.Now(),
        }
    }()

    // 验证结果
    select {
    case msg := <-proc.MessageChannel():
        assert.Equal(t, MessageTypeAssistant, msg.Type)
    case err := <-errorChan:
        t.Errorf("Unexpected error: %v", err)
    case <-time.After(100 * time.Millisecond):
        t.Error("Timeout waiting for message")
    }
}
```

## 测试数据

### 测试数据创建
```go
// 使用工厂模式创建测试数据
type SessionFactory struct{}

func (f *SessionFactory) CreateTestSession(id string) *Session {
    instance := &pool.Instance{}
    store := &SessionStore{}

    return NewSession(id, instance, store, SessionConfig{
        MaxRecentMessages: 100,
        MessageBufferSize: 50,
    })
}

func (f *SessionFactory) CreateTestMessage(seq int64, msgType MessageType) *protocol.Message {
    return &protocol.Message{
        Seq:      seq,
        Type:     msgType,
        Content:  "Test message",
        Timestamp: time.Now(),
    }
}
```

### 测试用例表
```go
func TestSession_GetMessages(t *testing.T) {
    testCases := []struct {
        name        string
        messages    []*protocol.Message
        filter      MessageFilter
        expected    []*protocol.Message
        shouldError bool
    }{
        {
            name: "get all messages",
            messages: []*protocol.Message{
                {Seq: 1, Type: MessageTypeUser},
                {Seq: 2, Type: MessageTypeAssistant},
            },
            filter: MessageFilter{},
            expected: []*protocol.Message{
                {Seq: 1, Type: MessageTypeUser},
                {Seq: 2, Type: MessageTypeAssistant},
            },
        },
        {
            name: "get messages since seq",
            messages: []*protocol.Message{
                {Seq: 1, Type: MessageTypeUser},
                {Seq: 2, Type: MessageTypeAssistant},
                {Seq: 3, Type: MessageTypeUser},
            },
            filter: MessageFilter{SinceSeq: 2},
            expected: []*protocol.Message{
                {Seq: 2, Type: MessageTypeAssistant},
                {Seq: 3, Type: MessageTypeUser},
            },
        },
        {
            name: "get messages with limit",
            messages: []*protocol.Message{
                {Seq: 1, Type: MessageTypeUser},
                {Seq: 2, Type: MessageTypeAssistant},
                {Seq: 3, Type: MessageTypeUser},
            },
            filter: MessageFilter{Limit: 2},
            expected: []*protocol.Message{
                {Seq: 1, Type: MessageTypeUser},
                {Seq: 2, Type: MessageTypeAssistant},
            },
        },
    }

    for _, tc := range testCases {
        t.Run(tc.name, func(t *testing.T) {
            session := SessionFactory{}.CreateTestSession("test")

            // 添加测试消息
            for _, msg := range tc.messages {
                session.messages = append(session.messages, msg)
            }

            // 执行测试
            result, err := session.GetMessages(tc.filter)

            // 验证结果
            if tc.shouldError {
                assert.Error(t, err)
            } else {
                assert.NoError(t, err)
                assert.Equal(t, tc.expected, result)
            }
        })
    }
}
```

## 测试覆盖率

### 目标覆盖率
- **整体目标**: 80%+
- **关键模块**: 90% (claude/, session/)
- **测试文件**: 使用 `coverage.out` 文件

### 覆盖率报告
```bash
# 生成 HTML 报告
make test-coverage
# 或
go tool cover -html=coverage.out -o coverage.html

# 查看文本覆盖率
go tool cover -func=coverage.out
```

### 覆盖率分析
- 重点覆盖错误处理路径
- 覆盖并发代码的各个分支
- 集成测试覆盖 API 端点

## 测试命名约定

### 单元测试
```go
func TestNewProcess(t *testing.T)                    // 测试构造函数
func TestProcess_Start_Success(t *testing.T)         // 测试成功场景
func TestProcess_Start_AlreadyRunning(t *testing.T)  // 测试重复启动
func TestProcess_SendMessage_ProcessNotRunning(t *testing.T) // 测试错误场景
```

### 集成测试
```go
func TestCreateSession(t *testing.T)           // 测试会话创建
func TestHealthCheck(t *testing.T)            // 测试健康检查
func TestListCommands(t *testing.T)           // 测试命令列表
```

### E2E 测试
```bash
# 脚本中测试函数
:func test_session_lifecycle
:func test_message_flow
:func test_permission_handling
```

## 异步测试

### 超时处理
```go
func TestProcess_Timeout(t *testing.T) {
    ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
    defer cancel()

    proc := NewProcess("test", Config{})

    // 测试超时场景
    err := proc.Start(ctx)
    assert.Error(t, err)
    assert.Equal(t, context.DeadlineExceeded, err)
}
```

### 并发测试
```go
func TestSession_ConcurrentSubscribers(t *testing.T) {
    session := SessionFactory{}.CreateTestSession("test")

    // 创建多个订阅者
    subscribers := make([]<-chan *protocol.Message, 0)
    for i := 0; i < 10; i++ {
        ctx, cancel := context.WithCancel(context.Background())
        msgChan, unsub := session.Subscribe(ctx, MessageFilter{})
        subscribers = append(subscribers, msgChan)
        defer cancel()
        defer unsub()
    }

    // 发送消息
    go func() {
        msg := SessionFactory{}.CreateTestMessage(1, MessageTypeUser)
        session.messages = append(session.messages, msg)
        session.notifySubscribers(msg)
    }()

    // 验证所有订阅者都收到消息
    time.Sleep(10 * time.Millisecond)
    for _, sub := range subscribers {
        select {
        case msg := <-sub:
            assert.NotNil(t, msg)
        case <-time.After(100 * time.Millisecond):
            t.Error("Subscriber did not receive message")
        }
    }
}
```

## 测试工具

### 辅助函数
```go
// testing/helpers.go
package testing

import (
    "context"
    "net/http"
    "net/http/httptest"

    "github.com/your-org/ai-bridge/internal/api"
    "github.com/your-org/ai-bridge/internal/config"
    "github.com/your-org/ai-bridge/internal/session"
)

// CreateTestServer 创建测试用的 HTTP 服务器
func CreateTestServer() *httptest.Server {
    cfg := &config.Config{
        Database: config.DatabaseConfig{Path: ":memory:"},
        Pool: config.PoolConfig{MaxInstances: 1},
    }

    processPool := pool.NewPool(cfg.Pool, cfg.Claude)
    sessionManager, _ := session.NewManager(cfg.Session, processPool)
    healthChecker := health.NewChecker(cfg.Health, processPool, sessionManager)

    server := api.NewServer(cfg, sessionManager, processPool, healthChecker)
    return httptest.NewServer(server.Router())
}

// AssertResponseJSON 断言响应为有效 JSON
func AssertResponseJSON(t *testing.T, response *httptest.ResponseRecorder) map[string]interface{} {
    t.Helper()

    var result map[string]interface{}
    err := json.Unmarshal(response.Body.Bytes(), &result)
    require.NoError(t, err)

    return result
}
```

---

*测试分析: 2026-02-05*