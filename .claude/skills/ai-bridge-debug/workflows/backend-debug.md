# Backend Debug Workflow

<required_reading>
**开始前阅读这些参考文件：**
1. references/backend-debugging.md - Go 调试模式和工具
2. references/logging-patterns.md - 日志分析
3. references/database-schema.md - 数据库结构
</required_reading>

<process>
## 第一步：理解后端问题

收集问题信息：
- 错误类型（panic、错误返回、挂起、意外行为）
- 错误位置（日志、控制台、特定功能）
- 何时发生（启动时、运行时、特定操作后）
- 错误频率（一次性、间歇性、持续）

## 第二步：启动后端分析器

使用单个后端分析代理，专注于 Go 代码和日志：

```
分析 AI-Bridge 后端问题。
项目：C:\WorkSpace\ai-bridge
问题描述：[用户描述]

调查步骤：
1. 检查最新的日志文件（Logs/ai-bridge*.log）
2. 搜索错误模式（panic、fatal、error、ERROR）
3. 读取错误堆栈跟踪
4. 定位错误源代码文件
5. 检查相关配置（configs/config.yaml）
6. 如相关，检查数据库状态

提供：
- 完整的错误堆栈跟踪
- 错误位置（file:line）
- 相关代码上下文
- 配置问题（如找到）
- 根本原因分析
```

## 第三步：分析日志模式

**使用 WQGroup/logger 模式搜索日志：**

```bash
# Windows 命令提示符
findstr /C:"ERROR" Logs\ai-bridge*.log
findstr /C:"panic" Logs\ai-bridge*.log
findstr /C:"fatal" Logs\ai-bridge*.log

# 查找特定时间范围
findstr /C:"2025-01-15 14:" Logs\ai-bridge*.log
```

**日志级别：**
- `DEBUG` - 详细调试信息
- `INFO` - 一般信息
- `WARN` - 警告
- `ERROR` - 错误
- `FATAL` - 致命错误

## 第四步：常见后端问题

### Panic 和崩溃
- **症状**：进程突然退出
- **位置**：查看日志末尾的堆栈跟踪
- **常见原因**：nil 指针解引用、数组越界、类型断言失败

### 错误返回
- **症状**：函数返回错误但不处理
- **位置**：检查 `if err != nil` 模式
- **常见原因**：数据库错误、网络错误、文件 I/O 错误

### 数据库锁定
- **症状**："database is locked" 错误
- **位置**：SQLite 操作
- **修复**：关闭所有连接，检查未关闭的事务

### 进程池问题
- **症状**：无法启动新 session、超时
- **位置**：`internal/pool/`
- **常见原因**：达到最大实例数、实例未正确清理

## 第五步：提供诊断

```markdown
## 根本原因
[根本原因描述]

## 错误位置
文件：`internal/package/file.go:123`
函数：`FunctionName`

## 堆栈跟踪
\```
[相关堆栈跟踪]
\```

## 问题代码
\```go
// 显示有问题的代码
\```

## 修复方案

### 代码修复
\```go
// 显示修复后的代码
\```

### 配置更改（如需要）
\```yaml
# 显示配置更改
\```

## 验证步骤
1. [ ] 应用修复
2. [ ] 重新编译（如需要）
3. [ ] 重启服务器
4. [ ] 测试：[具体操作]
5. [ ] 验证：[预期结果]
```
</process>

<success_criteria>
后端调试完成标准：
- [ ] 日志已分析
- [ ] 错误位置已定位（file:line）
- [ ] 根本原因已理解
- [ ] 修复方案已提供
- [ ] 验证步骤已包含
</success_criteria>
