# Integration Debug Workflow

<required_reading>
**开始前阅读这些参考文件：**
1. references/architecture.md - 系统概览和数据流
2. references/backend-debugging.md - 后端调试
3. references/frontend-testing.md - 浏览器测试模式
</required_reading>

<process>
## 第一步：理解集成问题

询问用户详细信息：
- 什么不工作（WebSocket、API 调用、数据同步）？
- 前端和后端的症状
- 何时开始（首次、更改后）

## 第二步：启动并行子代理

**重要提示：使用单条消息中的多个 Task 工具调用并行启动两个代理。**

### 代理 1：前端测试器（dev-browser）

```
使用 dev-browser 技能测试 AI-Bridge 前端。

后端 URL: http://localhost:8080（或配置的端口）

调查内容：
1. 导航到前端 URL
2. 检查浏览器控制台错误
3. 检查 WebSocket 连接状态
4. 监控网络请求（API 调用、WebSocket 帧）
5. 测试失败的用户交互
6. 检查 CORS 问题
7. 验证 SSE 流正在接收数据

具体问题：[用户描述]

提供：
- 控制台错误和警告
- WebSocket 连接状态
- 网络请求/响应详细信息
- UI 行为观察
```

### 代理 2：后端分析器

```
分析 AI-Bridge 后端的集成问题。
项目：C:\WorkSpace\ai-bridge
问题：[用户描述]

重点关注：
1. 检查服务器日志错误
2. 验证 config.yaml 中的 CORS 配置
3. 检查 WebSocket 处理器（internal/websocket/）
4. 验证 API 处理器是否响应
5. 检查 session/message 流程
6. 查找认证/授权问题
7. 如相关，验证数据库状态

提供：
- 后端错误日志
- 发现的配置问题
- 代码级别的问题及 file:line 引用
- API 响应状态码
```

## 第三步：关联发现

等待两个代理完成，然后：

1. **比较时间** - 前端错误是否与后端错误匹配？
2. **追踪数据流** - 请求 → 后端 → 数据库 → 后端 → 响应 → 前端
3. **识别不匹配** - 流程在哪里中断？

**常见集成中断点：**
- CORS 配置不匹配
- WebSocket 版本不兼容
- 认证令牌问题
- 消息格式差异
- 超时配置
- 网络/防火墙阻止

## 第四步：提供根本原因和修复

基于关联的发现：

**诊断模板：**
```markdown
## 根本原因
[中断点] 的集成失败：[正在发生什么]

## 前端症状
[用户在浏览器中看到的]

## 后端症状
[服务器日志显示的]

## 中断位置
文件：`internal/package/file.go:123`
配置：`configs/config.yaml:行号`

## 应用的修复

### 后端更改（如需要）
```go
// 显示代码更改
```

### 配置更改（如需要）
```yaml
# 显示配置更改
```

### 前端更改（如需要）
```javascript
// 显示前端修复
```

## 验证步骤
1. 重启后端
2. 刷新前端
3. 测试：[具体操作]
4. 验证：[预期结果]
```
</process>

<success_criteria>
集成调试完成标准：
- [ ] 前端和后端都已调查
- [ ] 在集成层确定了根本原因
- [ ] 为所有受影响的组件提供修复
- [ ] 验证步骤测试完整流程
- [ ] 用户可以确认端到端功能
</success_criteria>
