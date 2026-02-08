# AI-Bridge 架构参考 / Architecture Reference

## 系统概览 / System Overview

AI-Bridge 是一个 Go 中间件，通过 HTTP/WebSocket API 提供对 Claude Code CLI 的远程访问。

```
Web 应用（HAPI 前端或自定义）
    ↓ HTTP/WebSocket (HAPI 兼容 API)
AI-Bridge 服务器
    ├─ HTTP API 层（sessions、messages、permissions、slash commands）
    ├─ WebSocket 层（Socket.IO）
    └─ Claude Code 管理器（进程池、session 生命周期、消息解析）
    ↓ exec/stdio
Claude Code CLI 实例（在进程池中管理）
```

## 核心组件 / Core Components

### `internal/claude/` - Claude Code CLI 包装器
- `process.go` - 进程管理（启动/停止，通过 stdio 通信）
- `session.go` - Session 包装器
- `message.go` - 消息解析（Claude 的 JSON 输出）
- `permission.go` - 权限处理
- `config.go` - 配置

### `internal/pool/` - 进程池管理
- `pool.go` - 池结构
- `instance.go` - 实例管理

### `internal/session/` - Session 管理
- `manager.go` - Session 生命周期
- `session.go` - Session 结构（带增量同步优化）
- `store.go` - SQLite 持久化

### `internal/commands/` - Slash 命令支持
- `discover.go` - 命令发现（builtin、user、project）
- `parser.go` - 命令解析
- `commands.go` - 命令结构

### `internal/api/` - HTTP API（HAPI 兼容）
- `handlers/session.go` - Session CRUD
- `handlers/message.go` - 消息管理（分页）
- `handlers/permission.go` - 权限批准/拒绝
- `handlers/command.go` - Slash 命令 API

### `internal/websocket/` - WebSocket（Socket.IO 兼容）

## 关键设计模式 / Key Design Patterns

### 增量消息同步 / Incremental Message Sync

这是 AI-Bridge 最重要的性能优化模式。

**问题：** 在有 10,000+ 消息的 session 中，发送完整历史会导致：
- 网络延迟（传输整个历史）
- 前端渲染延迟（1000+ DOM 节点）
- 高内存使用（服务器在 RAM 中保留所有消息）
- 慢数据库查询

**解决方案：** 增量同步与分页

**关键特性：**
1. **单调递增 seq 编号** - 每个消息有唯一递增的 `seq` 号
2. **内存限制** - 服务器只保留最近 100 条消息在内存中
3. **数据库持久化** - 所有历史存储在 SQLite 中
4. **增量同步** - API 支持 `?since=123` 获取新消息
5. **历史滚动** - API 支持 `?before=456&limit=50` 滚动历史
6. **SSE 流** - 实时增量更新

**消息流程示例：**
```
1. 客户端请求最近 50 条消息: GET /messages?limit=50
2. 客户端订阅 SSE: GET /messages/stream?since=50
3. 服务器只推送 seq > 50 的消息
4. 历史滚动: GET /messages?before=1&limit=50
```

### 进程池模式 / Process Pool Pattern

**目的：** 限制并发 Claude CLI 实例数量

**配置：**
```yaml
pool:
  maxInstances: 5      # 最大实例数
  idleTimeout: 300s    # 空闲超时
```

**工作原理：**
1. Session 创建时从池中获取实例
2. Session 结束后实例返回池中
3. 空闲实例在超时后被清理

### 消息订阅模式 / Message Subscription Pattern

**目的：** 实时推送消息到前端

**实现：**
```go
// 客户端订阅消息
filter := session.MessageFilter{
    SinceSeq: 100,  // 只接收 seq > 100 的消息
}
msgChan, unsubscribe := sess.Subscribe(ctx, filter)
defer unsubscribe()

for msg := range msgChan {
    // 处理增量消息
}
```

## 配置 / Configuration

`configs/config.yaml` 配置说明：

```yaml
server:
  host: "0.0.0.0"              # HTTP 服务器绑定地址
  port: 8080                   # HTTP 服务器端口
  publicUrl: "http://localhost:8080"  # 公开 URL（用于生成链接）

cors:
  origins:
    - "http://localhost:3000"  # 允许的前端源
    - "https://app.hapi.run"   # HAPI 前端

database:
  path: "./data/ai-bridge.db"  # SQLite 数据库文件路径

auth:
  jwtSecret: "${JWT_SECRET}"   # JWT 密钥
  cliApiToken: "${CLI_API_TOKEN}"  # CLI API 令牌

pool:
  maxInstances: 5              # 最大 Claude CLI 进程数
  idleTimeout: 300s            # 空闲实例超时

claude:
  defaultModel: "haiku"        # 默认模型
  timeout: 300s                # 进程超时
  permissionMode: "normal"     # 权限模式（normal、auto-deny）

# 性能优化
performance:
  maxRecentMessages: 100       # 内存中保留的消息数
  messageBufferSize: 50        # 消息缓冲区大小
  subscriberBufferSize: 50     # 订阅者缓冲区大小
```

## 数据流 / Data Flow

### 创建 Session 流程
```
1. POST /api/v1/sessions
   ↓
2. 创建 Session 记录（数据库）
   ↓
3. 从进程池获取/创建 Claude CLI 进程
   ↓
4. 返回 session ID 和状态
```

### 发送消息流程
```
1. POST /api/v1/sessions/:id/messages
   ↓
2. 保存消息到数据库（分配 seq）
   ↓
3. 发送消息到 Claude CLI 进程（stdio）
   ↓
4. 解析 Claude JSON 输出
   ↓
5. 保存响应消息到数据库
   ↓
6. 推送到 SSE 订阅者
   ↓
7. 返回响应
```

### 权限处理流程
```
1. Claude CLI 请求权限（JSON 输出）
   ↓
2. 解析权限请求
   ↓
3. 保存到数据库（状态：pending）
   ↓
4. 通知前端（SSE 或轮询）
   ↓
5. 用户批准/拒绝（POST /permissions/:id/approve 或 /deny）
   ↓
6. 发送响应到 Claude CLI（stdio）
   ↓
7. 继续执行
```

## 测试命令 / Testing Commands

### 构建项目 / Build
```bash
# Windows
go build -o ai-bridge.exe ./cmd/ai-bridge
```

### 运行服务器 / Run Server
```bash
# Windows
.\ai-bridge.exe server --config configs\config.yaml
```

### 测试 API / Test API
```bash
# 健康检查
curl http://localhost:8080/health

# 列出 sessions
curl http://localhost:8080/api/v1/sessions

# 创建 session
curl -X POST -H "Content-Type: application/json" \
  -d '{"model": "haiku", "workingDir": "C:\\WorkSpace\\project"}' \
  http://localhost:8080/api/v1/sessions
```

## 关键文件位置 / Key File Locations

```
C:\WorkSpace\ai-bridge\
├── cmd\ai-bridge\main.go          # 入口点
├── configs\config.yaml            # 配置文件
├── data\ai-bridge.db              # SQLite 数据库
├── logs\ai-bridge.YYYYMMDD.log    # 日志文件
├── internal\
│   ├── claude\                    # Claude CLI 包装器
│   ├── pool\                      # 进程池
│   ├── session\                   # Session 管理
│   ├── commands\                  # Slash 命令
│   ├── api\                       # HTTP 处理器
│   └── websocket\                 # WebSocket 处理
└── pkg\protocol\                  # HAPI 协议类型
```

## 性能考虑 / Performance Considerations

### 内存管理
- 只保留 100 条最近消息在内存中
- 旧消息卸载到 SQLite 数据库
- 使用有界通道（buffer size 从配置）

### 数据库查询
- 在 `(session_id, seq)` 上使用索引
- 使用 LIMIT 的分页查询
- 考虑连接池

### 并发
- 进程池限制并发实例
- 对共享状态使用互斥锁
- 订阅者管理是线程安全的

## 常见问题 / Common Issues

### 启动失败
- 检查端口占用：`netstat -ano | findstr :8080`
- 检查数据库目录权限
- 验证配置文件语法

### 连接问题
- 验证 CORS 配置
- 检查防火墙设置
- 确认服务器正在运行

### 性能问题
- 增加 `maxRecentMessages` 减少
- 检查数据库索引
- 监控进程池使用情况
