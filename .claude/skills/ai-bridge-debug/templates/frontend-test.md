# 前端测试报告模板 / Frontend Test Report Template

## 测试概要 / Test Overview

**日期 / Date：** {{DATE}}
**测试人员：** AI-Bridge Debug Skill
**测试类型：** {{TEST_TYPE}}
**浏览器：** {{BROWSER}}
**后端 URL：** {{BACKEND_URL}}

## 测试环境 / Test Environment

### 浏览器信息 / Browser Information
- **浏览器：** {{BROWSER_NAME}}
- **版本：** {{BROWSER_VERSION}}
- **平台：** {{PLATFORM}}

### 后端信息 / Backend Information
- **URL：** {{BACKEND_URL}}
- **版本：** {{BACKEND_VERSION}}
- **状态：** {{BACKEND_STATUS}}

## 测试结果 / Test Results

### 功能测试 / Functional Tests

| 功能 | 状态 | 备注 |
|-----|------|------|
| 页面加载 | {{STATUS_LOAD}} | {{NOTE_LOAD}} |
| WebSocket 连接 | {{STATUS_WS}} | {{NOTE_WS}} |
| API 调用 | {{STATUS_API}} | {{NOTE_API}} |
| 消息显示 | {{STATUS_MSG}} | {{NOTE_MSG}} |
| 实时更新 | {{STATUS_REALTIME}} | {{NOTE_REALTIME}} |
| UI 交互 | {{STATUS_UI}} | {{NOTE_UI}} |

### 性能测试 / Performance Tests

| 指标 | 结果 | 目标 | 状态 |
|-----|------|------|------|
| 页面加载时间 | {{LOAD_TIME}} ms | < 3000 ms | {{PERF_LOAD_STATUS}} |
| API 响应时间 | {{API_TIME}} ms | < 1000 ms | {{PERF_API_STATUS}} |
| 消息渲染时间（100 条） | {{RENDER_TIME}} ms | < 500 ms | {{PERF_RENDER_STATUS}} |
| 内存使用 | {{MEMORY_USAGE}} MB | < 100 MB | {{PERF_MEMORY_STATUS}} |

### 错误检查 / Error Checks

#### 控制台错误 / Console Errors
```
{{CONSOLE_ERRORS}}
```

**分析：** {{CONSOLE_ERRORS_ANALYSIS}}

#### 网络错误 / Network Errors
```
{{NETWORK_ERRORS}}
```

**分析：** {{NETWORK_ERRORS_ANALYSIS}}

#### WebSocket 错误 / WebSocket Errors
```
{{WS_ERRORS}}
```

**分析：** {{WS_ERRORS_ANALYSIS}}

## 问题发现 / Issues Found

### 严重问题 / Critical Issues
{{#if CRITICAL_ISSUES}}
1. **{{CRITICAL_ISSUE_1}}**
   - 位置：{{CRITICAL_LOCATION_1}}
   - 影响：{{CRITICAL_IMPACT_1}}
   - 修复：{{CRITICAL_FIX_1}}

2. **{{CRITICAL_ISSUE_2}}**
   - 位置：{{CRITICAL_LOCATION_2}}
   - 影响：{{CRITICAL_IMPACT_2}}
   - 修复：{{CRITICAL_FIX_2}}
{{else}}
无严重问题
{{/if}}

### 一般问题 / Normal Issues
{{#if NORMAL_ISSUES}}
1. **{{NORMAL_ISSUE_1}}**
   - 位置：{{NORMAL_LOCATION_1}}
   - 影响：{{NORMAL_IMPACT_1}}
   - 修复：{{NORMAL_FIX_1}}

2. **{{NORMAL_ISSUE_2}}**
   - 位置：{{NORMAL_LOCATION_2}}
   - 影响：{{NORMAL_IMPACT_2}}
   - 修复：{{NORMAL_FIX_2}}
{{else}}
无一般问题
{{/if}}

### 建议改进 / Suggestions
{{#if SUGGESTIONS}}
1. **{{SUGGESTION_1}}**
   - 原因：{{SUGGESTION_REASON_1}}
   - 优先级：{{SUGGESTION_PRIORITY_1}}

2. **{{SUGGESTION_2}}**
   - 原因：{{SUGGESTION_REASON_2}}
   - 优先级：{{SUGGESTION_PRIORITY_2}}
{{else}}
无建议
{{/if}}

## 测试截图 / Test Screenshots

### 正常状态 / Normal State
{{#if SCREENSHOT_NORMAL}}
![正常状态]({{SCREENSHOT_NORMAL}})
{{/if}}

### 错误状态 / Error State
{{#if SCREENSHOT_ERROR}}
![错误状态]({{SCREENSHOT_ERROR}})
{{/if}}

### 性能分析 / Performance Analysis
{{#if SCREENSHOT_PERF}}
![性能分析]({{SCREENSHOT_PERF}})
{{/if}}

## 网络请求分析 / Network Request Analysis

### API 请求 / API Requests
| 端点 | 方法 | 状态 | 响应时间 | 大小 |
|-----|------|------|----------|------|
| {{ENDPOINT_1}} | {{METHOD_1}} | {{STATUS_1}} | {{TIME_1}} | {{SIZE_1}} |
| {{ENDPOINT_2}} | {{METHOD_2}} | {{STATUS_2}} | {{TIME_2}} | {{SIZE_2}} |
| {{ENDPOINT_3}} | {{METHOD_3}} | {{STATUS_3}} | {{TIME_3}} | {{SIZE_3}} |

### WebSocket 连接 / WebSocket Connection
- **连接状态：** {{WS_CONNECTION_STATUS}}
- **传输类型：** {{WS_TRANSPORT}}
- **重连次数：** {{WS_RECONNECT_COUNT}}
- **发送消息：** {{WS_MESSAGES_SENT}}
- **接收消息：** {{WS_MESSAGES_RECEIVED}}

## 兼容性测试 / Compatibility Testing

| 浏览器 | 版本 | 页面加载 | WebSocket | API | 总体 |
|--------|------|---------|-----------|-----|------|
| Chrome | {{CHROME_VERSION}} | {{CHROME_LOAD}} | {{CHROME_WS}} | {{CHROME_API}} | {{CHROME_OVERALL}} |
| Firefox | {{FIREFOX_VERSION}} | {{FIREFOX_LOAD}} | {{FIREFOX_WS}} | {{FIREFOX_API}} | {{FIREFOX_OVERALL}} |
| Edge | {{EDGE_VERSION}} | {{EDGE_LOAD}} | {{EDGE_WS}} | {{EDGE_API}} | {{EDGE_OVERALL}} |

## 测试结论 / Test Conclusion

### 总体评估 / Overall Assessment
{{OVERALL_ASSESSMENT}}

### 建议 / Recommendations
{{RECOMMENDATIONS}}

### 后续步骤 / Next Steps
1. [ ] {{NEXT_STEP_1}}
2. [ ] {{NEXT_STEP_2}}
3. [ ] {{NEXT_STEP_3}}

## 附录 / Appendix

### 测试命令 / Test Commands
```bash
# 测试 API
curl {{BACKEND_URL}}/health

# 测试 WebSocket
curl -N {{BACKEND_URL}}/api/v1/sessions/test/messages/stream

# 测试 SSE
```

### 浏览器控制台命令 / Browser Console Commands
```javascript
// 检查 WebSocket
console.log('WebSocket:', socket.connected);

// 检查消息
socket.on('message', (msg) => console.log('Message:', msg));

// 检查错误
window.onerror = (msg, url, line) => console.error('Error:', msg);
```

### 参考文档 / References
- `references/frontend-testing.md`
- `references/api-reference.md`
- `references/troubleshooting.md`

---

**报告生成者：** AI-Bridge Debug Skill
**报告日期：** {{DATE}}
**版本：** 2.0.0
