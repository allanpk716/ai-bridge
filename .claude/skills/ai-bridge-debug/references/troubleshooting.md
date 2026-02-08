# Troubleshooting

## AI-Bridge 常见问题排查

本文档列出 AI-Bridge 的常见问题和解决方案。

## 启动问题

### 问题：服务器无法启动

**症状：**
```
Error: failed to start server: listen tcp :8080: bind: address already in use
```

**原因：** 端口 8080 已被占用

**解决方案：**
```bash
# Windows - 查找占用端口的进程
netstat -ano | findstr :8080

# 终止进程（PID 从上面的命令获取）
taskkill /PID <PID> /F

# 或更改配置文件中的端口
# 编辑 configs/config.yaml
server:
  port: 8081  # 更改端口
```

### 问题：数据库连接失败

**症状：**
```
Error: failed to connect to database: unable to open database file
```

**原因：** 数据库目录不存在或权限不足

**解决方案：**
```bash
# 创建数据目录
mkdir data

# Windows - 检查权限
icacls data

# 或在配置中更改数据库路径
# 编辑 configs/config.yaml
database:
  path: "C:\\ai-bridge-data\\ai-bridge.db"
```

### 问题：Claude CLI 未找到

**症状：**
```
Error: claude command not found in PATH
```

**原因：** Claude CLI 不在系统 PATH 中

**解决方案：**
```bash
# 验证 Claude CLI 安装
where claude

# 如果未找到，重新安装 Claude CLI
# 或在配置中指定完整路径
```

## 连接问题

### 问题：前端无法连接后端

**症状：** 浏览器控制台显示 `ERR_CONNECTION_REFUSED`

**诊断：**
1. 检查后端是否运行
2. 检查端口是否正确
3. 检查防火墙设置

**解决方案：**
```bash
# 验证后端运行
curl http://localhost:8080/health

# 检查端口
netstat -an | findstr :8080

# 检查防火墙（Windows）
netsh advfirewall firewall show rule name=all | findstr 8080
```

### 问题：CORS 错误

**症状：** 浏览器控制台显示 CORS 错误

```
Access to XMLHttpRequest at 'http://localhost:8080/api/v1/sessions'
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**原因：** 前端源不在 CORS 允许列表中

**解决方案：**
```yaml
# 编辑 configs/config.yaml
cors:
  origins:
    - "http://localhost:3000"    # 添加前端 URL
    - "http://localhost:8080"    # 添加服务器 URL
```

### 问题：WebSocket 连接失败

**症状：** WebSocket 无法建立连接

**诊断：**
1. 检查 WebSocket 端点是否正确
2. 检查 Socket.IO 版本兼容性
3. 检查代理设置（如使用 nginx）

**解决方案：**
```javascript
// 前端 - 检查 Socket.IO 连接
const socket = io('http://localhost:8080', {
  transports: ['websocket'],
  reconnection: true
});

socket.on('connect_error', (error) => {
  console.error('WebSocket connection error:', error);
});
```

## 性能问题

### 问题：API 响应慢

**症状：** API 请求超过 1 秒

**诊断：**
1. 检查数据库查询
2. 检查网络延迟
3. 检查进程池状态

**解决方案：**
```sql
-- 检查数据库索引
PRAGMA index_list('messages');

-- 分析查询计划
EXPLAIN QUERY PLAN SELECT * FROM messages
WHERE session_id = ? AND seq > ? ORDER BY seq LIMIT 50;
```

### 问题：高内存使用

**症状：** 进程内存持续增长

**诊断：**
```bash
# Windows - 检查进程内存
tasklist /FI "IMAGENAME eq ai-bridge.exe"
```

**解决方案：**
```yaml
# 编辑 configs/config.yaml - 减少内存中的消息
performance:
  maxRecentMessages: 50  # 从 100 减少到 50
```

### 问题：进程池耗尽

**症状：** 无法创建新 session

```
Error: process pool is full
```

**解决方案：**
```yaml
# 编辑 configs/config.yaml - 增加最大实例数
pool:
  maxInstances: 10  # 从 5 增加到 10
  idleTimeout: 300s
```

## 数据问题

### 问题：数据库锁定

**症状：**
```
Error: database is locked
```

**原因：** 多个进程试图写入数据库

**解决方案：**
```bash
# 1. 停止 ai-bridge 服务器

# 2. 删除 WAL 文件
del data\ai-bridge.db-wal
del data\ai-bridge.db-shm

# 3. 重启服务器
```

### 问题：消息未保存

**症状：** 发送消息后未出现在列表中

**诊断：**
1. 检查数据库连接
2. 检查消息序列号
3. 检查前端同步

**解决方案：**
```bash
# 检查数据库中的消息
sqlite3 data\ai-bridge.db "SELECT * FROM messages WHERE session_id = 'session-id' ORDER BY seq DESC LIMIT 5;"

# 检查前端是否使用增量同步
# GET /api/v1/sessions/:id/messages?since=<last-seq>
```

### 问题：旧消息缺失

**症状：** 历史消息未显示

**诊断：**
1. 检查前端分页逻辑
2. 检查数据库中是否有消息

**解决方案：**
```bash
# 检查消息总数
sqlite3 data\ai-bridge.db "SELECT COUNT(*) FROM messages WHERE session_id = 'session-id';"

# 使用 before 参数获取历史消息
# GET /api/v1/sessions/:id/messages?before=<seq>&limit=50
```

## 权限问题

### 问题：权限请求未显示

**症状：** Claude 请求权限但前端未显示

**诊断：**
1. 检查权限 API
2. 检查前端轮询或 SSE

**解决方案：**
```bash
# 检查待处理权限
curl http://localhost:8080/api/v1/sessions/:sessionId/permissions

# 应返回待处理权限列表
```

### 问题：权限自动拒绝

**症状：** 权限立即被拒绝

**原因：** `permissionMode` 设置为 `auto-deny`

**解决方案：**
```yaml
# 编辑 configs/config.yaml
claude:
  permissionMode: "normal"  # 从 auto-deny 更改为 normal
```

## 日志问题

### 问题：日志文件未创建

**症状：** `logs/` 目录为空

**诊断：**
```go
// 检查日志初始化代码
logger.SetLoggerName("ai-bridge")
logger.SetLoggerRootDir("./logs")
```

**解决方案：**
```bash
# 创建日志目录
mkdir logs

# 检查目录权限
icacls logs
```

### 问题：日志级别过高

**症状：** 只看到 INFO 日志，看不到 DEBUG 日志

**解决方案：**
```go
// 在 main.go 中设置调试级别
logger.SetLoggerLevel(logrus.DebugLevel)
```

## 前端问题

### 问题：页面加载失败

**症状：** 空白页或部分内容缺失

**诊断：**
1. 检查浏览器控制台错误
2. 检查网络请求
3. 检查 JavaScript 加载

**解决方案：**
```javascript
// 浏览器控制台 - 检查错误
console.log('Script loaded');

// 检查网络请求
fetch('/api/v1/sessions')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### 问题：UI 不更新

**症状：** 数据更改但页面不更新

**诊断：**
1. 检查 SSE 连接
2. 检查前端事件监听器

**解决方案：**
```javascript
// 检查 SSE 流
const eventSource = new EventSource('/api/v1/sessions/:sessionId/messages/stream?since=0');

eventSource.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('New message:', message);
  // 更新 UI
};

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
};
```

## 集成问题

### 问题：Slash 命令未找到

**症状：**
```
Error: command not found: /ai-bridge-debug
```

**诊断：**
1. 检查命令是否在项目中
2. 检查命令路径

**解决方案：**
```bash
# 检查项目命令
dir .claude\commands

# 检查用户命令
dir %USERPROFILE%\.claude\commands
```

### 问题：HAPI 前端不兼容

**症状：** HAPI 前端显示错误

**诊断：**
1. 检查 API 响应格式
2. 检查 HAPI 版本

**解决方案：**
```bash
# 测试 API 兼容性
curl -H "Content-Type: application/json" \
  -X POST http://localhost:8080/api/v1/sessions \
  -d '{"model":"haiku","workingDir":"C:\\WorkSpace\\project","permissionMode":"normal"}'
```

## 系统问题

### 问题：Windows 路径问题

**症状：** 路径相关的错误

**解决方案：**
```go
// 使用原始字符串避免转义
workingDir := "C:\\WorkSpace\\project"

// 或使用正斜杠（Go 会自动转换）
workingDir := "C:/WorkSpace/project"

// 使用 filepath 包处理路径
path.Join("C:", "WorkSpace", "project")
```

### 问题：文件权限

**症状：** 无法读取或写入文件

**解决方案：**
```bash
# Windows - 检查文件权限
icacls data\ai-bridge.db

# 授予写入权限
icacls data\ai-bridge.db /grant Users:F
```

## 诊断工具

### 健康检查

```bash
# 检查服务器健康状态
curl http://localhost:8080/health

# 预期响应
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "components": {
    "database": "ok",
    "pool": {
      "activeInstances": 2,
      "maxInstances": 5
    }
  }
}
```

### 数据库检查

```bash
# 检查数据库完整性
sqlite3 data\ai-bridge.db "PRAGMA integrity_check;"

# 检查表结构
sqlite3 data\ai-bridge.db ".schema"

# 检查数据库大小
dir data\ai-bridge.db
```

### 进程检查

```bash
# 检查 ai-bridge 进程
tasklist /FI "IMAGENAME eq ai-bridge.exe"

# 检查进程内存
tasklist /FI "IMAGENAME eq ai-bridge.exe" /FO LIST
```

## 获取帮助

如果问题未在此处列出：

1. 检查日志文件：`logs/ai-bridge.log`
2. 启用调试日志并重试
3. 运行健康检查：`GET /health`
4. 查看项目文档：`CLAUDE.md`
5. 使用调试技能：`/ai-bridge-debug`
