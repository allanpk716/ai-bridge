---
category: debug
description: AI-Bridge 项目专用调试技能 - 支持后端 Go 日志分析和前端浏览器调试
examples:
  - /ai-bridge-debug 前端无法连接到后端
  - /ai-bridge-debug WebSocket 连接断开
  - /ai-bridge-debug 会话创建失败
  - /ai-bridge-debug 前端页面显示异常
---

# AI-Bridge 项目调试技能

AI-Bridge 是一个 Go 中间件项目，提供 Claude Code CLI 的远程 HTTP/WebSocket 访问。本技能提供全方位的调试支持。

## 项目架构

```
AI-Bridge (Go 后端)
├── internal/claude/     - Claude Code CLI 包装器
├── internal/pool/       - 进程池管理
├── internal/session/    - 会话管理（增量同步优化）
├── internal/api/        - HTTP API 层 (HAPI 兼容)
├── internal/websocket/  - WebSocket (Socket.IO)
├── internal/commands/   - 斜杠命令支持
└── logs/                - 后端日志目录

Web App (前端)
├── web/src/lib/socket/  - Socket.IO 客户端
├── web/src/pages/       - 页面组件
└── web/src/hooks/       - React Hooks
```

## 技能特性

### 1. 后端日志分析
- 读取 `./logs/` 目录下的日志文件
- 使用 `github.com/WQGroup/logger` 库生成的日志
- 日志文件按日期轮转（24 小时）
- 支持按时间、级别、关键词过滤
- 分析错误堆栈和请求链路

### 2. 前端浏览器调试
- 使用 `dev-browser` 技能进行真实浏览器测试
- 测试 HTTP API 调用
- 测试 WebSocket 连接
- 验证前端交互流程
- 检查网络请求和响应

### 3. 多 Subagent 并行调试
根据调试需求自动启动多个专用 subagent：
- **后端日志分析 agent** - 读取和分析 Go 日志
- **前端浏览器 agent** - 使用 dev-browser 测试
- **代码审查 agent** - 检查相关代码逻辑
- **API 测试 agent** - 测试接口响应

### 4. 上下文传递
- 自动收集错误上下文（日志片段、代码位置、请求参数）
- 将上下文传递给各个 subagent
- 汇总多个 agent 的分析结果
- 提供综合调试建议

## 使用方法

### 基本用法
```
/ai-bridge-debug <问题描述>
```

### 示例场景

#### 1. 前后端连接问题
```
/ai-bridge-debug 前端无法连接到后端 WebSocket
```

调试流程：
1. 后端 agent 检查 `logs/ai-bridge*.log` 中的启动日志和错误
2. 前端 agent 使用 dev-browser 打开前端页面
3. 检查浏览器控制台的 WebSocket 连接状态
4. 验证 CORS 配置和端口设置

#### 2. API 请求失败
```
/ai-bridge-debug 创建会话接口返回 500 错误
```

调试流程：
1. 后端 agent 查找最近的 ERROR 日志
2. 分析请求参数和错误堆栈
3. 前端 agent 使用 dev-browser 重现请求
4. 检查 `internal/api/handlers/session.go` 相关代码

#### 3. WebSocket 消息丢失
```
/ai-bridge-debug 前端没有收到实时消息更新
```

调试流程：
1. 后端 agent 检查 WebSocket 消息发送日志
2. 前端 agent 监听浏览器 WebSocket 事件
3. 验证 SSE 订阅参数 (`since`, `limit`)
4. 检查 `internal/websocket/` 和 `web/src/lib/socket/` 代码

#### 4. 前端页面异常
```
/ai-bridge-debug 会话列表页面不显示数据
```

调试流程：
1. 前端 agent 使用 dev-browser 打开会话列表页
2. 检查网络请求和响应
3. 查看 React 组件状态和控制台错误
4. 后端 agent 验证 API 数据返回

## 技能配置

### 后端日志配置
- **日志位置**: `./logs/`
- **日志文件名**: `ai-bridge-YYYY-MM-DD.log`
- **日志级别**: Debug, Info, Warn, Error
- **日志格式**: JSON 格式（支持结构化查询）

### 前端调试配置
- **前端地址**: `http://localhost:3000` (Vite dev server)
- **后端地址**: `http://localhost:8080`
- **浏览器**: Chrome/Edge (使用 dev-browser 技能)
- **Socket.IO 版本**: `4.8.3`

### 关键文件位置
- **后端主入口**: `cmd/ai-bridge/main.go`
- **API 处理器**: `internal/api/handlers/`
- **会话管理**: `internal/session/`
- **WebSocket**: `internal/websocket/`
- **前端 Socket 客户端**: `web/src/lib/socket/hooks.ts`
- **前端 API**: `web/src/lib/api/`

## 调试输出格式

### 问题分析报告
```
## 问题描述
[用户提供的问题摘要]

## 后端日志分析
- 最近错误: [错误信息]
- 相关日志片段:
  ```
  [日志内容]
  ```
- 分析: [错误原因分析]

## 前端测试结果
- 浏览器状态: [连接状态/错误信息]
- 网络请求: [请求/响应详情]
- 控制台错误: [JavaScript 错误]

## 根本原因
[综合后端和前端分析的结论]

## 修复建议
1. [具体修复步骤]
2. [代码位置]
3. [验证方法]

## 验证步骤
[使用 dev-browser 验证修复的步骤]
```

## 最佳实践

### 1. 提供清晰的错误描述
- 什么操作触发了问题？
- 预期结果 vs 实际结果
- 复现步骤（如果已知）

### 2. 包含上下文信息
- 用户操作的时间点
- 相关的会话 ID 或消息 ID
- 浏览器和版本信息

### 3. 调试后的验证
- 使用 dev-browser 重新测试修复后的功能
- 检查日志确认没有新错误
- 验证相关功能未被破坏

## 常见问题快速诊断

### WebSocket 连接失败
- 检查 `logs/` 中的 WebSocket 服务器启动日志
- 验证 `configs/config.yaml` 中的 `server.port` 和 `publicUrl`
- 使用 dev-browser 检查前端连接的 URL

### API 返回 404
- 后端 agent 检查路由注册日志
- 验证请求路径是否匹配 API 定义
- 检查 `internal/api/server.go` 中的路由配置

### 前端数据不更新
- 后端 agent 检查消息发送日志
- 前端 agent 使用 dev-browser 检查 WebSocket 订阅
- 验证 `seq` 号和增量同步参数

### 性能问题
- 分析日志中的请求耗时
- 检查 `performance.maxRecentMessages` 配置
- 使用浏览器性能分析器检查前端渲染

## 注意事项

1. **日志文件大小**: 日志文件可能很大，使用 `tail` 或关键词搜索
2. **实时日志**: 调试时可以实时监控 `tail -f logs/ai-bridge-*.log`
3. **浏览器权限**: dev-browser 需要真实的浏览器环境
4. **并发调试**: 多个 subagent 可以并行运行不同方面的调试
5. **隐私信息**: 日志可能包含敏感数据，注意过滤

## 相关技能

- `debug` - 通用调试技能
- `dev-browser` - 浏览器自动化技能
- `superpowers:systematic-debugging` - 系统化调试方法

## 版本信息

- **技能版本**: 1.0.0
- **适用项目**: AI-Bridge
- **后端**: Go 1.x
- **前端**: React 19 + Vite + Socket.IO Client
- **日志库**: github.com/WQGroup/logger
