---
name: ai-bridge-debug
category: debug
description: AI-Bridge 项目专用调试技能 - 自动管理服务并诊断问题
examples:
  - /ai-bridge-debug test SDK integration
  - /ai-bridge-debug backend connection failed
  - /ai-bridge-debug WebSocket disconnected
  - /ai-bridge-debug frontend not loading
---

# AI-Bridge Debugging Skill

AI-Bridge 项目专用自动化调试技能 - 自动管理服务并诊断问题。

## 快速开始

```
/ai-bridge-debug <问题描述>
```

或者选择常见问题类型：

1. **后端错误** - Go 代码、日志、数据库问题
2. **前端问题** - 浏览器、WebSocket、UI 问题
3. **API 问题** - 端点、响应、状态码问题
4. **集成问题** - 前后端通信、CORS、连接
5. **性能问题** - 响应慢、超时、卡顿
6. **SDK 测试** - 完整的 SDK 集成测试流程

## 技能功能

本技能会自动执行以下操作：

1. **检查服务状态** - 验证后端和前端服务是否运行
2. **启动必要服务** - 如需要，自动启动后端服务
3. **分析日志** - 读取并分析后端 Go 日志
4. **浏览器测试** - 使用 dev-browser 技能测试前端
5. **提供诊断报告** - 包含问题根本原因和修复建议

## 工作流程

### 第一步：预检查
- 验证项目目录结构
- 检查配置文件存在性
- 检查服务状态

### 第二步：服务管理
运行服务检查脚本：
```batch
.claude\skills\ai-bridge-debug\scripts\check-services.bat
```

如果后端未运行，自动启动：
```batch
.claude\skills\ai-bridge-debug\scripts\start-backend.bat
```

运行健康检查验证：
```batch
.claude\skills\ai-bridge-debug\scripts\health-check.bat
```

### 第三步：问题分类

根据用户描述选择相应的工作流：
- "后端"、"Go"、"数据库"、"日志" → `workflows/backend-debug.md`
- "前端"、"浏览器"、"UI"、"页面" → `workflows/frontend-debug.md`
- "API"、"端点"、"404"、"500" → `workflows/api-debug.md`
- "集成"、"通信"、"CORS"、"WebSocket" → `workflows/integration-debug.md`
- "性能"、"慢"、"超时"、"卡顿" → `workflows/performance-debug.md`
- "SDK" → `workflows/sdk-test.md`
- 复杂问题或未知 → `workflows/adaptive-debug.md`

### 第四步：并行诊断

根据选择的工作流，启动相应的 Agent：
- **后端日志分析 Agent** - 搜索最近的 ERROR/FATAL 日志
- **前端浏览器测试 Agent** - 使用 dev-browser 技能打开浏览器测试
- **WebSocket 诊断 Agent** - 测试 Socket.IO 握手和连接
- **API 验证 Agent** - 使用 curl 测试 HTTP 端点

### 第五步：结果聚合

- 收集所有 Agent 的输出
- 关联分析（日志错误 + 前端错误）
- 生成诊断报告

### 第六步：修复建议

- 提供具体修复步骤
- 包含代码位置（file:line）
- 验证步骤（使用 dev-browser）

## 可用脚本

技能目录包含以下实用脚本：

### 服务管理
- `scripts/check-services.bat` - 检查前后端服务状态
- `scripts/start-backend.bat` - 启动后端服务
- `scripts/stop-backend.bat` - 停止后端服务
- `scripts/health-check.bat` - 健康检查

### 诊断工具
- `scripts/analyze-logs.bat` - 分析后端日志
- `scripts/check-dependencies.bat` - 检查依赖

## 常见使用场景

### 场景 1：SDK 测试

```
/ai-bridge-debug test SDK
```

技能会：
1. 检查并启动后端服务
2. 验证前端服务运行
3. 使用 dev-browser 打开测试页面
4. 验证 SDK 连接和功能
5. 提供测试报告

### 场景 2：后端错误

```
/ai-bridge-debug 后端 panic 了
```

技能会：
1. 运行 `analyze-logs.bat`
2. 分析堆栈跟踪
3. 定位源代码位置
4. 提供修复建议

### 场景 3：前端无法连接

```
/ai-bridge-debug 前端无法连接后端
```

技能会：
1. 检查服务状态
2. 测试 WebSocket 连接
3. 验证 CORS 配置
4. 检查网络请求

## 诊断报告格式

```markdown
## 问题描述
[用户提供的问题摘要]

## 服务状态
- 后端: ✅ 运行中 / ❌ 停止
- 前端: ✅ 运行中 / ❌ 停止
- 健康检查: ✅ 通过 / ❌ 失败

## 后端日志分析
- 最近错误: [错误信息]
- 相关日志:
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
```

## 注意事项

1. **Windows 环境** - 本项目在 Windows 上运行，所有脚本都是 BAT 格式
2. **CGO 依赖** - SQLite 需要启用 CGO（已自动处理）
3. **端口占用** - 确保 8080 和 3000 端口未被占用
4. **浏览器要求** - dev-browser 技能需要真实浏览器环境

## 相关文件

- **主技能文件**: `.claude/skills/ai-bridge-debug.md`（本文件）
- **工作流目录**: `.claude/skills/ai-bridge-debug/workflows/`
- **脚本目录**: `.claude/skills/ai-bridge-debug/scripts/`
- **参考文档**: `.claude/skills/ai-bridge-debug/references/`
- **项目规范**: `CLAUDE.md`

## 帮助和故障排查

如果技能无法解决问题：

1. 查看 `references/troubleshooting.md` - 常见问题排查
2. 检查日志文件：`logs/ai-bridge-*.log`
3. 运行健康检查：`scripts/health-check.bat`
4. 查看项目文档：`CLAUDE.md`

## 版本信息

- **技能版本**: 2.0.0
- **适用项目**: AI-Bridge
- **后端**: Go 1.x
- **前端**: React 19 + Vite + Socket.IO Client
- **日志库**: github.com/WQGroup/logger
