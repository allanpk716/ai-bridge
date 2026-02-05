# Codebase Concerns

**Analysis Date:** 2026-02-05

## Tech Debt

### API Server架构
- **Issue**: SetCommandParser方法被注释并标记TODO
- Files: `C:\WorkSpace\ai-bridge\internal\api\server.go:201`
- Impact: 无法动态更新命令解析器，需要重启服务才能加载新命令
- Fix approach: 实现SetCommandParser方法，支持热重载命令配置

### WebSocket安全
- **Issue**: Origin检查被跳过，允许所有来源连接
- Files: `C:\WorkSpace\ai-bridge\internal\websocket\server.go:18`
- Impact: 生产环境中存在CSRF攻击风险
- Fix approach: 实现严格的Origin验证，根据配置的CORS策略检查请求来源

### 会话状态同步
- **Issue**: 创建会话时WorkingDir和Model字段为空字符串
- Files: `C:\WorkSpace\ai-bridge\internal\session\manager.go:87-88`
- Impact: 数据库中的会话信息不完整，影响会话恢复和管理
- Fix approach: 从instance和config中正确获取并填充这些字段

### 健康监控重启机制
- **Issue**: 崩溃检测后缺少自动重启逻辑
- Files: `C:\WorkSpace\ai-bridge\internal\health\monitor.go:86`
- Impact: 崩溃的会话无法自动恢复，需要人工干预
- Fix approach: 实现会话重启逻辑，包括实例释放和重新获取

## Known Bugs

### 健康检查数据不完整
- **症状**: 健康检查返回的是占位数据，不是实际状态
- Files: `C:\WorkSpace\ai-bridge\internal\health\health.go:84,94`
- Trigger: 任何访问健康检查端点的请求
- Workaround: 无，需要修复实际数据获取逻辑

## Security Considerations

### JWT密钥配置
- **Risk**: 使用了固定的测试密钥"test-secret-for-validation"
- Files: `C:\WorkSpace\ai-bridge\configs\config.yaml:37`
- Current mitigation: 仅限测试环境使用
- Recommendations:
  - 生产环境必须使用环境变量或密钥管理服务
  - 实现密钥轮换机制

### API Token安全
- **Risk**: CLI API Token使用固定值"test-token"
- Files: `C:\WorkSpace\ai-bridge\configs\config.yaml:39`
- Current mitigation: 配置文件已列入.gitignore
- Recommendations:
  - 从环境变量读取API Token
  - 支持多租户Token隔离

### 速率限制未启用
- **Risk**: 没有防止API滥用的保护机制
- Files: `C:\WorkSpace\ai-bridge\configs\config.yaml:116`
- Current mitigation: 无
- Recommendations:
  - 启用速率限制
  - 实现IP黑名单机制
  - 添加API配额管理

## Performance Bottlenecks

### 进程池并发限制
- **Problem**: 最大5个并发实例可能成为瓶颈
- Files: `C:\WorkSpace\ai-bridge\internal\pool/pool.go`
- Cause: 配置中硬编码的maxInstances值
- Improvement path:
  - 支持动态调整池大小
  - 实现实例自动扩缩容
  - 添加负载均衡策略

### 内存管理风险
- **Problem**: 每个会话在内存中保留100条消息
- Files: `C:\WorkSpace\ai-bridge\internal/session/session.go`
- Cause: 无内存使用监控和限制
- Improvement path:
  - 实现内存使用监控
  - 添加会话级别的内存配额
  - 优化消息存储策略

### 数据库查询性能
- **Problem**: 随着消息数量增长，分页查询可能变慢
- Files: `C:\WorkSpace\ai-bridge\internal/session/store.go`
- Cause: 缺少数据库索引优化
- Improvement path:
  - 为(session_id, seq)创建复合索引
  - 实现查询缓存
  - 考虑使用时序数据库优化

## Fragile Areas

### 进程池管理
- **Files**: `C:\WorkSpace\ai-bridge\internal/pool/pool.go`, `C:\WorkSpace\ai-bridge\internal/pool/instance.go`
- Why fragile: 进程崩溃和资源清理依赖Context取消，可能存在竞争条件
- Safe modification: 添加重试机制和状态检查
- Test coverage: 需要覆盖进程意外退出的场景

### WebSocket连接管理
- **Files**: `C:\WorkSpace\ai-bridge\internal/websocket/server.go`
- Why fragile: 长连接的清理依赖于defer和goroutine退出
- Safe modification: 实现优雅关闭和连接状态监控
- Test coverage: 需要测试连接断开时的资源清理

### 配置加载
- **Files**: `C:\WorkSpace\ai-bridge\internal/config/config.go`
- Why fragile: 配置结构体字段较多，缺少验证
- Safe modification: 添加配置验证和默认值处理
- Test coverage: 需要覆盖各种配置组合的测试

## Scaling Limits

### 单实例性能
- **Current capacity**: 约5个并发Claude CLI实例
- **Limit**: 受限于进程池大小和系统资源
- **Scaling path**:
  - 实现横向扩展（多个AI-Bridge实例）
  - 添加负载均衡和会话亲和性
  - 考虑使用Kubernetes进行容器编排

### 存储扩展
- **Current capacity**: SQLite文件存储，适合中小规模
- **Limit**: 大量会话和消息时文件I/O性能下降
- **Scaling path**:
  - 支持PostgreSQL/MySQL
  - 实现读写分离
  - 考虑消息队列处理流式数据

## Dependencies at Risk

### Claude CLI依赖
- **Risk**: 直接依赖系统PATH中的Claude CLI版本
- **Impact**: 版本不兼容时服务中断
- **Migration plan**:
  - 实现版本检查机制
  - 封装CLI版本兼容层
  - 考虑嵌入式运行时

### 第三方库风险
- **Package**: gorilla/websocket
- **Risk**: 维护活跃度一般，存在潜在的安全漏洞
- **Impact**: WebSocket连接稳定性
- **Migration plan**: 评估替代方案如标准库net/http或更活跃的库

## Missing Critical Features

### 监控和可观测性
- **Problem**: 缺少详细的性能指标和监控
- **Blocks**: 生产环境问题诊断和容量规划
- **Need**:
  - 实现Prometheus指标导出
  - 添加分布式追踪
  - 实现业务指标监控

### 备份和恢复
- **Problem**: 没有数据备份和灾难恢复机制
- **Blocks**: 生产环境可靠性保障
- **Need**:
  - 会话数据备份策略
  - 多区域部署支持
  - 故障转移机制

## Test Coverage Gaps

### 竞态条件测试
- **What's not tested**: 并发访问会话和进程池的场景
- **Files**: `C:\WorkSpace\ai-bridge\internal/pool/`, `C:\WorkSpace\ai-bridge\internal/session/`
- **Risk**: 可能出现死锁或资源泄漏
- **Priority**: High

### 错误恢复测试
- **What's not tested**: 进程崩溃、网络中断后的恢复能力
- **Files**: `C:\WorkSpace\ai-bridge\internal/claude/process.go`
- **Risk**: 系统不稳定时无法保证数据一致性
- **Priority**: High

### 性能测试
- **What's not tested**: 大量并发会话和消息处理的性能表现
- **Files**: `C:\WorkSpace\ai-bridge\internal/session/session.go`
- **Risk**: 实际负载下可能出现性能问题
- **Priority**: Medium

---

*Concerns audit: 2026-02-05*