# API Debug Workflow

<required_reading>
**开始前阅读这些参考文件：**
1. references/api-reference.md - HAPI 兼容端点
2. references/backend-debugging.md - Go 调试模式
</required_reading>

<process>
## 第一步：理解 API 问题

收集问题信息：
- 哪个端点（/api/v1/sessions、/api/v1/messages 等）
- HTTP 方法（GET、POST、DELETE）
- 预期 vs 实际响应
- 状态码（200、400、404、500）
- 请求参数和体

## 第二步：启动并行代理

使用 API 验证器和后端分析器并行调查：

### 代理 1：API 验证器

```
测试 AI-Bridge API 端点。
项目：C:\WorkSpace\ai-bridge
服务器：http://localhost:8080

问题端点：[用户提供]

测试步骤：
1. 使用 curl 测试端点
2. 检查响应状态码
3. 验证响应头（Content-Type、CORS）
4. 分析响应体（JSON 格式、错误消息）
5. 测试不同的请求参数
6. 检查认证（如需要）

提供：
- curl 命令和输出
- 响应状态码和头
- 响应体（格式化的 JSON）
- 任何认证问题
```

### 代理 2：后端分析器

```
分析 AI-Bridge 后端的 API 处理器。
项目：C:\WorkSpace\ai-bridge
问题端点：[用户提供]

重点关注：
1. 定位端点处理器代码（internal/api/handlers/）
2. 检查路由配置
3. 验证请求参数验证
4. 检查错误处理
5. 查看服务器日志中的请求/错误
6. 检查数据库操作（如相关）

提供：
- 处理器文件和函数（file:line）
- 路由配置
- 请求验证逻辑
- 错误处理代码
- 日志中的相关错误
```

## 第三步：关联发现

比较 API 测试结果和后端代码分析：

1. **状态码** - 是否与后端逻辑匹配？
2. **响应体** - 错误消息是否准确？
3. **CORS** - 响应头是否正确？
4. **认证** - 令牌验证是否正常？
5. **参数** - 请求参数是否正确验证？

## 第四步：常见 API 问题

### 404 Not Found
- **症状**：端点返回 404
- **常见原因**：
  - 路由未注册
  - URL 路径拼写错误
  - HTTP 方法不匹配

### 400 Bad Request
- **症状**：请求被拒绝
- **常见原因**：
  - 缺少必需参数
  - 参数类型错误
  - JSON 格式错误

### 401/403 Unauthorized
- **症状**：认证失败
- **常见原因**：
  - JWT 令牌缺失或无效
  - 权限不足
  - 令牌过期

### 500 Internal Server Error
- **症状**：服务器错误
- **常见原因**：
  - 未处理的错误
  - 数据库错误
  - 空指针解引用

### CORS 错误
- **症状**：浏览器阻止请求
- **常见原因**：
  - Origin 不在允许列表中
  - CORS 头缺失
  - 预检请求失败

## 第五步：提供诊断

```markdown
## API 端点
- URL: [端点 URL]
- 方法: [HTTP 方法]
- 状态码: [实际状态码]

## 问题分析
[问题描述]

## 根本原因
[根本原因分析]

## 后端代码位置
文件：`internal/api/handlers/file.go:123`
函数：`HandlerFunction`

## 请求/响应

### 请求
\```bash
curl -X [方法] http://localhost:8080[端点] \
  -H "Content-Type: application/json" \
  -d '[请求体]'
\```

### 响应
\```json
[响应 JSON]
\```

## 修复方案

### 代码修复
\```go
// 显示后端代码修复
\```

### 配置修复（如需要）
\```yaml
# 显示配置更改（如 CORS）
\```

## 验证步骤
1. [ ] 应用修复
2. [ ] 重启服务器
3. [ ] 使用 curl 测试：[命令]
4. [ ] 验证响应：[预期结果]
```
</process>

<success_criteria>
API 调试完成标准：
- [ ] 端点已测试（curl）
- [ ] 后端处理器已分析
- [ ] 状态码和响应已验证
- [ ] 根本原因已确定
- [ ] 修复方案已提供
</success_criteria>
