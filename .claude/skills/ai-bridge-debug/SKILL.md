---
name: ai-bridge-debug
description: AI-Bridge 项目专用自动化调试技能 - 协调后端 Go 调试和前端浏览器测试，使用并行子代理快速定位问题
---

<essential_principles>
## AI-Bridge 调试技能工作原理

本技能通过协调多个专业代理，为 AI-Bridge 项目提供自动化调试。

### 核心原则
1. **并行执行** - 尽可能同时启动多个子代理
2. **最小提问** - 立即开始调试，仅在必要时提问
3. **完整上下文** - 调试前始终读取项目结构
4. **会话作用域** - 调试状态仅在当前会话内持久化
5. **Windows 原生** - 项目在 Windows 上运行 - 路径使用反斜杠，BAT 脚本

### 调试工作流
1. 理解问题（从用户描述或症状）
2. 为独立调查路径启动并行子代理
3. 关联来自不同来源的发现
4. 提供可操作的诊断和解决方案

### 代理类型
- **后端分析器** - Go 代码、日志、API 端点、数据库
- **前端测试器** - 浏览器自动化、WebSocket、API 调用
- **日志分析器** - 使用 WQGroup/logger 模式解析 Go 日志
- **API 验证器** - 使用 curl 测试 HTTP 端点

### 何时使用每个代理
- "后端错误" → 后端分析器
- "前端不工作" → 前端测试器
- "API 返回错误数据" → 后端分析器 + API 验证器
- "WebSocket 问题" → 前端测试器 + 后端分析器
- "性能问题" → 所有代理
- "未知问题" → 并行启动所有代理
</essential_principles>

<intake>
今天想要调试什么问题？

**常见问题：**
1. 后端错误（Go 代码、日志、数据库）
2. 前端问题（浏览器、WebSocket、UI）
3. API 问题（端点、响应、状态码）
4. 集成问题（前后端通信）
5. 性能问题（响应慢、超时）
6. 其他/描述问题

**等待用户响应后再路由。**
</intake>

<routing>
| 用户响应 | 代理策略 | 工作流 |
|---------|---------|--------|
| 1, "后端", "go", "数据库" | 后端分析器 | workflows/backend-debug.md |
| 2, "前端", "浏览器", "ui" | 前端测试器 | workflows/frontend-debug.md |
| 3, "api", "端点" | 后端分析器 + API 验证器 | workflows/api-debug.md |
| 4, "集成", "通信" | 前端测试器 + 后端分析器（并行） | workflows/integration-debug.md |
| 5, "性能", "慢", "超时" | 所有代理（并行） | workflows/performance-debug.md |
| 6, "其他" 或详细描述 | 从上下文自动检测 | workflows/adaptive-debug.md |

**基于意图的路由：**
- "日志错误", "panic", "崩溃" → backend-debug.md
- "浏览器控制台", "页面无法加载", "WebSocket 断开" → frontend-debug.md
- "API 返回 500", "错误响应", "端点未找到" → api-debug.md
- "前端无法连接", "CORS 错误", "WebSocket 失败" → integration-debug.md
- "慢", "超时", "高内存" → performance-debug.md
- 有多个症状的复杂问题 → adaptive-debug.md
</routing>

<reference_index>
## 领域知识

全部在 `references/` 目录中：

**架构：** architecture.md - AI-Bridge 系统概览
**后端：** backend-debugging.md - Go 调试模式、日志分析
**前端：** frontend-testing.md - dev-browser 技能使用
**API：** api-reference.md - HAPI 兼容端点
**数据库：** database-schema.md - SQLite 结构和查询
**日志：** logging-patterns.md - WQGroup/logger 使用
**故障排查：** troubleshooting.md - 常见问题解决方案
</reference_index>

<workflows_index>
## 调试工作流

全部在 `workflows/` 目录中：

| 工作流 | 用途 | 使用的代理 |
|--------|------|-----------|
| backend-debug.md | Go 代码、日志、数据库问题 | 后端分析器、日志分析器 |
| frontend-debug.md | 浏览器、WebSocket、UI 问题 | 前端测试器 |
| api-debug.md | HTTP 端点测试 | 后端分析器、API 验证器 |
| integration-debug.md | 前后端通信 | 前端测试器 + 后端分析器（并行） |
| performance-debug.md | 响应慢、超时 | 所有代理（并行） |
| adaptive-debug.md | 未知问题、自动检测 | 基于症状动态选择 |
</workflows_index>

<quick_start>
**快速调试（最常见）：**

1. 后端错误：读取日志、分析堆栈跟踪、找到根本原因
2. 前端问题：打开浏览器、检查控制台、测试 WebSocket
3. API 问题：测试端点、验证响应、检查后端处理器

**完整调试：**
描述问题 → 技能启动相应的代理 → 提供诊断
</quick_start>

<objective>
通过协调并行子代理进行后端 Go 分析、前端浏览器测试和 API 验证，调试 AI-Bridge 应用程序问题，提供可操作的诊断和解决方案。
</objective>

<success_criteria>
调试会话成功标准：
- 确定了根本原因，包含具体的 file:line 引用
- 记录了重现步骤
- 提供了解决方案，包含代码更改或配置更新
- 包含验证步骤以确认修复
</success_criteria>

<troubleshooting>
**常见问题：**

**子代理无法启动：**
- 检查 Task 工具是否可用
- 验证代理类型有效（general-purpose、feature-dev 等）

**浏览器自动化不工作：**
- 确保 dev-browser 技能已安装
- 检查浏览器是否正在运行且可访问

**找不到日志文件：**
- 验证 logger.SetLoggerRootDir() 路径
- 检查日志目录是否存在

**数据库被锁定：**
- 停止 ai-bridge 服务器
- 检查打开的连接
</troubleshooting>
