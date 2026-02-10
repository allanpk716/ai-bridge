# SDK 集成测试指南

## 前提条件

1. **启动开发服务器**
   ```bash
   cd web
   npm run dev
   ```
   服务器应运行在 `http://localhost:3000`

2. **构建 SDK**
   ```bash
   cd sdk
   npm run build
   ```
   这将生成 `web/public/sdk/ai-bridge-sdk.es.js`

## 测试方法

### 方法 1：手动测试

1. **打开测试页面**
   - 在浏览器地址栏输入：`http://localhost:3000/test-sdk.html`
   - ⚠️ **不要**直接双击 HTML 文件！

2. **观察连接状态**
   - 初始状态：`连接中...`（黄色）
   - 5-10 秒后应变为：`已连接`（绿色）

3. **检查控制台日志**
   应该看到以下日志：
   ```
   [SDK Test] 页面加载完成,初始化 SDK...
   [SdkMessageListener] Running in embedded mode
   [SdkBridge] Detected parent origin from first message: http://localhost:3000
   [SdkBridge] Initialized with context: ...
   ```

4. **测试功能按钮**
   - 点击"发送测试消息" - 应该收到响应
   - 点击"测试 chat() 方法" - 应该返回 AI 回复
   - 点击"查看历史" - 显示消息历史

### 方法 2：自动化测试

运行集成测试脚本：
```bash
node web/scripts/test-sdk-integration.cjs
```

这会检查：
- 服务器是否运行
- SDK 文件是否存在
- 配置是否正确

### 方法 3：诊断工具

如果遇到问题，访问诊断页面：
```
http://localhost:3000/diagnose.html
```

这会显示：
- 页面访问方式是否正确（HTTP vs file://）
- Origin 信息
- 服务器状态
- 推荐的修复步骤

## 常见问题

### 问题 1：Connection Failed

**原因**：直接双击 HTML 文件打开（file:// 协议）

**解决方法**：
1. 在浏览器地址栏输入：`http://localhost:3000/test-sdk.html`
2. 不要直接双击文件

### 问题 2：SDK 文件未找到 (404)

**原因**：SDK 未构建

**解决方法**：
```bash
cd sdk
npm run build
```

### 问题 3：CORS 错误

**原因**：页面通过 file:// 协议访问

**解决方法**：使用 HTTP 服务器访问页面

### 问题 4：Invalid target origin 'null'

**原因**：document.referrer 为空，无法获取 parentOrigin

**解决方法**：这已自动处理，SDK 会从第一条消息获取 origin

## 架构说明

### 消息流程

1. **初始化**
   ```
   父页面 (test-sdk.html)
   ├── 创建 iframe (http://localhost:3000/?embed=true)
   └── SDK 发送 'init' 消息
       ↓
   iframe (Web 应用)
   ├── 检测到嵌入模式
   ├── 设置消息监听器
   └── 发送 'ready' 消息
       ↓
   父页面
   └── 连接状态变为 CONNECTED
   ```

2. **发送消息**
   ```
   父页面
   ├── 点击按钮
   └── 发送 'sendMessage' 消息
       ↓
   iframe
   ├── 处理消息
   ├── 调用 AI-Bridge 后端 API
   └── 返回 'messageResponse'
       ↓
   父页面
   └── 显示响应
   ```

### 关键组件

- **SDK (`sdk/`)**: 父页面端的封装，提供 iframe 管理和消息发送 API
- **SDK Bridge (`web/src/sdk-bridge/`)**: iframe 端的桥接层，处理来自 SDK 的消息
- **测试页面 (`web/public/test-sdk.html`)**: 完整的示例和测试界面

## 调试技巧

### 1. 检查 iframe 内容
在测试页面打开控制台，选择 iframe 上下文：
```javascript
// 在父页面控制台
const iframe = document.querySelector('iframe');
iframe.contentWindow.postMessage({ type: 'test' }, '*');
```

### 2. 监听所有消息
在任一页面添加：
```javascript
window.addEventListener('message', (event) => {
  console.log('Message received:', event);
});
```

### 3. 检查连接状态
在测试页面控制台：
```javascript
// 检查 SDK 状态
console.log(sdk.getState());
console.log(sdk.getDiagnostics());
```

## 下一步

- [ ] 添加单元测试（Jest）
- [ ] 添加 E2E 测试（Playwright）
- [ ] 实现流式响应（stream）
- [ ] 添加错误重试机制
- [ ] 实现会话恢复
