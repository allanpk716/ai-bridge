# API Reference

## AI-Bridge HAPI 兼容 API 端点

本文档描述 AI-Bridge 服务器提供的 HAPI 兼容 HTTP API。

## 基础 URL

```
http://localhost:8080/api/v1
```

（根据 `configs/config.yaml` 中的 `server.host` 和 `server.port` 配置）

## 认证

大多数端点需要 Bearer token 认证：

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/api/v1/sessions
```

Token 在 `configs/config.yaml` 的 `auth.cliApiToken` 中配置。

## Session 管理

### 创建 Session

**端点：** `POST /api/v1/sessions`

**请求体：**
```json
{
  "model": "haiku",
  "workingDir": "C:\\WorkSpace\\my-project",
  "permissionMode": "normal"
}
```

**响应：**
```json
{
  "id": "session-uuid",
  "status": "starting",
  "createdAt": "2025-01-15T10:30:00Z",
  "metadata": {
    "model": "haiku",
    "workingDir": "C:\\WorkSpace\\my-project"
  }
}
```

**状态值：**
- `starting` - 正在启动
- `ready` - 就绪
- `busy` - 忙碌
- `stopped` - 已停止
- `error` - 错误

### 获取 Session 信息

**端点：** `GET /api/v1/sessions/:id`

**响应：**
```json
{
  "id": "session-uuid",
  "status": "ready",
  "createdAt": "2025-01-15T10:30:00Z",
  "metadata": {
    "model": "haiku",
    "workingDir": "C:\\WorkSpace\\my-project"
  }
}
```

### 列出 Sessions

**端点：** `GET /api/v1/sessions`

**查询参数：**
- `status` - 过滤状态（可选）
- `limit` - 最大结果数（默认 50）

**响应：**
```json
{
  "sessions": [
    {
      "id": "session-uuid",
      "status": "ready",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

### 删除 Session

**端点：** `DELETE /api/v1/sessions/:id`

**响应：** `204 No Content`

## Message 管理（优化）

### 获取消息（分页和增量同步）

**端点：** `GET /api/v1/sessions/:sessionId/messages`

**查询参数：**
- `since` - 增量同步：获取 seq 大于此值的消息（可选）
- `before` - 历史滚动：获取 seq 小于此值的消息（可选）
- `limit` - 最大消息数（默认 50，最大 100）

**示例：**

```bash
# 获取最近 50 条消息
GET /api/v1/sessions/:sessionId/messages?limit=50

# 增量同步：获取 seq > 100 的消息
GET /api/v1/sessions/:sessionId/messages?since=100

# 历史滚动：获取 seq < 50 的前 50 条消息
GET /api/v1/sessions/:sessionId/messages?before=50&limit=50
```

**响应：**
```json
{
  "messages": [
    {
      "seq": 101,
      "role": "user",
      "content": "Hello",
      "timestamp": "2025-01-15T10:30:00Z"
    },
    {
      "seq": 102,
      "role": "assistant",
      "content": "Hi there!",
      "timestamp": "2025-01-15T10:30:05Z"
    }
  ],
  "hasMore": false,
  "latestSeq": 102
}
```

**重要：**
- 每个消息有单调递增的 `seq` 编号
- 使用 `since` 参数进行增量同步
- 使用 `before` 参数用于历史滚动
- 服务器只保留最近 100 条消息在内存中

### SSE 流（实时更新）

**端点：** `GET /api/v1/sessions/:sessionId/messages/stream`

**查询参数：**
- `since` - 从哪个 seq 开始流式传输（可选）

**示例：**
```bash
curl -N http://localhost:8080/api/v1/sessions/:sessionId/messages/stream?since=100
```

**响应格式：** Server-Sent Events (SSE)
```
data: {"seq":101,"role":"user","content":"Hello","timestamp":"..."}

data: {"seq":102,"role":"assistant","content":"Hi there!","timestamp":"..."}
```

**注意：**
- 连接保持打开以接收实时更新
- 只发送 seq > `since` 的消息
- 客户端应处理重连逻辑

### 发送消息

**端点：** `POST /api/v1/sessions/:sessionId/messages`

**请求体：**
```json
{
  "content": "Help me debug my code",
  "userContext": {
    "userId": "user-123",
    "metadata": {}
  }
}
```

**响应：**
```json
{
  "seq": 103,
  "role": "user",
  "content": "Help me debug my code",
  "timestamp": "2025-01-15T10:31:00Z",
  "status": "queued"
}
```

**状态值：**
- `queued` - 已排队
- `processing` - 处理中
- `completed` - 已完成

## 权限管理

### 获取待处理权限

**端点：** `GET /api/v1/sessions/:sessionId/permissions`

**响应：**
```json
{
  "permissions": [
    {
      "requestId": "req-123",
      "type": "tool_use",
      "toolName": "Bash",
      "description": "Execute command: ls -la",
      "params": {
        "command": "ls -la"
      }
    }
  ]
}
```

### 批准权限

**端点：** `POST /api/v1/sessions/:sessionId/permissions/:requestId/approve`

**请求体：**
```json
{
  "scope": "once"  // 或 "session" 或 "always"
}
```

**Scope 值：**
- `once` - 仅此一次
- `session` - 当前会话
- `always` - 总是批准（慎用）

**响应：** `200 OK`

### 拒绝权限

**端点：** `POST /api/v1/sessions/:sessionId/permissions/:requestId/deny`

**响应：** `200 OK`

## Slash 命令

### 列出命令

**端点：** `GET /api/v1/commands`

**查询参数：**
- `sessionId` - 会话 ID（用于项目命令）

**响应：**
```json
{
  "commands": {
    "builtin": [
      {
        "path": "/help",
        "category": "general",
        "description": "Show help"
      }
    ],
    "user": [],
    "project": [
      {
        "path": "/ai-bridge-debug",
        "category": "debug",
        "description": "Debug AI-Bridge"
      }
    ]
  },
  "byCategory": {
    "general": ["/help"],
    "debug": ["/ai-bridge-debug"]
  }
}
```

### 获取单个命令

**端点：** `GET /api/v1/commands/:path`

**响应：**
```json
{
  "path": "/ai-bridge-debug",
  "category": "debug",
  "description": "Debug AI-Bridge",
  "examples": [
    "/ai-bridge-debug 后端错误",
    "/ai-bridge-debug 前端问题"
  ]
}
```

### 执行命令

**端点：** `POST /api/v1/sessions/:sessionId/commands`

**请求体：**
```json
{
  "command": "/ai-bridge-debug 后端 panic",
  "userContext": {}
}
```

**响应：**
```json
{
  "message": {
    "seq": 104,
    "role": "user",
    "content": "/ai-bridge-debug 后端 panic",
    "timestamp": "2025-01-15T10:32:00Z"
  },
  "status": "processing"
}
```

## 健康检查

### 系统健康

**端点：** `GET /health`

**响应：**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "components": {
    "database": "ok",
    "pool": {
      "activeInstances": 2,
      "maxInstances": 5,
      "idleInstances": 3
    }
  }
}
```

## 错误响应

所有错误遵循此格式：

```json
{
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session not found",
    "details": {}
  }
}
```

**常见错误码：**
- `SESSION_NOT_FOUND` - Session 不存在
- `INVALID_REQUEST` - 请求参数无效
- `UNAUTHORIZED` - 认证失败
- `PERMISSION_DENIED` - 权限不足
- `INTERNAL_ERROR` - 服务器内部错误

## CORS 配置

服务器在响应中包含 CORS 头：

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
```

允许的源在 `configs/config.yaml` 的 `cors.origins` 中配置。
