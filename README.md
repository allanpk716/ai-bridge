# AI-Bridge

轻量级 Go 中间件,通过 HTTP/WebSocket API 提供对 Claude Code CLI 的远程访问。

## 项目简介

AI-Bridge 是一个专注于 Claude Code CLI 的中间件,提供:

- ✅ HAPI 兼容的 API
- ✅ 高性能(支持 10,000+ 消息会话)
- ✅ 增量消息同步优化
- ✅ 完整的 Slash 命令支持

## 快速开始

### 前置要求

- Go 1.21+
- Claude Code CLI(已认证)

### 安装

```bash
# 克隆仓库
git clone https://github.com/your-org/ai-bridge.git
cd ai-bridge

# 复制配置文件
cp configs/config.yaml.example configs/config.yaml

# 编辑配置(设置 JWT_SECRET 和 CLI_API_TOKEN)
# 编辑 configs/config.yaml

# 构建
make build

# 运行
./ai-bridge.exe server --config configs/config.yaml
```

### Docker 部署

```bash
cd deployments/docker
docker-compose up
```

## 架构概述

```
Web App (HAPI frontend or custom)
    ↓ HTTP/WebSocket (HAPI-compatible API)
AI-Bridge Server
    ├─ HTTP API Layer (sessions, messages, permissions, slash commands)
    ├─ WebSocket Layer (Socket.IO)
    └─ Claude Code Manager (process pool, session lifecycle, message parsing)
    ↓ exec/stdio
Claude Code CLI Instances
```

## 开发指南

### 项目结构

- `internal/claude/` - Claude Code CLI wrapper
- `internal/pool/` - 进程池管理
- `internal/session/` - 会话管理(增量同步优化)
- `internal/api/` - HTTP API handlers
- `internal/commands/` - Slash 命令支持
- `pkg/protocol/` - HAPI 兼容协议类型

### 测试

```bash
make test-all         # 运行所有测试
make test-unit        # 单元测试
make test-integration # 集成测试
make test-e2e         # E2E 测试(需要 Claude CLI)
```

详细开发指南请参阅 [CLAUDE.md](./CLAUDE.md)。

## API 文档

### Session Management

- `POST /api/v1/sessions` - 创建会话
- `GET /api/v1/sessions/:id` - 获取会话信息
- `GET /api/v1/sessions` - 列出所有会话

### Message Management(优化)

- `GET /api/v1/sessions/:sessionId/messages?since=123&limit=50&before=456` - 分页消息
  - `since` - 增量同步(获取此 seq 之后的消息)
  - `before` - 历史滚动(获取此 seq 之前的消息)
  - `limit` - 最大消息数(默认 50,最大 100)
- `GET /api/v1/sessions/:sessionId/messages/stream?since=123` - SSE 流
- `POST /api/v1/sessions/:sessionId/messages` - 发送消息

### Permissions

- `POST /api/v1/sessions/:sessionId/permissions/:requestId/approve` - 批准权限
- `POST /api/v1/sessions/:sessionId/permissions/:requestId/deny` - 拒绝权限

### Slash Commands

- `GET /api/v1/commands?sessionId=:id` - 列出所有命令
- `GET /api/v1/commands/:path` - 获取单个命令
- `POST /api/v1/sessions/:sessionId/commands` - 执行命令

## 健康检查

```bash
curl http://localhost:8080/health
```

响应:

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "components": {
    "database": "ok",
    "pool": "ok"
  }
}
```

## 配置

主要配置项(`configs/config.yaml`):

```yaml
server:
  host: "0.0.0.0"
  port: 8080
  publicUrl: "http://localhost:8080"

pool:
  maxInstances: 5
  idleTimeout: 300s

claude:
  defaultModel: "haiku"
  timeout: 300s
  permissionMode: "normal"

performance:
  maxRecentMessages: 100    # 内存中只保留 100 条消息
  messageBufferSize: 50
```

完整配置示例请参阅 `configs/config.yaml.example`。

## 性能优化

AI-Bridge 针对大容量会话进行了优化:

- **增量消息同步**: 只传输新增消息
- **分页查询**: 支持历史消息滚动
- **内存管理**: 只保留最近 100 条消息在内存中
- **SSE 流式传输**: 实时推送新消息

## 故障排查

### Claude CLI 问题

- **命令未找到**: 确保 Claude CLI 在 PATH 中
- **认证错误**: 运行 `claude auth login`
- **超时**: 增加 `claude.timeout` 配置

### 性能问题

- **高内存**: 检查 `maxRecentMessages` 设置
- **消息延迟**: 检查 WebSocket 连接和数据库索引
- **进程池满**: 增加 `pool.maxInstances`

## 贡献

欢迎提交 Issue 和 Pull Request!

## 许可证

MIT License

## 相关资源

- [CLAUDE.md](./CLAUDE.md) - Claude Code 开发指南
- [docs/](./docs/) - 详细设计和计划文档
- [deployments/docker/](./deployments/docker/) - Docker 部署配置
