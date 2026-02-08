# Logging Patterns

## AI-Bridge 日志模式和搜索

本文档描述 AI-Bridge 使用的 WQGroup/logger 日志库和常见日志模式。

## 日志库

AI-Bridge 使用 `github.com/WQGroup/logger` 日志库。

### 基本配置

```go
import "github.com/WQGroup/logger"

// 初始化日志系统（通常在 main.go 中）
logger.SetLoggerName("ai-bridge")        // 设置日志文件名
logger.SetLoggerLevel(logrus.InfoLevel)  // 设置日志级别
logger.SetLoggerRootDir("./logs")        // 设置日志目录（默认 ./Logs/）
```

### 日志级别

```go
logger.Debug("调试信息")   // 详细调试信息
logger.Info("一般信息")    // 一般信息
logger.Warn("警告信息")    // 警告
logger.Error("错误信息")   // 错误
logger.Fatal("致命错误")  // 致命错误后退出
```

### 格式化日志

```go
// 使用 Printf 风格
logger.Infof("用户 %s 连接成功", userID)
logger.Errorf("无法连接到数据库: %v", err)

// 使用结构化日志
logger.WithFields(logrus.Fields{
    "userId": userId,
    "sessionId": sessionId,
}).Info("用户创建 session")
```

## 日志文件位置

### 默认位置

```
./logs/ai-bridge.log
```

### 文件命名

```
ai-bridge.YYYYMMDD.log   # 例如: ai-bridge.20250115.log
```

### 日志轮转

- **单个文件时长：** 24 小时
- **最大保留时间：** 7 天
- **自动清理：** 删除 7 天前的日志文件

## 搜索日志

### Windows 命令提示符

```cmd
REM 搜索错误
findstr /C:"ERROR" logs\ai-bridge*.log

REM 搜索 panic
findstr /C:"panic" logs\ai-bridge*.log

REM 搜索特定日期
findstr /C:"2025-01-15" logs\ai-bridge.20250115.log

REM 搜索多个关键词
findstr /C:"ERROR" /C:"FATAL" logs\ai-bridge*.log

REM 搜索并显示行号
findstr /N /C:"ERROR" logs\ai-bridge*.log
```

### PowerShell

```powershell
# 搜索错误
Select-String -Path "logs\ai-bridge*.log" -Pattern "ERROR"

# 搜索 panic
Select-String -Path "logs\ai-bridge*.log" -Pattern "panic"

# 搜索特定时间范围
Get-Content "logs\ai-bridge.20250115.log" | Select-String -Pattern "14:[0-5][0-9]"

# 搜索并显示上下文（前后各 2 行）
Select-String -Path "logs\ai-bridge*.log" -Pattern "ERROR" -Context 2,2
```

### Go 代码搜索

如果需要在 Go 代码中搜索日志：

```bash
# 搜索日志调用
grep -r "logger\." internal/

# 搜索错误日志
grep -r "logger.Error" internal/

# 搜索特定日志消息
grep -r "Failed to" internal/
```

## 常见日志模式

### 启动日志

```
INFO[0000] Starting AI-Bridge server...
INFO[0000] Configuration loaded from configs/config.yaml
INFO[0000] Database connected: ./data/ai-bridge.db
INFO[0000] Process pool initialized (maxInstances=5)
INFO[0000] HTTP server listening on :8080
INFO[0000] WebSocket server initialized
```

### Session 创建

```
INFO[1234] Creating new session (model=haiku, workingDir=C:\WorkSpace\project)
INFO[1235] Session started successfully (id=session-abc123)
```

### 消息处理

```
INFO[2345] Received message (session=session-abc123, seq=101)
INFO[2346] Sending to Claude CLI...
INFO[2347] Received response from Claude CLI
INFO[2348] Message processed successfully (seq=101)
```

### 错误日志

```
ERROR[3456] Failed to start process: exit status 1
ERROR[3457] Database error: database is locked
ERROR[3458] Permission denied for tool use: Bash
```

### Panic 日志

```
panic: runtime error: invalid memory address or nil pointer dereference
[signal 0xc0000005 code=0x0 addr=0x0 pc=0x123456]

goroutine 123 [running]:
main.(*Handler).ProcessMessage(0xc000123456, 0xc000234567)
        C:/WorkSpace/ai-bridge/internal/handler/message.go:123 +0x456
```

## 日志分析

### 识别错误模式

**高频率错误：**
```bash
# 统计错误类型
findstr /C:"ERROR" logs\ai-bridge*.log | findstr /C:"Failed to" > errors.txt
```

**时间范围：**
```bash
# 查找特定时间段的错误
findstr /C:"2025-01-15 14:" logs\ai-bridge.20250115.log | findstr /C:"ERROR"
```

**Session 追踪：**
```bash
# 追踪特定 session 的所有日志
findstr /C:"session-abc123" logs\ai-bridge*.log
```

### 性能分析

**慢请求：**
```
WARN[5678] Slow request: GET /api/v1/sessions/:id/messages took 2.5s
```

**进程池状态：**
```
INFO[6789] Process pool status: active=2/5, idle=3
WARN[6790] Process pool nearly full: active=4/5
```

## 调试技巧

### 启用调试日志

```go
// 在 main.go 中设置调试级别
logger.SetLoggerLevel(logrus.DebugLevel)
```

### 添加上下文日志

```go
// 添加请求 ID
requestID := uuid.New().String()
logger.WithField("requestId", requestID).Info("Processing request")

// 添加多个字段
logger.WithFields(logrus.Fields{
    "sessionId": sessionID,
    "messageSeq": seq,
    "userId": userID,
}).Info("Processing message")
```

### 错误日志最佳实践

```go
// 好的错误日志
logger.Errorf("Failed to write message to database: session=%s, seq=%d, error=%v",
    sessionID, seq, err)

// 不好的错误日志（缺少上下文）
logger.Error("Database error")
```

## 日志问题排查

### 日志未写入

**症状：** 日志文件为空或不存在

**诊断：**
1. 检查日志目录权限
2. 检查 `logger.SetLoggerRootDir()` 路径
3. 检查磁盘空间

**解决：**
```go
// 确保目录存在
os.MkdirAll("./logs", 0755)

// 设置绝对路径
logger.SetLoggerRootDir("C:\\WorkSpace\\ai-bridge\\logs")
```

### 日志级别不正确

**症状：** 看不到预期的日志消息

**诊断：**
```go
// 检查当前日志级别
level := logger.GetLoggerLevel()
fmt.Printf("Current log level: %v\n", level)
```

**解决：**
```go
// 设置更低的日志级别
logger.SetLoggerLevel(logrus.DebugLevel)
```

### 日志文件过大

**症状：** 单个日志文件超过几百 MB

**诊断：**
```bash
# 检查日志文件大小
dir logs\
```

**解决：**
- WQGroup/logger 自动处理日志轮转
- 检查日志级别是否设置为 Debug（会产生大量日志）
- 考虑减少 Debug 日志输出

## 集成日志

### Go 错误处理

```go
func processMessage(msg Message) error {
    logger.Debugf("Processing message: seq=%d", msg.Seq)

    if err := validateMessage(msg); err != nil {
        logger.Errorf("Message validation failed: seq=%d, error=%v", msg.Seq, err)
        return err
    }

    logger.Infof("Message processed successfully: seq=%d", msg.Seq)
    return nil
}
```

### HTTP 请求日志

```go
func (h *Handler) HandleRequest(w http.ResponseWriter, r *http.Request) {
    start := time.Now()

    logger.Infof("Request started: method=%s, path=%s", r.Method, r.URL.Path)

    // 处理请求...

    duration := time.Since(start)
    logger.Infof("Request completed: method=%s, path=%s, duration=%v",
        r.Method, r.URL.Path, duration)
}
```

### 数据库日志

```go
func (s *Store) SaveMessage(msg Message) error {
    logger.Debugf("Saving message: session=%s, seq=%d", msg.SessionID, msg.Seq)

    _, err := s.db.Exec(...)
    if err != nil {
        logger.Errorf("Failed to save message: session=%s, seq=%d, error=%v",
            msg.SessionID, msg.Seq, err)
        return err
    }

    logger.Debugf("Message saved: session=%s, seq=%d", msg.SessionID, msg.Seq)
    return nil
}
```

## 日志最佳实践

### DO（推荐）

```go
// 使用结构化日志
logger.WithFields(logrus.Fields{
    "userId": userID,
    "action": "create_session",
}).Info("Session created")

// 包含上下文
logger.Errorf("Failed to connect to database: host=%s, port=%d, error=%v",
    host, port, err)

// 使用适当的日志级别
logger.Debug("Detailed debug info")
logger.Info("General info")
logger.Warn("Warning condition")
logger.Error("Error condition")
```

### DON'T（不推荐）

```go
// 不要记录敏感信息
logger.Info("User password: password123")  // ❌

//不要过度记录
logger.Debug("Every single line")          // ❌ 太多

// 不要在没有上下文的情况下记录错误
logger.Error("Something failed")            // ❌ 缺少上下文

// 不要在日志中拼接大字符串
logger.Info("Large data: " + hugeString)   // ❌ 性能问题
```
