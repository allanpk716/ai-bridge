# 前端测试参考 / Frontend Testing Reference

## Dev-Browser 技能使用 / Dev-Browser Skill Usage

### 基本浏览器操作 / Basic Browser Operations

dev-browser 技能为测试 AI-Bridge 前端提供持久的浏览器自动化。

### 启动浏览器会话

```
使用 dev-browser 技能：
- 导航到 http://localhost:8080 或配置的 URL
- 检查页面加载状态
- 捕获控制台日志
- 检查网络请求
```

### 检查 WebSocket 连接

```javascript
// 在浏览器控制台中
// 检查 Socket.IO 连接
console.log('Connected:', socket.connected); // 应该是 true
console.log('Socket ID:', socket.id); // 连接 ID

// 监听事件
socket.on('connect', () => console.log('已连接'));
socket.on('disconnect', () => console.log('已断开'));
socket.on('message', (msg) => console.log('消息:', msg));

// 检查传输类型
console.log('Transport:', socket.io.engine.transport.name); // 应该是 "websocket"
```

### 常见前端问题 / Common Frontend Issues

**WebSocket 无法连接：**
- 检查后端配置中的 CORS 设置
- 验证 Socket.IO 客户端版本与服务器匹配
- 检查防火墙/代理是否阻止 WebSocket
- 验证服务器在正确端口运行

**消息未显示：**
- 检查 SSE 流是否活跃：`/api/v1/sessions/:id/messages/stream`
- 验证 `seq` 编号是否递增
- 检查浏览器控制台是否有 JavaScript 错误
- 验证是否订阅了消息事件

**UI 不更新：**
- 检查前端是否使用 `?since=` 参数
- 验证 SSE 连接是否接收事件
- 检查消息渲染中的竞态条件

## 网络测试 / Network Testing

### 使用浏览器 DevTools

1. 打开 DevTools（F12）
2. Network 标签
3. 过滤 WS（WebSocket）或 XHR（HTTP）
4. 检查请求/响应详情

### 使用 curl 手动测试

**测试 SSE 流：**
```bash
curl -N http://localhost:8080/api/v1/sessions/abc123/messages/stream?since=0
```

**测试 WebSocket：**
```bash
# 使用 wscat 或类似工具
wscat -c ws://localhost:8080/socket.io/?EIO=4&transport=websocket
```

**测试 API 端点：**
```bash
# 健康检查
curl http://localhost:8080/health

# 获取 sessions
curl http://localhost:8080/api/v1/sessions

# 创建 session
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"model":"haiku","workingDir":"C:\\WorkSpace\\project"}' \
  http://localhost:8080/api/v1/sessions

# 获取消息
curl http://localhost:8080/api/v1/sessions/abc123/messages?limit=50
```

## 浏览器控制台调试 / Browser Console Debugging

### 检查错误

```javascript
// 获取所有错误
console.error('Errors:', window.errors);

// 监控未处理的错误
window.onerror = (msg, url, line) => {
  console.error('Error:', msg, 'at', url, line);
};

// 监控未处理的 Promise 拒绝
window.onunhandledrejection = (event) => {
  console.error('Unhandled rejection:', event.reason);
};
```

### 检查 API 请求

```javascript
// 监控 fetch 请求
const originalFetch = window.fetch;
window.fetch = (...args) => {
  console.log('Fetch:', args[0], args[1]);
  return originalFetch(...args).then(response => {
    console.log('Response:', response.status, response.statusText);
    return response;
  });
};
```

### 检查 WebSocket 帧

```javascript
// 记录所有 Socket.IO 事件
socket.onAny((eventName, ...args) => {
  console.log('Socket event:', eventName, args);
});

// 记录原始 Socket.IO 数据包
socket.io.on('packet', (packet) => {
  console.log('Packet:', packet);
});
```

## 页面状态检查 / Page State Inspection

### 检查 Session 状态

```javascript
// 获取当前 session
fetch('/api/v1/sessions/current')
  .then(r => r.json())
  .then(data => console.log('Current session:', data))
  .catch(err => console.error('Error:', err));
```

### 检查消息历史

```javascript
// 获取最近 50 条消息
fetch('/api/v1/sessions/abc123/messages?limit=50')
  .then(r => r.json())
  .then(data => {
    console.log('Messages:', data.messages);
    console.log('Latest seq:', data.latestSeq);
    console.log('Has more:', data.hasMore);
  })
  .catch(err => console.error('Error:', err));
```

### 检查权限

```javascript
// 获取待处理权限
fetch('/api/v1/sessions/abc123/permissions')
  .then(r => r.json())
  .then(data => console.log('Pending permissions:', data.permissions))
  .catch(err => console.error('Error:', err));
```

### 检查增量同步

```javascript
// 测试增量同步
let lastSeq = 0;

function fetchNewMessages() {
  return fetch(`/api/v1/sessions/abc123/messages?since=${lastSeq}`)
    .then(r => r.json())
    .then(data => {
      console.log('New messages:', data.messages.length);
      if (data.messages.length > 0) {
        lastSeq = data.latestSeq;
      }
      return data;
    });
}

// 初始加载
fetchNewMessages();

// 轮询新消息（每 5 秒）
setInterval(fetchNewMessages, 5000);
```

## 性能检查 / Performance Checks

### 测量页面加载

```javascript
// 获取页面加载指标
const perfData = performance.getEntriesByType('navigation')[0];
console.log('Load time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
console.log('DOM ready:', perfData.domContentLoadedEventEnd - perfData.fetchStart, 'ms');
console.log('First paint:', perfData.responseStart - perfData.fetchStart, 'ms');
```

### 测量 API 响应时间

```javascript
// 计时 API 调用
function timeApiCall(url) {
  const start = performance.now();
  return fetch(url)
    .then(response => {
      const duration = performance.now() - start;
      console.log(`API call to ${url} took ${duration.toFixed(2)} ms`);
      return response;
    });
}

// 使用
timeApiCall('/api/v1/sessions');
```

### 测量消息渲染性能

```javascript
// 测量大量消息渲染时间
function measureRender(messageCount) {
  const messages = Array(messageCount).fill().map((_, i) => ({
    seq: i,
    content: `Message ${i}`,
    timestamp: new Date().toISOString()
  }));

  const start = performance.now();
  // 假设有一个渲染函数
  renderMessages(messages);
  const duration = performance.now() - start;

  console.log(`Rendered ${messageCount} messages in ${duration.toFixed(2)} ms`);
  console.log(`Average per message: ${(duration / messageCount).toFixed(2)} ms`);
}

// 测试
measureRender(100);
measureRender(1000);
```

## 常见浏览器问题 / Common Browser Issues

### CORS 错误

**症状：**
```
Access to XMLHttpRequest at 'http://localhost:8080/api/v1/sessions'
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**解决方案：**
在 `configs/config.yaml` 中添加前端源：
```yaml
cors:
  origins:
    - "http://localhost:3000"
    - "http://localhost:8080"
```

### 混合内容

**症状：**
```
Mixed content: The page at 'https://example.com' was loaded over HTTPS,
but requested an insecure resource 'http://localhost:8080/api/v1/sessions'
```

**解决方案：**
使用一致的协议（HTTPS 或 HTTP）

### WebSocket 握手失败

**症状：**
```
WebSocket connection to 'ws://localhost:8080/socket.io/' failed
```

**诊断：**
1. 检查服务器端口
2. 检查 CORS 配置
3. 验证 Socket.IO 版本
4. 检查防火墙/代理

### 长轮询回退

**症状：**
WebSocket 回退到长轮询

**检查：**
1. 防火墙设置
2. 代理配置
3. WebSocket 支持

```javascript
// 强制使用 WebSocket
const socket = io('http://localhost:8080', {
  transports: ['websocket'],
  upgrade: false
});
```

## 前端调试模式

### 启用详细日志

```javascript
// Socket.IO 调试
localStorage.debug = 'socket.io-client:*';

// 应用调试
localStorage.setItem('app.debug', 'true');
```

### 捕获所有控制台输出

```javascript
// 捕获所有 console.log
const originalLog = console.log;
console.log = (...args) => {
  originalLog('[LOG]', ...args);
  // 发送到服务器或存储
};

// 捕获所有 console.error
const originalError = console.error;
console.error = (...args) => {
  originalError('[ERROR]', ...args);
  // 发送到服务器或存储
};
```

### 监控内存使用

```javascript
// 定期检查内存
setInterval(() => {
  if (performance.memory) {
    console.log('Memory usage:', {
      used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
      total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
      limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
    });
  }
}, 10000);
```

## 测试清单 / Testing Checklist

### 基本功能
- [ ] 页面加载成功
- [ ] WebSocket 连接建立
- [ ] 可以创建 session
- [ ] 可以发送消息
- [ ] 消息实时更新

### 增量同步
- [ ] 初始加载最近消息
- [ ] 新消息自动出现
- [ ] 历史滚动正常工作
- [ ] seq 编号正确递增

### 错误处理
- [ ] 网络错误显示给用户
- [ ] WebSocket 断开时重连
- [ ] API 错误正确处理
- [ ] 权限请求显示

### 性能
- [ ] 100 条消息渲染快速
- [ ] 1000 条消息可滚动
- [ ] API 响应 < 1 秒
- [ ] 内存使用稳定
