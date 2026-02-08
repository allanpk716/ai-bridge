# 后端调试参考 / Backend Debugging Reference

## Go 调试工具 / Go Debugging Tools

### Delve 调试器

```bash
# 安装 Delve
go install github.com/go-delve/delve/cmd/dlv@latest

# 调试 main.go
dlv debug ./cmd/ai-bridge

# 常用命令
break internal/claude/process.go:123  # 设置断点
continue                             # 继续执行
next                                 # 单步执行（不进入函数）
step                                 # 单步执行（进入函数）
print variable_name                  # 打印变量
locals                               # 显示局部变量
```

### Go 构建错误

**常见问题：**
- 导入路径不正确
- Go 模块问题
- 循环依赖

**解决方案：**
```bash
# 清理依赖
go mod tidy

# 验证模块
go mod verify

# 检查导入
go list -m all
```

### 运行时 Panic

**查找堆栈跟踪：**
```
panic: runtime error: invalid memory address or nil pointer dereference

goroutine 123 [running]:
github.com/user/ai-bridge/internal/claude.(*Process).Start(...)
        C:/WorkSpace/ai-bridge/internal/claude/process.go:456 +0x456
main.main()
        C:/WorkSpace/ai-bridge/cmd/ai-bridge/main.go:78 +0x123
```

**分析要点：**
1. 查看 `goroutine` 编号
2. 定位错误文件和行号（`file.go:line`）
3. 查看调用栈了解如何到达错误点

## 日志分析（WQGroup/logger） / Log Analysis

### 日志格式

AI-Bridge 使用结构化日志（基于 logrus）：

```
time="2025-01-15T10:30:45Z" level=info msg="Starting process..." session_id=abc123
time="2025-01-15T10:30:46Z" level=error msg="Failed to start" error="context deadline exceeded"
```

### 搜索问题

**Windows 命令提示符：**
```cmd
REM 搜索错误
findstr /C:"ERROR" logs\ai-bridge*.log

REM 搜索 panic
findstr /C:"panic" logs\ai-bridge*.log

REM 搜索特定 session
findstr /C:"session_id=abc123" logs\ai-bridge*.log

REM 搜索特定时间
findstr /C:"2025-01-15 14:" logs\ai-bridge.20250115.log
```

**PowerShell：**
```powershell
# 搜索错误
Select-String -Path "logs\ai-bridge*.log" -Pattern "ERROR"

# 显示上下文（前后各 2 行）
Select-String -Path "logs\ai-bridge*.log" -Pattern "ERROR" -Context 2,2

# 搜索并计数
Select-String -Path "logs\ai-bridge*.log" -Pattern "ERROR" | Measure-Object
```

### 常见日志模式

**数据库错误：**
- `"database is locked"` - 并发写入问题
- `"no such table"` - 迁移未运行
- `"constraint failed"` - 数据验证问题

**进程错误：**
- `"context deadline exceeded"` - 超时
- `"signal: killed"` - 进程被终止
- `"exit status 1"` - CLI 返回错误

**WebSocket 错误：**
- `"connection closed"` - 客户端断开
- `"write: broken pipe"` - 客户端消失
- `"handshake error"` - CORS 或认证问题

## 数据库检查 / Database Inspection

### SQLite 命令

```bash
# 打开数据库
sqlite3 data\ai-bridge.db

# 列出所有表
.tables

# 查看表结构
.schema sessions
.schema messages
.schema permissions

# 查询 sessions
SELECT id, status, created_at FROM sessions LIMIT 10;

# 查询消息数量
SELECT session_id, COUNT(*) as msg_count FROM messages GROUP BY session_id;

# 查询待处理权限
SELECT * FROM permissions WHERE status = 'pending';
```

### 常用数据库查询

**活动 sessions：**
```sql
SELECT id, status, created_at
FROM sessions
WHERE status IN ('ready', 'busy');
```

**孤儿 sessions（无最近消息）：**
```sql
SELECT s.id, s.status, MAX(m.seq) as last_seq
FROM sessions s
LEFT JOIN messages m ON s.id = m.session_id
GROUP BY s.id
HAVING last_seq IS NULL OR last_seq < 100;
```

**失败的权限：**
```sql
SELECT * FROM permissions WHERE status = 'denied'
ORDER BY created_at DESC
LIMIT 20;
```

**大消息 sessions：**
```sql
SELECT session_id, COUNT(*) as count
FROM messages
GROUP BY session_id
HAVING count > 1000
ORDER BY count DESC;
```

## API 处理器调试 / API Handler Debugging

### 检查处理器注册

```bash
# 检查路由配置
# 查看 internal/api/routes.go
# 或使用 chi 的 Routes() 方法
```

### 测试端点

**健康检查：**
```bash
curl http://localhost:8080/health
```

**列出 sessions：**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/v1/sessions
```

**创建 session：**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"model": "haiku", "workingDir": "C:\\WorkSpace\\project"}' \
  http://localhost:8080/api/v1/sessions
```

**获取消息：**
```bash
curl http://localhost:8080/api/v1/sessions/SESSION_ID/messages?limit=50
```

## 性能分析 / Performance Profiling

### CPU 分析

```go
import (
    "os"
    "runtime/pprof"
)

func main() {
    f, _ := os.Create("cpu.prof")
    pprof.StartCPUProfile(f)
    defer pprof.StopCPUProfile()
    // ... 服务器代码
}
```

### 内存分析

```bash
# 获取内存 profile
curl http://localhost:8080/debug/pprof/heap > heap.prof

# 分析
go tool pprof heap.prof

# 在 pprof 交互中
top10       # 显示前 10 个分配
pdf         # 生成可视化图
```

### HTTP 分析

```bash
# 获取 HTTP handler profile
go tool pprof -http=:8080 http://localhost:8080/debug/pprof/profile
```

## 常见问题 / Common Issues

### 导入错误

**症状：** `cannot find package`

**解决方案：**
```bash
# 检查 go.mod 中的模块路径
cat go.mod

# 清理并重新下载
go mod tidy
go mod download
```

### Context 取消

**症状：** `context canceled` 错误

**诊断：**
- 检查 context 是否被过早取消
- 验证配置中的超时值

**解决：**
```go
// 增加超时
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
defer cancel()
```

### 竞态条件

**检测：**
```bash
# 运行竞态检测器
go run -race ./cmd/ai-bridge
```

**常见竞态：**
- 共享变量访问
- 未锁定的 map 读写
- channel 关闭和使用

**解决：**
```go
var mu sync.Mutex
var data map[string]string

func safeAccess(key string) string {
    mu.Lock()
    defer mu.Unlock()
    return data[key]
}
```

### 内存泄漏

**症状：** 内存持续增长

**诊断：**
```go
// 检查 goroutine 数量
fmt.Printf("Goroutines: %d\n", runtime.NumGoroutine())

// 获取内存统计
var m runtime.MemStats
runtime.ReadMemStats(&m)
fmt.Printf("Alloc: %v MB\n", m.Alloc/1024/1024)
```

**常见原因：**
- Goroutine 泄漏（未退出的 goroutine）
- 未关闭的 channel
- 订阅者未清理

**解决：**
```go
// 确保清理
func (s *Session) Close() error {
    s.mu.Lock()
    defer s.mu.Unlock()

    // 关闭所有订阅
    for _, sub := range s.subscribers {
        close(sub.msgChan)
    }
    s.subscribers = nil

    return nil
}
```

## Go 代码调试技巧

### 使用 fmt 调试

```go
fmt.Printf("DEBUG: variable = %+v\n", variable)
fmt.Printf("DEBUG: type = %T\n", variable)
```

### 使用 logger 调试

```go
logger.Debugf("Processing message: seq=%d, content=%q", msg.Seq, msg.Content)
logger.WithFields(logrus.Fields{
    "sessionId": sessionID,
    "messageSeq": seq,
}).Debug("Processing message")
```

### 堆栈跟踪

```go
import "runtime"

func printStackTrace() {
    buf := make([]byte, 4096)
    n := runtime.Stack(buf, false)
    fmt.Printf("Stack:\n%s\n", buf[:n])
}
```

### 检查接口实现

```go
var _ SomeInterface = (*SomeType)(nil)
```

## Windows 特定问题

### 路径问题

```go
// 使用原始字符串避免转义
path := "C:\\WorkSpace\\project"

// 或使用 filepath 包
path := filepath.Join("C:", "WorkSpace", "project")
```

### 信号处理

```go
// Windows 不支持 SIGTERM，使用 SIGINT
signal.Notify(c, os.Interrupt)
```

### 文件权限

```go
// Windows 不支持 Unix 权限模式
// 使用 0600 而非 os.FileMode(0644)
f, err := os.OpenFile("file.txt", os.O_CREATE|os.O_WRONLY, 0600)
```
