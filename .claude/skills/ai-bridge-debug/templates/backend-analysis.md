# 后端分析报告模板 / Backend Analysis Report Template

## 问题概要 / Issue Summary

**日期 / Date：** {{DATE}}
**Session ID：** {{SESSION_ID}}
**问题类型：** {{ISSUE_TYPE}}
**严重程度：** {{SEVERITY}}（低/中/高/紧急）

## 问题描述 / Problem Description

### 用户报告 / User Report
{{USER_DESCRIPTION}}

### 症状 / Symptoms
- {{SYMPTOM_1}}
- {{SYMPTOM_2}}
- {{SYMPTOM_3}}

## 根本原因 / Root Cause

### 错误位置 / Error Location
**文件：** `internal/{{PACKAGE}}/{{FILE}}.go:{{LINE_NUMBER}}`
**函数：** `{{FUNCTION_NAME}}`

### 错误详情 / Error Details
```go
{{ERROR_CODE_SNIPPET}}
```

### 堆栈跟踪 / Stack Trace
```
{{STACK_TRACE}}
```

### 根本原因分析 / Root Cause Analysis
{{ROOT_CAUSE_ANALYSIS}}

## 影响评估 / Impact Assessment

### 影响范围 / Scope
- [ ] 单个功能 / Single feature
- [ ] 多个功能 / Multiple features
- [ ] 整个系统 / Entire system

### 用户影响 / User Impact
- **受影响用户：** {{AFFECTED_USERS}}
- **影响操作：** {{AFFECTED_OPERATIONS}}

### 数据影响 / Data Impact
- [ ] 无数据丢失 / No data loss
- [ ] 潜在数据损坏 / Potential data corruption
- [ ] 数据丢失 / Data loss

## 修复方案 / Fix Solution

### 代码修复 / Code Fix
**文件：** `internal/{{PACKAGE}}/{{FILE}}.go`

```diff
--- a/internal/{{PACKAGE}}/{{FILE}}.go
+++ b/internal/{{PACKAGE}}/{{FILE}}.go
@@ -{{LINE_NUMBER}},7 +{{LINE_NUMBER}},7 @@
 func {{FUNCTION_NAME}}() {
-    {{OLD_CODE}}
+    {{NEW_CODE}}
 }
```

### 配置修复（如需要） / Configuration Fix (if needed)
**文件：** `configs/config.yaml`

```diff
--- a/configs/config.yaml
+++ b/configs/config.yaml
@@ -{{CONFIG_LINE}},3 +{{CONFIG_LINE}},3 @@
-    {{OLD_CONFIG}}
+    {{NEW_CONFIG}}
```

### 依赖修复（如需要） / Dependency Fix (if needed)
```bash
{{DEPENDENCY_FIX_COMMANDS}}
```

## 验证步骤 / Verification Steps

1. [ ] 应用代码修复
   ```bash
   {{APPLY_FIX_COMMANDS}}
   ```

2. [ ] 重新编译（如需要）
   ```bash
   go build -o ai-bridge.exe ./cmd/ai-bridge
   ```

3. [ ] 重启服务器
   ```bash
   .\ai-bridge.exe server --config configs\config.yaml
   ```

4. [ ] 测试功能
   - [ ] {{TEST_STEP_1}}
   - [ ] {{TEST_STEP_2}}
   - [ ] {{TEST_STEP_3}}

5. [ ] 验证日志
   ```bash
   findstr /C:"ERROR" logs\ai-bridge*.log
   ```

6. [ ] 确认修复
   - [ ] 错误不再出现
   - [ ] 功能正常工作
   - [ ] 性能未受影响

## 预防措施 / Prevention Measures

### 代码改进 / Code Improvements
- [ ] 添加错误处理
- [ ] 添加输入验证
- [ ] 添加单元测试
- [ ] 添加集成测试

### 监控建议 / Monitoring Recommendations
- [ ] 添加日志记录
- [ ] 添加指标监控
- [ ] 添加告警规则

### 文档更新 / Documentation Updates
- [ ] 更新 CLAUDE.md
- [ ] 更新 API 文档
- [ ] 更新架构文档

## 附录 / Appendix

### 相关日志 / Related Logs
```
{{RELEVANT_LOGS}}
```

### 相关 Issue / Related Issues
- {{RELATED_ISSUE_1}}
- {{RELATED_ISSUE_2}}

### 参考文档 / References
- `references/backend-debugging.md`
- `references/logging-patterns.md`
- `references/database-schema.md`

---

**报告生成者：** AI-Bridge Debug Skill
**报告日期：** {{DATE}}
**版本：** 2.0.0
