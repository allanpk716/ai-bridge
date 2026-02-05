# 编码约定

**分析日期:** 2026-02-05

## 命名模式

### 文件命名
- Go 文件使用小写加下划线: `process.go`, `session_manager.go`
- 测试文件使用 `_test.go` 后缀: `process_test.go`, `api_test.go`
- 处理器文件使用 `handlers` 目录: `session.go`, `message.go`

### 函数命名
- 公共函数使用大写开头 (PascalCase): `NewProcess()`, `CreateSession()`
- 私有函数使用小写开头 (camelCase): `watchMessages()`, `handleMessage()`
- 测试函数使用 `Test<函数名>_<场景>` 格式: `TestProcess_Start_Success()`, `TestCreateSession()`

### 变量命名
- 结构体字段使用小写: `type Process struct { id string }`
- 局部变量使用小写: `msgChan := make(chan protocol.Message)`
- 常量使用大写: `const StateIdle SessionState = "idle"`

### 类型命名
- 接口使用 `-er` 后缀: `SessionManager`, `ProcessPool`
- 结构体使用名词: `Session`, `Process`, `Message`
- 错误类型使用 `Error` 后缀: `PermissionError`

## 代码风格

### 格式化
- **工具**: `go fmt` 和 `goimports`
- **命令**: `go fmt ./...` 和 `goimports -w .`
- **配置**: 使用 Go 默认格式化规则

### 代码检查
- **静态分析**: `go vet ./...`
- **Linting**: `golangci-lint run` (如果可用)
- **运行方式**: 通过 Makefile 的 `lint` 目标

### 注释规范
- 包级别注释: 在每个包的开头说明包的用途
- 函数注释: 公共函数使用 JSDoc 风格注释
- 内联注释: 用于复杂逻辑的解释

```go
// Session represents a Claude CLI session
type Session struct {
    id string
    // ... fields
}

// CreateSession creates a new session with the given options
// Returns an error if session creation fails
func (s *Session) CreateSession(opts CreateOptions) error {
    // ...
}
```

## 导入组织

### 导入顺序
1. 标准库 (按字母顺序)
2. 第三方库 (按字母顺序)
3. 本地包 (按字母顺序)

### 示例
```go
import (
    // 标准库
    "context"
    "encoding/json"
    "fmt"
    "time"

    // 第三方库
    "github.com/gin-gonic/gin"
    "github.com/sirupsen/logrus"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"

    // 本地包
    "github.com/your-org/ai-bridge/internal/claude"
    "github.com/your-org/ai-bridge/internal/session"
)
```

### 路径别名
- 使用完整的导入路径
- 避免使用相对导入

## 错误处理

### 错误模式
- 使用 `fmt.Errorf` 包装错误，添加上下文信息
- 使用 `errors.Is()` 和 `errors.As()` 进行错误检查
- 避免直接返回原始错误

```go
// ✅ 正确的做法
return fmt.Errorf("failed to start process: %w", err)

// ✅ 正确的做法
if err != nil {
    return fmt.Errorf("failed to create session: %w", err)
}
```

### 错误传播
- 保持错误链的完整性
- 添加有意义的上下文信息

```go
// ✅ 正确的做法
func (p *Process) SendMessage(ctx context.Context, content string) error {
    p.mu.RLock()
    defer p.mu.RUnlock()

    if !p.running {
        return fmt.Errorf("process not running")
    }

    // ...
    return fmt.Errorf("failed to write to stdin: %w", err)
}
```

### 错误日志记录
- 使用结构化日志记录错误
- 包含足够的信息用于调试

```go
logger.Errorf("Session %s: failed to save message to DB: %v", sessionID, err)
```

## 日志记录

### 日志库
- 使用 `github.com/WQGroup/logger`
- 基于 logrus，支持结构化日志

### 日志级别
- Debug: 调试信息，详细的流程跟踪
- Info: 一般信息，关键操作完成
- Warn: 警告信息，潜在问题
- Error: 错误信息，操作失败

### 基本用法
```go
import "github.com/WQGroup/logger"

// 初始化日志
logger.SetLoggerName("ai-bridge")
logger.SetLoggerLevel(logrus.InfoLevel)

// 使用不同级别
logger.Debug("调试信息")
logger.Info("一般信息")
logger.Warn("警告信息")
logger.Error("错误信息")
```

### 结构化日志
```go
logger.Infof("Starting process %s with config: %+v", processID, config)
logger.Errorf("Session %s: failed to save message: %v", sessionID, err)
```

## 函数设计

### 函数大小
- 保持函数简短，专注于单一职责
- 最大建议长度：30-50 行
- 复杂逻辑拆分为多个小函数

### 参数设计
- 参数数量控制在 4 个以内
- 复合参数使用结构体
- 必需参数在前，可选参数在后

```go
// ✅ 正确的做法
func (p *Process) Start(ctx context.Context) error

// ✅ 正确的做法
func (s *Session) CreateSession(opts CreateOptions) error
```

### 返回值
- 错误始终作为最后一个返回值
- 使用命名返回值提高可读性
- 对于复杂类型，考虑使用指针返回

```go
func (s *Session) GetMessages(opts GetMessagesOptions) ([]*protocol.Message, error)
```

## 并发模式

### 互斥锁使用
- 使用 `sync.RWMutex` 进行读写同步
- 遵循"获取锁后立即使用，使用后立即释放"原则
- 在函数开始获取锁，函数结束释放锁

```go
func (s *Session) handleMessage(msg *protocol.Message) {
    s.mu.Lock()
    defer s.mu.Unlock()

    // 处理消息...
}
```

### Channel 使用
- 有界 channel 防止内存泄漏
- 使用 select 进行非阻塞发送
- 在 goroutine 退出时关闭 channel

```go
msgChan := make(chan protocol.Message, 100)
errorChan := make(chan error, 10)

select {
case msgChan <- msg:
    // 发送成功
case <-ctx.Done():
    // 上下文取消
default:
    // channel 满，记录警告
}
```

### Context 使用
- 使用 context 进行取消和超时控制
- 在 goroutine 中监听 context.Done()
- 传递 context 到所有需要取消的函数

```go
func (s *Session) watchMessages() {
    defer s.wg.Done()

    for {
        select {
        case msg, ok := <-msgChan:
            if !ok {
                return
            }
            s.handleMessage(&msg)
        case <-s.ctx.Done():
            return
        }
    }
}
```

## 模块设计

### 导出模式
- 内部包使用小写导出
- 公共接口使用大写导出
- 通过接口暴露功能，而不是实现

```go
// ✅ 正确的做法
type Manager interface {
    CreateSession(opts CreateOptions) (*Session, error)
    GetSession(id string) (*Session, error)
}

// ✅ 正确的做法
func NewManager(cfg Config, pool *Pool) *manager
```

### 模块职责
- 每个包专注于单一领域
- 避免包之间的循环依赖
- 使用依赖注入进行解耦

### 接口设计
- 接口尽量小，单一职责
- 使用组合接口创建复杂行为
- 接口命名以行为为导向

```go
type MessageHandler interface {
    HandleMessage(msg *protocol.Message) error
}

type ErrorHandler interface {
    HandleError(err error) error
}

type MessageProcessor interface {
    MessageHandler
    ErrorHandler
}
```

## 类型安全

### 常量定义
- 使用常量而不是魔术字符串
- 枚举类型使用 string 或 int 常量

```go
type MessageType string

const (
    MessageTypeUser      MessageType = "user"
    MessageTypeAssistant MessageType = "assistant"
    MessageTypeToolUse   MessageType = "tool_use"
)
```

### 类型转换
- 使用类型转换而不是强制类型断言
- 检查类型转换是否成功

```go
// ✅ 正确的做法
func (p *Process) parseMessage(jsonContent string) error {
    var rawData map[string]interface{}
    if err := json.Unmarshal([]byte(jsonContent), &rawData); err != nil {
        return err
    }

    msgType, ok := rawData["type"].(string)
    if !ok {
        return fmt.Errorf("missing message type")
    }

    // ...
}
```

## 测试约定

### 测试命名
- 测试函数使用 `Test<被测试函数>_<场景>` 格式
- 集成测试使用 `build` 标签: `// +build integration`
- 测试文件与源文件同目录或放在 `tests/` 目录

### 测试结构
```go
func TestFunction_Scenario(t *testing.T) {
    // 1. 准备测试数据
    testCases := []struct{
        name string
        input InputType
        expected OutputType
        err bool
    }{
        // 测试用例...
    }

    // 2. 运行测试
    for _, tc := range testCases {
        t.Run(tc.name, func(t *testing.T) {
            // 执行测试
            result, err := function(tc.input)

            // 断言结果
            if tc.err {
                assert.Error(t, err)
            } else {
                assert.NoError(t, err)
                assert.Equal(t, tc.expected, result)
            }
        })
    }
}
```

### 模拟和存根
- 使用 `testify/mock` 进行模拟
- 内部函数的模拟通过接口实现
- 避免过度模拟

---

*约定分析: 2026-02-05*