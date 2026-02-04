# P0 关键问题修复指南

**在开始执行实现计划前,必须先修复以下P0问题,否则代码无法编译通过。**

---

## 🔴 P0-1: Event结构体字段错误

### 问题位置
`internal/claude/process.go` 第962行和第1000行

### 错误代码
```go
// internal/claude/process.go:962
p.eventChan <- protocol.Event{
    Type:      protocol.EventTypeSessionCreated,
    ProcessID: p.id,  // ❌ protocol.Event没有ProcessID字段
    Timestamp: time.Now(),
}

// internal/claude/process.go:1000
p.eventChan <- protocol.Event{
    Type:      protocol.EventTypeSessionClosed,
    ProcessID: p.id,  // ❌ 同样的错误
    Timestamp: time.Now(),
}
```

### 修复方案
**方案1: 修改protocol.Event (推荐)**

修改 `pkg/protocol/events.go`:
```go
// pkg/protocol/events.go
package protocol

import "time"

// EventType 事件类型
type EventType string

const (
    EventTypeSessionCreated   EventType = "session_created"
    EventTypeSessionClosed    EventType = "session_closed"
    EventTypeMessageReceived  EventType = "message_received"
    EventTypePermissionRequested EventType = "permission_requested"
    EventTypeError            EventType = "error"
)

// Event 事件
type Event struct {
    Type      EventType   `json:"type"`
    ID        string      `json:"id"`        // ✅ 改为通用的ID字段
    Timestamp time.Time   `json:"timestamp"`
    Data      interface{} `json:"data,omitempty"`
}
```

然后修改 `internal/claude/process.go`:
```go
// internal/claude/process.go:962
// Send started event
p.eventChan <- protocol.Event{
    Type:      protocol.EventTypeSessionCreated,
    ID:        p.id,      // ✅ 使用ID字段
    Timestamp: time.Now(),
}

// internal/claude/process.go:1000
// Send stopped event
p.eventChan <- protocol.Event{
    Type:      protocol.EventTypeSessionClosed,
    ID:        p.id,      // ✅ 使用ID字段
    Timestamp: time.Now(),
}
```

**方案2: 修改process.go使用SessionID**

如果不想修改protocol包,可以在process.go中直接使用SessionID:
```go
// internal/claude/process.go:962
p.eventChan <- protocol.Event{
    Type:      protocol.EventTypeSessionCreated,
    SessionID: p.id,  // ✅ 使用SessionID
    Timestamp: time.Now(),
}

// internal/claude/process.go:1000
p.eventChan <- protocol.Event{
    Type:      protocol.EventTypeSessionClosed,
    SessionID: p.id,  // ✅ 使用SessionID
    Timestamp: time.Now(),
}
```

---

## 🔴 P0-2: 缺少SetMessageCallbacks方法

### 问题位置
`internal/session/manager.go` 第1751-1758行

### 错误代码
```go
// internal/session/manager.go:1751
proc.SetMessageCallbacks(
    func(seq int64) {
        sess.startProcessing(seq)
    },
    func(seq int64, duration time.Duration) {
        sess.completeProcessing(seq)
    },
)
// ❌ Process类型没有SetMessageCallbacks方法
```

### 修复方案
在 `internal/claude/process.go` 中添加方法:

```go
// internal/claude/process.go
// 在Process结构体的方法区域添加

// SetMessageCallbacks 设置消息处理回调
func (p *Process) SetMessageCallbacks(
    onStarted func(seq int64),
    onEnded func(seq int64, duration time.Duration),
) {
    p.mu.Lock()
    defer p.mu.Unlock()

    p.onMessageStarted = onStarted
    p.onMessageEnded = onEnded

    logger.Debugf("Message callbacks set for process %s", p.id)
}
```

**插入位置建议:**
在 `ID()` 方法之后添加:

```go
// internal/claude/process.go (在ID()方法后)

// ID 返回进程ID
func (p *Process) ID() string {
    return p.id
}

// SetMessageCallbacks 设置消息处理回调
func (p *Process) SetMessageCallbacks(
    onStarted func(seq int64),
    onEnded func(seq int64, duration time.Duration),
) {
    p.mu.Lock()
    defer p.mu.Unlock()

    p.onMessageStarted = onStarted
    p.onMessageEnded = onEnded

    logger.Debugf("Message callbacks set for process %s", p.id)
}

// nextSeq 生成下一个序号
func (p *Process) nextSeq() int64 {
    return atomic.AddInt64(&p.lastSeq, 1)
}
```

---

## 🔴 P0-3: 缺少time导入

### 问题位置
`internal/session/manager.go` 第1747行

### 错误代码
```go
// internal/session/manager.go
import (
    "context"
    "fmt"
    "sync"
    // ❌ 缺少 "time"

    "ai-bridge/internal/claude"
    "ai-bridge/internal/config"
    "ai-bridge/internal/pool"
    "github.com/WQGroup/logger"
)

// 第1747行使用了time.Now()
sessionID := fmt.Sprintf("sess-%d", time.Now().UnixNano())
// ❌ time包未导入
```

### 修复方案
添加 `time` 导入:

```go
// internal/session/manager.go
package session

import (
    "context"
    "fmt"
    "sync"
    "time"  // ✅ 添加time包

    "ai-bridge/internal/claude"
    "ai-bridge/internal/config"
    "ai-bridge/internal/pool"
    "github.com/WQGroup/logger"
)
```

---

## 🔴 P0-4: 缺少YAML依赖

### 问题位置
Task 1 Step 2 (安装依赖)

### 错误代码
```bash
go get github.com/stretchr/testify@v1.9.0
go get gorm.io/gorm@v1.25.12
go get gorm.io/driver/sqlite@v1.5.6
go get github.com/WQGroup/logger
go get github.com/gin-gonic/gin@v1.10.0
go get github.com/gorilla/websocket@v1.5.3
go get github.com/fsnotify/fsnotify@v1.7.0
# ❌ 缺少 gopkg.in/yaml.v3
```

但 `internal/config/config.go` 中使用了:
```go
import (
    "github.com/fsnotify/fsnotify"
    "gopkg.in/yaml.v3"  // ❌ 这个包没有安装
)
```

### 修复方案
在 Task 1 Step 2 中添加:

```bash
go get github.com/stretchr/testify@v1.9.0
go get gorm.io/gorm@v1.25.12
go get gorm.io/driver/sqlite@v1.5.6
go get github.com/WQGroup/logger
go get github.com/gin-gonic/gin@v1.10.0
go get github.com/gorilla/websocket@v1.5.3
go get github.com/fsnotify/fsnotify@v1.7.0
go get gopkg.in/yaml.v3  # ✅ 添加YAML解析库
```

---

## 📋 修复检查清单

在开始执行实现计划前,请确认以下修复已完成:

- [ ] **P0-1**: Event结构体字段已修复
  - [ ] 方案选择: □ 修改protocol.Event (推荐)  □ 修改process.go使用SessionID
  - [ ] 代码已更新
  - [ ] 验证编译通过

- [ ] **P0-2**: SetMessageCallbacks方法已添加
  - [ ] 方法已添加到 `internal/claude/process.go`
  - [ ] 方法签名正确
  - [ ] 验证manager.go可以调用

- [ ] **P0-3**: time包已导入
  - [ ] `internal/session/manager.go` 已添加 `"time"` 导入
  - [ ] 验证time.Now()可用

- [ ] **P0-4**: YAML依赖已安装
  - [ ] Task 1 Step 2 已添加 `go get gopkg.in/yaml.v3`
  - [ ] 验证go.mod包含该依赖

---

## 🧪 验证步骤

完成所有P0修复后,运行以下命令验证:

```bash
# 1. 确保依赖正确
go mod tidy

# 2. 尝试编译(应该在错误后停止)
go build ./cmd/ai-bridge

# 3. 运行测试(如果测试文件存在)
go test ./internal/...

# 4. 检查语法
go vet ./...
```

**期望结果:**
- 如果所有P0问题已修复,编译应该能通过(可能会有其他链接错误,但语法错误应该已解决)
- 如果仍有P0级别的编译错误,检查是否所有修复都已正确应用

---

## 🔧 快速修复脚本

如果您想一次性应用所有修复,可以按以下顺序执行:

### Step 1: 修复protocol.Event
```bash
# 编辑 pkg/protocol/events.go
# 将 SessionID 改为 ID
```

### Step 2: 修复process.go
```bash
# 编辑 internal/claude/process.go
# 1. 修改第962行: ProcessID -> ID
# 2. 修改第1000行: ProcessID -> ID
# 3. 添加SetMessageCallbacks方法
```

### Step 3: 修复manager.go
```bash
# 编辑 internal/session/manager.go
# 在import部分添加 "time"
```

### Step 4: 添加依赖
```bash
go get gopkg.in/yaml.v3
go mod tidy
```

### Step 5: 验证
```bash
go build ./cmd/ai-bridge
```

---

## ⚠️ 注意事项

1. **修复顺序很重要**: 建议按照P0-1到P0-4的顺序修复
2. **不要跳过验证**: 每修复一个问题后,建议立即验证编译
3. **保留原文件**: 修改前建议备份原文件或使用git版本控制
4. **选择一致的方案**: P0-1有两种方案,选择一种并在整个项目中保持一致

---

## 📝 修复完成标记

当所有P0问题修复完成并验证通过后,在实现计划文档顶部标记:

```markdown
## ✅ P0问题已修复

- [x] P0-1: Event结构体字段
- [x] P0-2: SetMessageCallbacks方法
- [x] P0-3: time导入
- [x] P0-4: YAML依赖

修复日期: YYYY-MM-DD
验证状态: ✅ 编译通过
```

修复完成后即可开始执行Task 1-15的实现计划!

---

## 🆘 遇到问题?

如果修复过程中遇到问题:

1. **编译错误信息**: 仔细阅读错误信息,确定是哪个P0问题
2. **IDE提示**: 使用GoLand或VSCode的导入自动修复功能
3. **Git diff**: 使用`git diff`查看修改是否正确
4. **回滚**: 如果出错,使用`git checkout`恢复原文件

祝修复顺利! 🚀
