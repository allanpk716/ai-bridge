# @ai-bridge/sdk

JavaScript/TypeScript SDK for embedding AI-Bridge-Web in external applications via iframe.

## 特性

- **简单的 iframe 嵌入** - 一行代码即可集成
- **双向 postMessage 通信** - 类型安全的消息传递
- **安全验证** - 源地址验证和消息结构验证
- **自动重连** - 心跳检测和断线重连
- **TypeScript 支持** - 完整的类型定义
- **主题定制** - 支持亮色/暗色主题
- **响应式** - 自适应不同屏幕尺寸

## 安装

```bash
npm install @ai-bridge/sdk
```

或使用 CDN:

```html
<script type="module">
  import AIBridgeSDK from 'https://cdn.jsdelivr.net/npm/@ai-bridge/sdk/dist/ai-bridge-sdk.es.js';
</script>
```

## 快速开始

### 基础用法

```typescript
import { AIBridgeSDK } from '@ai-bridge/sdk';

// 初始化 SDK
const sdk = new AIBridgeSDK({
  url: 'https://your-ai-bridge-domain.com',
  targetOrigin: 'https://your-ai-bridge-domain.com',
  onMessage: (message) => {
    console.log('收到消息:', message.content);
  },
  onStateChange: (state) => {
    console.log('连接状态:', state);
  },
});

// 将 iframe 添加到页面
document.getElementById('ai-bridge-container')?.appendChild(sdk.iframe);

// 发送消息
const response = await sdk.sendMessage('你好,Claude!');
console.log('Claude 回复:', response.content);
```

### React 集成

```tsx
import { useEffect, useRef } from 'react';
import { AIBridgeSDK } from '@ai-bridge/sdk';

function AIBridgeComponent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sdkRef = useRef<AIBridgeSDK | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 初始化 SDK
    const sdk = new AIBridgeSDK({
      url: 'https://your-ai-bridge-domain.com',
      targetOrigin: 'https://your-ai-bridge-domain.com',
      context: {
        theme: 'dark',
        locale: 'zh-CN',
      },
    });

    // 添加到 DOM
    containerRef.current.appendChild(sdk.iframe);
    sdkRef.current = sdk;

    // 清理
    return () => {
      sdk.destroy();
    };
  }, []);

  const sendMessage = async () => {
    if (!sdkRef.current) return;

    const response = await sdkRef.current.sendMessage('帮我写一个 React 组件');
    console.log('响应:', response.content);
  };

  return (
    <div>
      <div ref={containerRef} style={{ height: '600px' }} />
      <button onClick={sendMessage}>发送消息</button>
    </div>
  );
}
```

### Vue 集成

```vue
<template>
  <div>
    <div ref="container" style="height: 600px"></div>
    <button @click="sendMessage">发送消息</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { AIBridgeSDK } from '@ai-bridge/sdk';

const container = ref<HTMLDivElement>();
let sdk: AIBridgeSDK | null = null;

onMounted(() => {
  if (!container.value) return;

  sdk = new AIBridgeSDK({
    url: 'https://your-ai-bridge-domain.com',
    targetOrigin: 'https://your-ai-bridge-domain.com',
  });

  container.value.appendChild(sdk.iframe);
});

onUnmounted(() => {
  sdk?.destroy();
});

const sendMessage = async () => {
  if (!sdk) return;
  const response = await sdk.sendMessage('你好!');
  console.log(response.content);
};
</script>
```

## API 参考

### AIBridgeSDK

#### 构造函数

```typescript
new AIBridgeSDK(config: SDKConfig)
```

**参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `url` | `string` | 是 | AI-Bridge-Web 应用的 URL |
| `targetOrigin` | `string` | 是 | 受信任的源地址(用于安全验证) |
| `context` | `SDKContext` | 否 | 初始化上下文 |
| `containerStyle` | `CSSProperties` | 否 | iframe 容器样式 |
| `onMessage` | `(message) => void` | 否 | 消息回调 |
| `onStateChange` | `(state) => void` | 否 | 状态变化回调 |
| `onError` | `(error) => void` | 否 | 错误回调 |

**SDKContext:**

| 参数 | 类型 | 说明 |
|------|------|------|
| `sessionId` | `string` | 指定会话 ID(可选) |
| `theme` | `'light' \| 'dark'` | 主题 |
| `locale` | `string` | 语言 |
| `custom` | `Record<string, unknown>` | 自定义参数 |

#### 方法

##### sendMessage(text)

发送消息到 Claude。

```typescript
async sendMessage(text: string): Promise<MessageResponse>
```

**参数:**
- `text`: 要发送的文本内容

**返回:** `Promise<MessageResponse>` - Claude 的响应

**示例:**
```typescript
try {
  const response = await sdk.sendMessage('帮我分析这段代码');
  console.log(response.content);
  console.log('使用 tokens:', response.metadata?.tokensUsed);
} catch (error) {
  console.error('发送失败:', error);
}
```

##### chat(text)

发送消息的别名方法。

```typescript
async chat(text: string): Promise<MessageResponse>
```

##### getState()

获取当前连接状态。

```typescript
getState(): ConnectionState
```

**返回:** `ConnectionState` - 连接状态

**可能的值:**
- `'connecting'` - 连接中
- `'connected'` - 已连接
- `'disconnected'` - 已断开
- `'error'` - 错误状态

##### destroy()

销毁 SDK 实例,清理资源。

```typescript
destroy(): void
```

#### 属性

##### iframe

SDK 创建的 iframe 元素,可以手动添加到 DOM。

```typescript
const sdk = new AIBridgeSDK(config);
document.body.appendChild(sdk.iframe);
```

### 类型定义

#### ConnectionState

```typescript
enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}
```

#### MessageResponse

```typescript
interface MessageResponse {
  messageId: string;
  success: boolean;
  content?: string;
  error?: string;
  metadata?: {
    model: string;
    tokensUsed: number;
  };
}
```

## 安全注意事项

### 源地址验证

始终设置正确的 `targetOrigin`,不要使用 `*`:

```typescript
// 正确 - 指定具体源地址
const sdk = new AIBridgeSDK({
  url: 'https://ai-bridge.example.com',
  targetOrigin: 'https://ai-bridge.example.com',
});

// 错误 - 使用通配符
const sdk = new AIBridgeSDK({
  url: 'https://ai-bridge.example.com',
  targetOrigin: '*', // 安全风险!
});
```

### 内容安全策略

确保你的服务器设置了正确的 CSP 头:

```
Content-Security-Policy: frame-src https://ai-bridge.example.com
```

## 常见问题

### 消息发送超时

默认超时时间为 30 秒。如果需要调整,可以在初始化时配置:

```typescript
const sdk = new AIBridgeSDK({
  // ... 其他配置
});
// 注意: 当前版本超时时间固定为 30 秒
```

### 连接状态一直是 CONNECTING

检查以下几点:
1. `url` 参数是否正确
2. `targetOrigin` 是否与 URL 匹配
3. 浏览器控制台是否有错误信息
4. 网络连接是否正常

### 在 React 中使用时出现内存泄漏

确保在组件卸载时调用 `destroy()`:

```typescript
useEffect(() => {
  const sdk = new AIBridgeSDK(config);

  return () => {
    sdk.destroy(); // 重要!
  };
}, []);
```

## 示例

查看 [examples](./examples) 目录获取更多集成示例:
- [React 示例](./examples/react)
- [Vue 示例](./examples/vue)
- [原生 JavaScript 示例](./examples/vanilla)

## 许可证

MIT
