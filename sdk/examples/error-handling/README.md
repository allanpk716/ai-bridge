# 错误处理示例

本示例演示了如何处理 AI-Bridge SDK 中的各种错误情况。

## 运行示例

1. 确保 AI-Bridge Web 应用运行在 http://localhost:3000
2. 在浏览器中打开此 HTML 文件
3. 尝试各种按钮来触发不同的错误情况

## 错误类型

### SDKErrorType

- `IFRAME_NOT_READY` - iframe 未就绪
- `DISCONNECTED` - 连接断开
- `MESSAGE_TIMEOUT` - 消息超时
- `INVALID_RESPONSE` - 无效响应
- `SEND_FAILED` - 发送失败

### ConnectionErrorType

- `NETWORK` - 网络错误
- `TIMEOUT` - 超时
- `IFRAME_LOAD_FAILED` - iframe 加载失败
- `UNAUTHORIZED` - 未授权
- `UNKNOWN` - 未知错误

## 最佳实践

### 1. 始终检查连接状态

```javascript
if (!sdk.connection.isConnected()) {
  // 处理未连接状态
  console.error('SDK not connected');
  return;
}
```

### 2. 使用 try-catch 包裹异步调用

```javascript
try {
  const response = await sdk.sendMessage(text);
  console.log('Success:', response);
} catch (error) {
  if (error.type === SDKErrorType.MESSAGE_TIMEOUT) {
    // 处理超时
    console.error('Message timeout, please retry');
  } else if (error.type === SDKErrorType.DISCONNECTED) {
    // 处理断开连接
    console.error('Connection lost, will auto-reconnect');
  } else {
    // 处理其他错误
    console.error('Error:', error.message);
  }
}
```

### 3. 实现错误回调

```javascript
const sdk = new AIBridgeSDK({
  // ...
  onError: (error) => {
    console.error('SDK Error:', error.message, error.type);

    // 发送到错误追踪服务
    trackError(error);

    // 显示用户友好的错误消息
    showErrorMessage(error);
  },
});
```

### 4. 监听状态变化

```javascript
const sdk = new AIBridgeSDK({
  // ...
  onStateChange: (state) => {
    if (state === ConnectionState.ERROR) {
      // 显示错误 UI
      showErrorUI();
    } else if (state === ConnectionState.CONNECTED) {
      // 隐藏错误 UI
      hideErrorUI();
    }
  },
});
```

### 5. 使用 ready() 方法等待连接

```javascript
try {
  await sdk.ready(10000); // 等待最多 10 秒
  console.log('SDK is ready');
} catch (error) {
  console.error('SDK failed to initialize');
}
```

### 6. 获取诊断信息

```javascript
const diagnostics = sdk.getDiagnostics();
console.log('Connection state:', diagnostics.state);
console.log('Is healthy:', diagnostics.stats.isHealthy);
console.log('Pending messages:', diagnostics.pendingMessages);
console.log('Message history:', diagnostics.messageHistoryLength);
```

## 错误处理流程

### 连接错误处理

1. SDK 检测到连接断开(通过心跳机制)
2. 自动尝试重连(最多 5 次,使用指数退避)
3. 每次重连尝试触发 `reconnecting` 事件
4. 如果所有重连失败,触发 `reconnectFailed` 事件
5. 开发者应监听这些事件并更新 UI

### 消息发送错误处理

1. 验证输入(空消息、长度限制)
2. 检查连接状态
3. 发送消息并等待响应
4. 如果失败,根据错误类型决定是否重试
5. 超时或验证错误不重试
6. 网络错误自动重试(最多 1 次,可配置)

### 重连策略

- **指数退避**: 每次重连延迟时间加倍(1s, 2s, 4s, 8s, 16s)
- **随机抖动**: 添加 0-1 秒随机延迟避免雷鸣效应
- **最大延迟**: 最多等待 30 秒
- **最大尝试**: 最多尝试 5 次

## 示例场景

### 场景 1: 网络断开

```javascript
// SDK 会自动检测并尝试重连
sdk.connection.on((event) => {
  if (event.type === 'reconnecting') {
    console.log(`Reconnecting... (${event.attempt}/${event.maxAttempts})`);
  }
});
```

### 场景 2: 消息超时

```javascript
try {
  await sdk.sendMessage('Hello', { timeout: 5000 });
} catch (error) {
  if (error.type === SDKErrorType.MESSAGE_TIMEOUT) {
    console.log('Request timed out, please try again');
  }
}
```

### 场景 3: 验证错误

```javascript
try {
  await sdk.sendMessage(''); // 空消息
} catch (error) {
  if (error.type === SDKErrorType.INVALID_RESPONSE) {
    console.log('Invalid message:', error.message);
  }
}
```

### 场景 4: 手动重连

```javascript
// 如果自动重连失败,用户可以手动触发
document.getElementById('retry-button').addEventListener('click', () => {
  sdk.connection.reconnect();
});
```

## 调试技巧

### 启用详细日志

SDK 会在控制台输出详细日志:

```
[ConnectionManager] Reconnect attempt 1/5 in 1234ms
[AIBridgeSDK] Reconnecting... (1/5)
```

### 检查连接健康度

```javascript
const isHealthy = sdk.connection.isHealthy();
console.log('Connection healthy:', isHealthy);
```

### 获取统计信息

```javascript
const stats = sdk.connection.getStats();
console.log('State:', stats.state);
console.log('Missed heartbeats:', stats.missedHeartbeats);
console.log('Reconnect attempts:', stats.reconnectAttempts);
```

## 相关文档

- [SDK 主文档](../../README.md)
- [API 参考](../../docs/API.md)
- [安全指南](../../docs/SECURITY.md)
