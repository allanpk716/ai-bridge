# AI-Bridge 调试技能 / Debug Skill

AI-Bridge 项目专用自动化调试技能 - 快速入门指南

## 快速开始 / Quick Start

### 使用技能 / Using the Skill

```
/ai-bridge-debug
```

然后选择要调试的问题类型：
1. 后端错误（Go 代码、日志、数据库）
2. 前端问题（浏览器、WebSocket、UI）
3. API 问题（端点、响应、状态码）
4. 集成问题（前后端通信）
5. 性能问题（响应慢、超时）
6. 其他/描述问题

### 技能特性 / Features

- **智能路由** - 根据问题描述自动选择合适的工作流
- **并行调试** - 同时启动多个代理进行独立调查
- **增量分析** - 只分析新的日志和消息
- **中文支持** - 完整的中文文档和输出
- **项目特定** - 针对 AI-Bridge 架构优化

## 目录结构 / Directory Structure

```
C:\WorkSpace\ai-bridge\.claude\skills\ai-bridge-debug\
├── SKILL.md                          # 智能路由器（主入口）
├── README.md                         # 本文件（快速入门）
├── SETUP.md                          # 安装和配置指南
├── workflows/                        # 调试工作流
│   ├── backend-debug.md             # 后端调试流程
│   ├── frontend-debug.md            # 前端调试流程
│   ├── integration-debug.md         # 集成调试（并行代理）
│   ├── performance-debug.md         # 性能调试流程
│   └── adaptive-debug.md            # 自适应调试流程
├── references/                       # 参考文档
│   ├── architecture.md              # 系统架构
│   ├── backend-debugging.md         # Go 调试指南
│   ├── frontend-testing.md          # 浏览器测试指南
│   ├── api-reference.md             # API 接口参考
│   ├── database-schema.md           # 数据库结构
│   ├── logging-patterns.md          # 日志模式
│   └── troubleshooting.md           # 常见问题排查
├── templates/                        # 报告模板
│   ├── debug-report.md              # 通用调试报告
│   ├── backend-analysis.md          # 后端分析报告
│   ├── frontend-test.md             # 前端测试报告
│   └── performance-report.md        # 性能分析报告
└── scripts/                          # 实用脚本
    ├── check-dependencies.sh        # 依赖检查（Linux/Mac）
    └── check-dependencies.bat       # 依赖检查（Windows）
```

## 常见使用场景 / Common Use Cases

### 场景 1：后端 Panic

```
用户：/ai-bridge-debug
AI-Bridge：选择问题类型...
用户：1（后端错误）
AI-Bridge：启动后端分析器...
[分析日志、定位 panic、提供修复]
```

### 场景 2：前端无法连接

```
用户：/ai-bridge-debug 前端无法连接后端
AI-Bridge：[自动识别为集成问题]
启动并行代理：
- 前端测试器：检查浏览器、WebSocket、CORS
- 后端分析器：检查服务器、配置、日志
[关联发现、定位问题、提供修复]
```

### 场景 3：API 响应慢

```
用户：/ai-bridge-debug API 响应很慢
AI-Bridge：[自动识别为性能问题]
启动所有代理并行分析：
- 后端分析器：数据库查询、进程池
- 前端测试器：页面加载、网络延迟
- API 验证器：端点响应时间
[提供性能优化建议]
```

## 代理类型 / Agent Types

### 后端分析器
- 分析 Go 代码和日志
- 检查数据库状态
- 定位错误和 panic
- 评估性能问题

### 前端测试器
- 使用 dev-browser 技能
- 检查浏览器控制台
- 测试 WebSocket 连接
- 验证 API 调用

### API 验证器
- 使用 curl 测试端点
- 验证响应格式
- 检查 CORS 配置
- 测试认证

### 日志分析器
- 解析 WQGroup/logger 日志
- 搜索错误模式
- 追踪 session 生命周期

## 工作流选择 / Workflow Selection

技能根据问题描述自动选择工作流：

| 用户描述 | 工作流 | 代理 |
|---------|--------|------|
| 后端、Go、数据库、日志 | backend-debug.md | 后端分析器 |
| 前端、浏览器、UI、页面 | frontend-debug.md | 前端测试器 |
| API、端点、404、500 | api-debug.md | 后端分析器 + API 验证器 |
| 集成、通信、CORS、WebSocket | integration-debug.md | 前端测试器 + 后端分析器（并行） |
| 性能、慢、超时、卡顿 | performance-debug.md | 所有代理（并行） |
| 复杂问题、多个症状 | adaptive-debug.md | 动态选择 |

## 诊断输出 / Diagnostic Output

每次调试会话生成结构化报告：

```markdown
## 问题描述
[问题描述]

## 根本原因
[根本原因分析]

## 错误位置
文件：`internal/package/file.go:123`

## 修复方案
### 代码修复
\```go
[修复代码]
\```

### 配置修复
\```yaml
[配置更改]
\```

## 验证步骤
1. [ ] 应用修复
2. [ ] 重启服务器
3. [ ] 测试：[具体操作]
4. [ ] 验证：[预期结果]
```

## 进阶使用 / Advanced Usage

### 自定义调试范围

```
用户：/ai-bridge-debug 检查 internal/pool/ 目录的内存泄漏
AI-Bridge：[自定义范围后端分析]
```

### 组合工作流

```
用户：/ai-bridge-debug 前端 WebSocket 断开，后端日志显示错误
AI-Bridge：[自动识别为集成问题]
使用 integration-debug.md 工作流
```

### 持续调试

```
用户：/ai-bridge-debug 继续上次调试
AI-Bridge：[检查之前的状态]
继续调试...
```

## 故障排查 / Troubleshooting

### 技能未加载

**症状：** `/ai-bridge-debug` 命令不工作

**解决方案：**
1. 检查技能文件存在：`C:\WorkSpace\ai-bridge\.claude\skills\ai-bridge-debug\SKILL.md`
2. 检查斜杠命令存在：`C:\WorkSpace\ai-bridge\.claude\commands\ai-bridge-debug.md`
3. 重启 Claude Code

### 代理启动失败

**症状：** 技能显示代理启动错误

**解决方案：**
1. 检查 Task 工具可用性
2. 验证代理类型有效
3. 检查网络连接

### 前端测试不工作

**症状：** dev-browser 技能无法启动

**解决方案：**
1. 安装 dev-browser 技能
2. 检查浏览器是否运行
3. 验证浏览器版本兼容性

## 最佳实践 / Best Practices

1. **提供详细信息** - 描述问题时包含症状、错误消息、复现步骤
2. **使用正确的工作流** - 让技能自动选择，或明确指定问题类型
3. **检查日志** - 技能会自动检查日志，但你也可以手动查看
4. **验证修复** - 应用修复后，运行验证步骤确保问题解决
5. **记录结果** - 保存调试报告供未来参考

## 获取帮助 / Getting Help

如果技能无法解决问题：

1. 查看 `references/troubleshooting.md` - 常见问题排查
2. 检查日志文件：`logs/ai-bridge.log`
3. 启用调试日志并重试
4. 运行健康检查：`GET /health`
5. 查看项目文档：`CLAUDE.md`

## 更新日志 / Changelog

### v2.0.0（当前版本）
- 重构为模块化结构（workflows/references/templates）
- 添加智能路由器
- 实现并行代理协调
- 增强中文支持
- 添加更多参考文档

### v1.0.0（原始版本）
- 基本调试功能
- 后端和前端测试
- 单一 SKILL.md 文件

## 贡献 / Contributing

要改进此技能：

1. 编辑工作流文件：`workflows/*.md`
2. 添加参考文档：`references/*.md`
3. 创建新模板：`templates/*.md`
4. 更新 SKILL.md 路由表

## 许可证 / License

与 AI-Bridge 项目相同
