# AI-Bridge-Web: 前端验证项目

## What This Is

AI-Bridge-Web 是一个可复用的 PWA(Progressive Web App)前端项目,既可以作为独立站点使用,也可以通过 JavaScript SDK 集成到其他应用中。通过参考 [tiann/hapi](https://github.com/tiann/hapi) 的移动优先设计,提供现代化的 Claude Code CLI 远程控制界面。前端采用 React + Vite + TypeScript 构建,使用 Tailwind CSS + shadcn/ui 实现类似 hapi 的简洁现代 UI,通过 Socket.IO 实现实时消息交互,使用 TanStack Query 管理应用状态。

## Core Value

**可复用性 + 功能完整性 + 性能表现** - AI-Bridge-Web 既是 AI-Bridge 后端的功能验证工具,也是一个可被其他项目集成的通用 Claude Code 交互界面。作为独立站点时验证后端所有 API 端点正常工作;作为嵌入式组件时,提供简单的文本传递接口,外部应用只需传入纯文本内容,Claude Code CLI 自主理解并处理。在 10000+ 消息场景下验证增量同步性能,确保多实例并发流畅。

## Requirements

### Validated

后端已实现的核心功能(通过代码库分析确认):

- ✓ **Claude CLI 包装器** — 进程启动/停止、stdio 通信、JSON 消息解析 (existing)
- ✓ **进程池管理** — 最多 5 个并发实例、LIFO 获取策略、资源清理 (existing)
- ✓ **会话管理** — 会话生命周期(idle/processing/waiting/stopped)、消息订阅、SQLite 持久化 (existing)
- ✓ **增量消息同步** — since/before 分页、seq 序列号、内存仅保留最近 100 条消息 (existing)
- ✓ **HTTP API 层** — 会话 CRUD、消息管理(分页 + SSE 流)、权限审批、斜杠命令 (existing)
- ✓ **斜杠命令发现** — 从 CLI 内置、用户目录(`~/.claude/commands/`)、项目目录(`.claude/commands/`)发现命令 (existing)
- ✓ **健康监控** — 进程健康检查、会话状态监控、系统指标 (existing, 但返回占位数据需修复)
- ✓ **WebSocket 基础** — Socket.IO 兼容服务器框架(现有实现标记为 TODO) (existing)

### Active

前端需要实现的功能(待开发):

- [ ] **PWA 基础能力** — manifest.json、Service Worker、离线缓存、可安装到桌面/手机
- [ ] **会话管理界面** — 创建新会话(指定工作目录、模型)、会话列表(查看所有会话状态)、删除会话、支持多实例并发查看
- [ ] **消息交互界面** — 实时聊天 UI(类似 ChatGPT/hapi)、发送消息、接收流式响应、显示消息历史、增量同步(使用 since 参数)
- [ ] **权限处理界面** — 显示待审批权限(文件读写、命令执行、网络访问)、批准/拒绝权限、显示权限详情
- [ ] **斜杠命令界面** — 命令浏览器(按分类展示内置 + 自定义命令)、命令详情查看、执行命令、显示命令示例
- [ ] **实时通信** — Socket.IO 客户端连接、订阅会话消息、实时接收增量消息、连接状态管理
- [ ] **响应式设计** — 移动优先布局、桌面/平板适配、触摸友好交互
- [ ] **JavaScript SDK** — 提供 npm 包,支持外部应用通过 iframe 嵌入,提供简单文本传递接口(sendMessage(text)),外部应用只需传入纯文本即可与 Claude 交互

### Out of Scope

- [用户认证/授权] — 后端目前使用固定 JWT/API Token,前端暂不需要登录系统
- [多租户支持] — 单用户场景,不需要多用户隔离
- [深色模式] — 暂不实现主题切换,专注核心功能
- [国际化] — 仅中文界面,暂不支持多语言
- [离线消息队列] — PWA 缓存静态资源,但消息需要实时连接
- [语音控制] — hapi 支持语音输入,但不在本次验证范围

## Context

**技术栈选择依据:**

- **React + Vite + TypeScript** — Vite 提供最快的开发体验,TypeScript 保证类型安全,React 生态成熟
- **Tailwind CSS + shadcn/ui** — shadcn/ui 是现代设计系统,基于 Radix UI + Tailwind,组件质量高且可定制性强,符合 hapi 的简洁风格
- **TanStack Query (React Query)** — 专为服务端状态设计,自动处理缓存、重试、刷新,适合 HTTP API 交互
- **Socket.IO Client** — 后端已支持 Socket.IO 协议,使用官方客户端确保兼容性

**后端 API 现状(来自代码库分析):**

- **已实现端点** — `/api/v1/sessions` (CRUD), `/api/v1/sessions/:id/messages` (分页 + 流), `/api/v1/sessions/:id/permissions/:id/approve|deny`, `/api/v1/commands` (列表 + 执行)
- **已知问题** — WebSocket Origin 检查被跳过(安全风险),健康检查返回占位数据,会话创建时 WorkingDir/Model 字段为空
- **性能优化** — 增量消息同步(内存 100 条 + 数据库持久化),进程池复用(最多 5 个),SQLite WAL 模式

**设计参考 — hapi 项目:**

- **UI 风格** — 移动优先、简洁现代、卡片式布局、底部操作按钮
- **交互模式** — 左侧会话列表(桌面)/抽屉式(移动),右侧聊天区域,底部输入框
- **PWA 特性** — 可安装、离线缓存、推送通知(可选)

**验证目标:**

1. **功能完整性** — 每个后端 API 都要通过前端测试,确认可以正常创建会话、发送消息、处理权限、执行命令
2. **可复用性** — 作为独立站点运行,同时提供 SDK 供外部应用集成,支持动态上下文注入
3. **性能表现** — 在 10000+ 消息会话中验证增量同步不卡顿,前端滚动流畅,内存占用合理
4. **多实例并发** — 同时打开多个会话,验证进程池调度、消息隔离、实时通信稳定性

## Constraints

- **时间**: 希望快速验证,不需要过度设计,专注核心功能
- **技术栈**: 前端必须使用 React + Vite + TypeScript + Tailwind + shadcn/ui + TanStack Query + Socket.IO
- **后端兼容**: 前端必须适配 AI-Bridge 现有 API(HAPI 兼容协议),不能修改后端接口
- **测试环境**: 后端使用测试配置(JWT/API Token 为固定值),前端连接 `http://localhost:8080`
- **CORS**: 后端配置允许前端来源(需在 `configs/config.yaml` 中添加前端开发服务器地址)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 使用 shadcn/ui 而非 MUI/Ant Design | shadcn/ui 基于 Radix UI,组件质量高,完全可定制,符合现代设计趋势 | — Pending |
| Socket.IO 而非原生 SSE | 后端已支持 Socket.IO 协议,官方客户端更稳定,支持双向通信 | — Pending |
| TanStack Query 而非 Redux/Zustand | TanStack Query 专为服务端状态设计,自动缓存/重试,减少样板代码 | — Pending |
| 并行开发而非先测试后端 | 边做前端边发现问题,更快迭代,前端本身就是最好的后端测试工具 | — Pending |
| 不实现深色模式/国际化 | 非核心功能,优先验证后端能力,保持开发速度 | — Pending |

---
*Last updated: 2026-02-06 after initialization*
