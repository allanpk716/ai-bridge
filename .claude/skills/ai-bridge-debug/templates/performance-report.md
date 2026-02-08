# 性能分析报告模板 / Performance Analysis Report Template

## 性能分析概要 / Performance Analysis Overview

**日期 / Date：** {{DATE}}
**分析类型：** {{ANALYSIS_TYPE}}
**分析时长：** {{DURATION}}
**系统负载：** {{SYSTEM_LOAD}}

## 性能指标 / Performance Metrics

### 后端性能 / Backend Performance

| 指标 | 当前值 | 目标值 | 状态 | 趋势 |
|-----|--------|--------|------|------|
| API 平均响应时间 | {{API_AVG_TIME}} ms | < 1000 ms | {{API_STATUS}} | {{API_TREND}} |
| API P95 响应时间 | {{API_P95_TIME}} ms | < 2000 ms | {{API_P95_STATUS}} | {{API_P95_TREND}} |
| API P99 响应时间 | {{API_P99_TIME}} ms | < 5000 ms | {{API_P99_STATUS}} | {{API_P99_TREND}} |
| 数据库查询时间 | {{DB_QUERY_TIME}} ms | < 100 ms | {{DB_STATUS}} | {{DB_TREND}} |
| 进程池使用率 | {{POOL_USAGE}}% | < 80% | {{POOL_STATUS}} | {{POOL_TREND}} |
| 内存使用 | {{MEMORY_USAGE}} MB | < 500 MB | {{MEMORY_STATUS}} | {{MEMORY_TREND}} |
| Goroutine 数量 | {{GOROUTINE_COUNT}} | < 1000 | {{GOROUTINE_STATUS}} | {{GOROUTINE_TREND}} |

### 前端性能 / Frontend Performance

| 指标 | 当前值 | 目标值 | 状态 | 趋势 |
|-----|--------|--------|------|------|
| 页面加载时间 | {{PAGE_LOAD_TIME}} ms | < 3000 ms | {{PAGE_LOAD_STATUS}} | {{PAGE_LOAD_TREND}} |
| DOM 就绪时间 | {{DOM_READY_TIME}} ms | < 1000 ms | {{DOM_READY_STATUS}} | {{DOM_READY_TREND}} |
| 首次渲染时间 | {{FIRST_PAINT_TIME}} ms | < 500 ms | {{FIRST_PAINT_STATUS}} | {{FIRST_PAINT_TREND}} |
| 消息渲染时间（100 条） | {{MSG_RENDER_TIME}} ms | < 500 ms | {{MSG_RENDER_STATUS}} | {{MSG_RENDER_TREND}} |
| WebSocket 延迟 | {{WS_LATENCY}} ms | < 100 ms | {{WS_LATENCY_STATUS}} | {{WS_LATENCY_TREND}} |
| 客户端内存 | {{CLIENT_MEMORY}} MB | < 100 MB | {{CLIENT_MEMORY_STATUS}} | {{CLIENT_MEMORY_TREND}} |

### 数据库性能 / Database Performance

| 指标 | 当前值 | 目标值 | 状态 | 趋势 |
|-----|--------|--------|------|------|
| 查询平均时间 | {{QUERY_AVG_TIME}} ms | < 50 ms | {{QUERY_AVG_STATUS}} | {{QUERY_AVG_TREND}} |
| 慢查询数量 | {{SLOW_QUERIES}} | 0 | {{SLOW_QUERIES_STATUS}} | {{SLOW_QUERIES_TREND}} |
| 数据库大小 | {{DB_SIZE}} MB | < 1000 MB | {{DB_SIZE_STATUS}} | {{DB_SIZE_TREND}} |
| 连接池使用率 | {{CONN_POOL_USAGE}}% | < 70% | {{CONN_POOL_STATUS}} | {{CONN_POOL_TREND}} |

## 瓶颈分析 / Bottleneck Analysis

### 主要瓶颈 / Primary Bottlenecks

#### 1. {{BOTTLENECK_1_NAME}}
- **位置：** {{BOTTLENECK_1_LOCATION}}
- **严重程度：** {{BOTTLENECK_1_SEVERITY}}
- **影响：** {{BOTTLENECK_1_IMPACT}}
- **原因：** {{BOTTLENECK_1_CAUSE}}
- **建议：** {{BOTTLENECK_1_RECOMMENDATION}}

#### 2. {{BOTTLENECK_2_NAME}}
- **位置：** {{BOTTLENECK_2_LOCATION}}
- **严重程度：** {{BOTTLENECK_2_SEVERITY}}
- **影响：** {{BOTTLENECK_2_IMPACT}}
- **原因：** {{BOTTLENECK_2_CAUSE}}
- **建议：** {{BOTTLENECK_2_RECOMMENDATION}}

#### 3. {{BOTTLENECK_3_NAME}}
- **位置：** {{BOTTLENECK_3_LOCATION}}
- **严重程度：** {{BOTTLENECK_3_SEVERITY}}
- **影响：** {{BOTTLENECK_3_IMPACT}}
- **原因：** {{BOTTLENECK_3_CAUSE}}
- **建议：** {{BOTTLENECK_3_RECOMMENDATION}}

## 优化建议 / Optimization Recommendations

### 立即优化（高优先级）/ Immediate Optimizations (High Priority)

1. **{{OPT_IMMEDIATE_1}}**
   - **预期改进：** {{OPT_IMMEDIATE_1_GAIN}}
   - **实施难度：** {{OPT_IMMEDIATE_1_DIFFICULTY}}
   - **实施时间：** {{OPT_IMMEDIATE_1_TIME}}
   - **代码更改：**
     ```go
     {{OPT_IMMEDIATE_1_CODE}}
     ```

2. **{{OPT_IMMEDIATE_2}}**
   - **预期改进：** {{OPT_IMMEDIATE_2_GAIN}}
   - **实施难度：** {{OPT_IMMEDIATE_2_DIFFICULTY}}
   - **实施时间：** {{OPT_IMMEDIATE_2_TIME}}
   - **配置更改：**
     ```yaml
     {{OPT_IMMEDIATE_2_CONFIG}}
     ```

### 短期优化（中优先级）/ Short-term Optimizations (Medium Priority)

1. **{{OPT_SHORT_1}}**
   - **预期改进：** {{OPT_SHORT_1_GAIN}}
   - **实施难度：** {{OPT_SHORT_1_DIFFICULTY}}
   - **实施时间：** {{OPT_SHORT_1_TIME}}

2. **{{OPT_SHORT_2}}**
   - **预期改进：** {{OPT_SHORT_2_GAIN}}
   - **实施难度：** {{OPT_SHORT_2_DIFFICULTY}}
   - **实施时间：** {{OPT_SHORT_2_TIME}}

### 长期优化（低优先级）/ Long-term Optimizations (Low Priority)

1. **{{OPT_LONG_1}}**
   - **预期改进：** {{OPT_LONG_1_GAIN}}
   - **实施难度：** {{OPT_LONG_1_DIFFICULTY}}
   - **实施时间：** {{OPT_LONG_1_TIME}}

2. **{{OPT_LONG_2}}**
   - **预期改进：** {{OPT_LONG_2_GAIN}}
   - **实施难度：** {{OPT_LONG_2_DIFFICULTY}}
   - **实施时间：** {{OPT_LONG_2_TIME}}

## 性能测试结果 / Performance Test Results

### 负载测试 / Load Testing

| 并发用户 | 平均响应时间 | P95 响应时间 | 错误率 | 吞吐量 |
|---------|-------------|-------------|--------|--------|
| 10 | {{LOAD_10_AVG}} ms | {{LOAD_10_P95}} ms | {{LOAD_10_ERROR}}% | {{LOAD_10_THROUGHPUT}} req/s |
| 50 | {{LOAD_50_AVG}} ms | {{LOAD_50_P95}} ms | {{LOAD_50_ERROR}}% | {{LOAD_50_THROUGHPUT}} req/s |
| 100 | {{LOAD_100_AVG}} ms | {{LOAD_100_P95}} ms | {{LOAD_100_ERROR}}% | {{LOAD_100_THROUGHPUT}} req/s |
| 500 | {{LOAD_500_AVG}} ms | {{LOAD_500_P95}} ms | {{LOAD_500_ERROR}}% | {{LOAD_500_THROUGHPUT}} req/s |

### 压力测试 / Stress Testing

| 指标 | 突破点 | 当前最大 | 建议 |
|-----|--------|---------|------|
| 最大并发用户 | {{STRESS_MAX_USERS}} | {{STRESS_CURRENT_MAX}} | {{STRESS_RECOMMENDATION}} |
| 最大请求数/秒 | {{STRESS_MAX_RPS}} | {{STRESS_CURRENT_RPS}} | {{STRESS_RPS_RECOMMENDATION}} |
| 最大消息数/会话 | {{STRESS_MAX_MESSAGES}} | {{STRESS_CURRENT_MESSAGES}} | {{STRESS_MESSAGES_RECOMMENDATION}} |

### 耐久测试 / Endurance Testing

- **测试时长：** {{ENDURANCE_DURATION}}
- **总请求数：** {{ENDURANCE_TOTAL_REQUESTS}}
- **平均响应时间：** {{ENDURANCE_AVG_RESPONSE}} ms
- **内存泄漏：** {{ENDURANCE_MEMORY_LEAK}}
- **连接泄漏：** {{ENDURANCE_CONNECTION_LEAK}}
- **错误率变化：** {{ENDURANCE_ERROR_RATE_CHANGE}}

## 性能回归检测 / Performance Regression Detection

### 基线指标 / Baseline Metrics

| 指标 | 基线值 | 当前值 | 变化 | 状态 |
|-----|--------|--------|------|------|
| API 响应时间 | {{BASELINE_API}} ms | {{CURRENT_API}} ms | {{API_CHANGE}}% | {{API_REGRESSION_STATUS}} |
| 内存使用 | {{BASELINE_MEMORY}} MB | {{CURRENT_MEMORY}} MB | {{MEMORY_CHANGE}}% | {{MEMORY_REGRESSION_STATUS}} |
| 数据库查询时间 | {{BASELINE_DB}} ms | {{CURRENT_DB}} ms | {{DB_CHANGE}}% | {{DB_REGRESSION_STATUS}} |

### 回归分析 / Regression Analysis

{{#if REGRESSION_DETECTED}}
**检测到性能回归！**

回归详情：
- **回归位置：** {{REGRESSION_LOCATION}}
- **回归原因：** {{REGRESSION_CAUSE}}
- **影响范围：** {{REGRESSION_SCOPE}}
- **建议操作：** {{REGRESSION_ACTION}}
{{else}}
未检测到性能回归
{{/if}}

## 监控建议 / Monitoring Recommendations

### 关键指标 / Key Metrics

建议持续监控以下指标：

1. **后端指标：**
   - API 响应时间（P50、P95、P99）
   - 数据库查询时间
   - 进程池使用率
   - 内存使用
   - Goroutine 数量

2. **前端指标：**
   - 页面加载时间
   - WebSocket 延迟
   - 客户端内存
   - 错误率

3. **数据库指标：**
   - 查询时间
   - 慢查询数量
   - 连接池使用率

### 告警规则 / Alert Rules

| 指标 | 阈值 | 严重程度 | 操作 |
|-----|------|----------|------|
| API 响应时间 | > 5000 ms | 严重 | 立即调查 |
| 内存使用 | > 1 GB | 警告 | 检查泄漏 |
| 进程池使用率 | > 90% | 警告 | 增加容量 |
| 错误率 | > 5% | 严重 | 检查日志 |

## 实施计划 / Implementation Plan

### 第一阶段（立即） / Phase 1 (Immediate)
- [ ] {{PHASE1_TASK_1}}
- [ ] {{PHASE1_TASK_2}}
- [ ] {{PHASE1_TASK_3}}

**预期改进：**
- API 响应时间：{{PHASE1_API_GAIN}}%
- 内存使用：{{PHASE1_MEMORY_GAIN}}%
- 整体性能：{{PHASE1_OVERALL_GAIN}}%

### 第二阶段（1-2 周） / Phase 2 (1-2 weeks)
- [ ] {{PHASE2_TASK_1}}
- [ ] {{PHASE2_TASK_2}}
- [ ] {{PHASE2_TASK_3}}

**预期改进：**
- API 响应时间：{{PHASE2_API_GAIN}}%
- 数据库性能：{{PHASE2_DB_GAIN}}%
- 整体性能：{{PHASE2_OVERALL_GAIN}}%

### 第三阶段（1-2 个月） / Phase 3 (1-2 months)
- [ ] {{PHASE3_TASK_1}}
- [ ] {{PHASE3_TASK_2}}
- [ ] {{PHASE3_TASK_3}}

**预期改进：**
- 可扩展性：{{PHASE3_SCALABILITY_GAIN}}%
- 稳定性：{{PHASE3_STABILITY_GAIN}}%
- 整体性能：{{PHASE3_OVERALL_GAIN}}%

## 附录 / Appendix

### 测试环境 / Test Environment
- **CPU：** {{TEST_CPU}}
- **内存：** {{TEST_RAM}}
- **磁盘：** {{TEST_DISK}}
- **网络：** {{TEST_NETWORK}}
- **操作系统：** {{TEST_OS}}

### 测试工具 / Testing Tools
- {{TEST_TOOL_1}}
- {{TEST_TOOL_2}}
- {{TEST_TOOL_3}}

### 参考文档 / References
- `references/architecture.md`
- `references/database-schema.md`
- `references/logging-patterns.md`

---

**报告生成者：** AI-Bridge Debug Skill
**报告日期：** {{DATE}}
**版本：** 2.0.0
