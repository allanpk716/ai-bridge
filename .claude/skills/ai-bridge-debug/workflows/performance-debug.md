# Performance Debug Workflow

<required_reading>
**开始前阅读这些参考文件：**
1. references/architecture.md - 性能关键路径
2. references/backend-debugging.md - Go 性能分析
3. references/database-schema.md - 数据库查询优化
</required_reading>

<process>
## 第一步：理解性能问题

收集性能问题信息：
- 什么慢（API 响应、消息发送、页面加载）
- 慢多少（秒、超时）
- 何时发生（首次、持续、特定操作后）
- 影响范围（所有用户、特定 session）

## 第二步：启动所有代理（并行）

**重要提示：在单条消息中启动所有代理以进行全面性能分析。**

### 代理 1：后端分析器

```
分析 AI-Bridge 后端性能问题。
项目：C:\WorkSpace\ai-bridge
问题描述：[用户描述]

重点关注：
1. 检查日志中的慢操作（耗时长的请求）
2. 分析数据库查询（N+1 查询、缺少索引）
3. 检查内存使用（内存泄漏、高分配）
4. 验证进程池状态（实例耗尽）
5. 检查并发问题（锁竞争、死锁）
6. 分析 session/message 流程性能

提供：
- 慢操作列表及耗时
- 数据库查询分析
- 内存使用模式
- 进程池状态
- 性能瓶颈位置
```

### 代理 2：前端测试器

```
使用 dev-browser 技能测试前端性能。
后端 URL: http://localhost:8080

调查内容：
1. 测量页面加载时间
2. 检查网络请求耗时
3. 监控 WebSocket/SSE 延迟
4. 分析客户端内存使用
5. 检查 UI 渲染性能（长消息列表）
6. 验证增量消息同步（seq 编号）

提供：
- 页面加载时间
- 网络请求耗时
- WebSocket 延迟
- UI 渲染性能
- 客户端内存使用
```

### 代理 3：API 验证器

```
测试 AI-Bridge API 响应时间。
服务器：http://localhost:8080

测试内容：
1. 使用 curl 测量关键端点响应时间
2. 测试大消息列表（分页）
3. 测试 SSE 流延迟
4. 验证并发请求性能

测试端点：
- GET /api/v1/sessions
- GET /api/v1/sessions/:id/messages?limit=50
- GET /api/v1/sessions/:id/messages/stream?since=123
- POST /api/v1/sessions/:id/messages

提供：
- 各端点响应时间
- 分页性能
- SSE 流延迟
- 并发请求结果
```

## 第三步：关联发现

等待所有代理完成，然后分析：

1. **瓶颈识别** - 后端 vs 前端 vs 网络
2. **数据流追踪** - 请求 → 处理 → 响应 → 渲染
3. **资源使用** - CPU、内存、数据库连接

## 第四步：常见性能问题

### 慢 API 响应
- **症状**：API 请求超过 1 秒
- **常见原因**：
  - 数据库查询慢（缺少索引）
  - N+1 查询问题
  - 未缓存的数据
  - 同步 I/O 操作

### 高内存使用
- **症状**：内存持续增长
- **常见原因**：
  - 消息未从内存卸载（maxRecentMessages）
  - session 未清理
  - goroutine 泄漏

### 进程池耗尽
- **症状**：无法创建新 session
- **常见原因**：
  - 实例未正确释放
  - maxInstances 太低
  - idleTimeout 配置不当

### 前端渲染慢
- **症状**：页面卡顿、滚动慢
- **常见原因**：
  - 消息列表未分页
  - 未使用虚拟滚动
  - 大 DOM 树

### WebSocket 延迟
- **症状**：消息更新慢
- **常见原因**：
  - SSE 缓冲
  - 消息序列化慢
  - 网络拥塞

## 第五步：性能优化

### 数据库优化
```sql
-- 检查索引
PRAGMA index_list('messages');

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_messages_session_seq
ON messages (session_id, seq);

-- 分析查询计划
EXPLAIN QUERY PLAN SELECT * FROM messages
WHERE session_id = ? AND seq > ? ORDER BY seq LIMIT 50;
```

### 配置优化
```yaml
performance:
  maxRecentMessages: 100    # 减少内存中的消息
  messageBufferSize: 50
  subscriberBufferSize: 50

pool:
  maxInstances: 10          # 增加并发
  idleTimeout: 300s
```

### 代码优化
- 使用增量同步（since seq）
- 实现消息分页
- 添加数据库连接池
- 优化 JSON 序列化

## 第六步：提供诊断

```markdown
## 性能问题分析
[性能问题描述]

## 瓶颈位置
[瓶颈位置和严重程度]

## 性能指标

### 后端
- API 响应时间: [时间]
- 数据库查询时间: [时间]
- 内存使用: [使用量]
- 进程池状态: [状态]

### 前端
- 页面加载时间: [时间]
- UI 渲染时间: [时间]
- WebSocket 延迟: [时间]

### 数据库
- 慢查询: [查询列表]
- 索引状态: [状态]

## 优化方案

### 立即优化（快速见效）
1. [优化项]
2. [优化项]

### 长期优化（架构改进）
1. [优化项]
2. [优化项]

## 预期改进
- [ ] API 响应时间: [当前] → [目标]
- [ ] 内存使用: [当前] → [目标]
- [ ] 前端渲染: [当前] → [目标]

## 验证步骤
1. [ ] 应用优化
2. [ ] 重启服务器
3. [ ] 运行性能测试
4. [ ] 验证指标改善
```
</process>

<success_criteria>
性能调试完成标准：
- [ ] 所有代理已执行（后端、前端、API）
- [ ] 性能瓶颈已识别
- [ ] 根本原因已确定
- [ ] 优化方案已提供
- [ ] 预期改进已量化
</success_criteria>
