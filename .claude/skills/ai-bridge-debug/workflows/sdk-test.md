# SDK 测试工作流

本文档定义了 AI-Bridge SDK 集成测试的完整流程，包括服务管理、浏览器自动化测试和验证检查清单。

## 前置条件检查

在开始测试之前，需要验证以下条件：

### 1. SDK 构建状态
- **检查点**: SDK 文件是否存在
- **位置**: `web/public/sdk/ai-bridge-sdk.es.js`
- **如果不存在**: 运行 `cd sdk && npm run build`

### 2. 配置文件
- **检查点**: 后端配置是否存在
- **位置**: `configs/config.yaml`
- **如果不存在**: 从 `config.yaml.example` 复制并修改

## 服务启动流程

### 步骤 1: 检查当前服务状态

运行服务检查脚本：
```batch
.claude\skills\ai-bridge-debug\scripts\check-services.bat
```

**预期输出**:
```
[1/3] Checking backend service (port 8080)...
[OK] Backend service is running on port 8080
[2/3] Checking ai-bridge.exe process...
[OK] ai-bridge.exe process is running
[3/3] Checking frontend service (port 3000)...
[OK] Frontend service is running on port 3000
```

### 步骤 2: 启动后端服务（如需要）

如果后端未运行，执行：
```batch
.claude\skills\ai-bridge-debug\scripts\start-backend.bat
```

**预期输出**:
```
========================================
AI-Bridge Backend Service Start
========================================

[1/6] Checking if backend is already running...
[2/6] Checking configuration file...
[OK] Configuration file found
[3/6] Checking executable...
[OK] Executable found
...
[6/6] Verifying startup...
[OK] Backend process is running
[OK] Backend is responding on port 8080
```

### 步骤 3: 验证后端健康

运行健康检查：
```batch
.claude\skills\ai-bridge-debug\scripts\health-check.bat
```

**预期输出**:
```
[1/4] Checking backend service...
[OK] Backend process is running
[2/4] Testing backend health endpoint...
HTTP Status: 200
[OK] Backend health check passed
```

### 步骤 4: 启动前端服务（如需要）

如果前端未运行，在项目根目录执行：
```batch
cd web
npm run dev
```

保持前端服务运行在 `http://localhost:3000`

## 浏览器自动化测试

### 使用 dev-browser 技能进行测试

调用 dev-browser 技能：
```
使用 dev-browser 技能：
1. 打开 http://localhost:3000/test-sdk.html
2. 等待页面加载完成（等待 5-10 秒）
3. 检查页面状态显示：
   - 连接状态应显示"已连接"（绿色背景）
   - 日志区域应有 SDK 初始化消息
4. 检查浏览器控制台：
   - 打开开发者工具（F12）
   - 查看 Console 标签
   - 查找 [SdkBridge] 日志
5. 截图当前状态（如果有错误）
```

### 手动测试步骤

如果 dev-browser 不可用，可以手动测试：

1. **打开测试页面**
   - 在浏览器中访问 `http://localhost:3000/test-sdk.html`

2. **验证初始状态**
   - 状态显示应为"已连接"（绿色）
   - 日志区域显示"SDK 初始化成功"

3. **测试发送消息功能**
   - 点击"发送测试消息"按钮
   - 等待响应
   - 验证日志中显示"收到响应"消息

4. **测试 chat() 方法**
   - 点击"测试 chat() 方法"按钮
   - 等待响应
   - 验证日志显示响应内容

5. **检查浏览器控制台**
   - 按 F12 打开开发者工具
   - 切换到 Console 标签
   - 确认没有错误消息
   - 查找 [SdkBridge] 前缀的日志

## 验证检查清单

### 后端服务验证

- [ ] 后端进程运行中（`tasklist | findstr ai-bridge.exe`）
- [ ] 端口 8080 监听中（`netstat -ano | findstr :8080`）
- [ ] 健康检查通过（`curl http://localhost:8080/health`）
- [ ] 日志无严重错误（`analyze-logs.bat`）

### 前端服务验证

- [ ] 前端服务运行中（访问 `http://localhost:3000`）
- [ ] SDK 文件可访问（`http://localhost:3000/sdk/ai-bridge-sdk.es.js`）
- [ ] 测试页面可访问（`http://localhost:3000/test-sdk.html`）

### SDK 集成验证

- [ ] 状态显示"已连接"（绿色背景）
- [ ] 浏览器控制台有 [SdkBridge] 日志
- [ ] 可以发送测试消息
- [ ] 收到响应内容
- [ ] chat() 方法正常工作
- [ ] batch() 方法正常工作
- [ ] stream() 方法正常工作
- [ ] 控制台无错误日志

### 网络验证

- [ ] WebSocket 连接成功（检查开发者工具 Network -> WS）
- [ ] HTTP 请求正常（检查 Network -> XHR）
- [ ] 无 CORS 错误
- [ ] 无 404 或 500 错误

## 测试报告格式

完成测试后，生成如下格式的报告：

```markdown
## SDK 测试结果报告

### 测试时间
[YYYY-MM-DD HH:MM:SS]

### 服务状态
- **后端服务**: ✅ 运行中 / ❌ 停止
- **前端服务**: ✅ 运行中 / ❌ 停止
- **健康检查**: ✅ 通过 / ❌ 失败

### SDK 连接
- **连接状态**: ✅ 已连接 / ❌ 未连接 / ⚠️ 连接中
- **初始化**: ✅ 成功 / ❌ 失败

### 功能测试
- **发送消息**: ✅ 通过 / ❌ 失败
- **chat() 方法**: ✅ 通过 / ❌ 失败
- **batch() 方法**: ✅ 通过 / ❌ 失败
- **stream() 方法**: ✅ 通过 / ❌ 失败
- **历史记录**: ✅ 通过 / ❌ 失败

### 错误信息
[如果有错误，详细描述]

### 浏览器控制台日志
[相关的控制台日志内容]

### 修复建议
[如果有问题，提供具体的修复步骤]
```

## 常见问题诊断

### 问题 1: 后端未运行

**症状**: 状态显示"连接中"或"已断开"

**诊断步骤**:
1. 运行 `check-services.bat`
2. 如果后端未运行，运行 `start-backend.bat`
3. 检查后端日志：`analyze-logs.bat`

### 问题 2: CORS 错误

**症状**: 浏览器控制台显示 CORS 相关错误

**诊断步骤**:
1. 检查 `configs/config.yaml` 中的 `cors.origins` 配置
2. 确保 `http://localhost:3000` 在允许列表中
3. 重启后端服务

### 问题 3: WebSocket 连接失败

**症状**: 控制台显示 WebSocket 连接错误

**诊断步骤**:
1. 检查后端 WebSocket 配置：`websocket.enabled: true`
2. 验证端口和路径配置
3. 检查防火墙设置

### 问题 4: SDK 加载失败

**症状**: 页面显示 SDK 初始化失败

**诊断步骤**:
1. 检查 SDK 文件是否存在：`web/public/sdk/ai-bridge-sdk.es.js`
2. 如果不存在，运行：`cd sdk && npm run build`
3. 清除浏览器缓存并重新加载

### 问题 5: 消息发送失败

**症状**: 点击按钮后无响应或返回错误

**诊断步骤**:
1. 检查后端日志是否有错误
2. 验证 API 端点配置
3. 检查网络请求详情（开发者工具 Network 标签）

## 日志分析

### 查看后端日志

运行日志分析脚本：
```batch
.claude\skills\ai-bridge-debug\scripts\analyze-logs.bat
```

### 查看实时日志

在 PowerShell 中：
```powershell
Get-Content logs\ai-bridge-*.log -Wait -Tail 50
```

或在 CMD 中（需要 PowerShell）：
```batch
powershell -Command "Get-Content logs\ai-bridge-*.log -Wait -Tail 50"
```

### 搜索特定错误

搜索错误日志：
```batch
findstr /I "error" logs\ai-bridge-*.log
```

搜索 panic 日志：
```batch
findstr /I "panic fatal" logs\ai-bridge-*.log
```

## 停止服务

测试完成后，停止后端服务：
```batch
.claude\skills\ai-bridge-debug\scripts\stop-backend.bat
```

## 参考资料

- **SDK 测试页面**: `web/public/test-sdk.html`
- **SDK 源代码**: `sdk/src/`
- **后端配置**: `configs/config.yaml`
- **项目文档**: `CLAUDE.md`
- **调试技能**: `.claude/skills/ai-bridge-debug/`
