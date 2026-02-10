import type { SdkIncomingMessage, SdkOutgoingMessage, SdkModeConfig } from './types';
import { SdkIncomingMessageSchema } from './types';
import { createSdkMessageHandler, sendResultToSdk } from './messageIntegration';

/**
 * SDK 桥接状态
 */
interface SdkBridgeState {
  isConnected: boolean;
  parentOrigin: string | null;
  pendingMessages: Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>;
}

const state: SdkBridgeState = {
  isConnected: false,
  parentOrigin: null,
  pendingMessages: new Map(),
};

// 创建全局消息处理器实例
const sdkMessageHandler = createSdkMessageHandler();

/**
 * 发送消息到 SDK
 */
export function sendToSdk(message: SdkOutgoingMessage): boolean {
  if (!state.parentOrigin || !window.parent) {
    console.warn('[SdkBridge] Cannot send message: no parent window');
    return false;
  }

  try {
    window.parent.postMessage(message, state.parentOrigin);
    return true;
  } catch (error) {
    console.error('[SdkBridge] Failed to send message:', error);
    return false;
  }
}

/**
 * 处理初始化消息
 */
function handleInitMessage(message: SdkIncomingMessage & { type: 'init' }): void {
  const { payload } = message;

  // 应用主题设置
  if (payload.theme) {
    document.documentElement.setAttribute('data-theme', payload.theme);
  }

  // 存储会话 ID(如果提供)
  if (payload.sessionId) {
    sessionStorage.setItem('sdk:sessionId', payload.sessionId);
  }

  // 发送 ready 确认
  sendToSdk({ type: 'ready' });

  state.isConnected = true;
  console.log('[SdkBridge] Initialized with context:', payload);
}

/**
 * 处理发送消息请求
 */
async function handleSendMessageRequest(message: SdkIncomingMessage & { type: 'sendMessage' }): Promise<void> {
  const { payload: msgPayload } = message;

  try {
    // 使用集成层发送消息
    const result = await sdkMessageHandler.handle(
      msgPayload.text,
      msgPayload.sessionId,
      msgPayload.messageId
    );

    // 发送结果到 SDK(集成层会处理)
    sendResultToSdk(result);
  } catch (error) {
    // 发送错误到 SDK
    sendToSdk({
      type: 'messageResponse',
      payload: {
        messageId: msgPayload.messageId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * 处理断开连接消息
 */
function handleDisconnectMessage(): void {
  state.isConnected = false;
  console.log('[SdkBridge] Disconnected from parent');
}

/**
 * 处理心跳消息
 */
function handleHeartbeat(message: SdkIncomingMessage & { type: 'heartbeat' }): void {
  // 响应心跳确认
  sendToSdk({
    type: 'heartbeatAck',
    payload: {
      timestamp: message.timestamp,
    },
  });
}

/**
 * 设置 SDK 消息监听器
 */
export function setupSdkMessageListener(config: SdkModeConfig): () => void {
  if (!config.isEmbedded) {
    // 不是嵌入模式,不设置监听器
    return () => {};
  }

  state.parentOrigin = config.parentOrigin;

  const messageHandler = (event: MessageEvent): void => {
    // 验证来源
    if (state.parentOrigin && event.origin !== state.parentOrigin) {
      return;
    }

    // 验证消息结构
    try {
      const message = SdkIncomingMessageSchema.parse(event.data);

      switch (message.type) {
        case 'init':
          handleInitMessage(message);
          break;

        case 'sendMessage':
          handleSendMessageRequest(message);
          break;

        case 'disconnect':
          handleDisconnectMessage();
          break;

        case 'heartbeat':
          handleHeartbeat(message);
          break;
      }
    } catch (error) {
      console.warn('[SdkBridge] Invalid message from parent:', error);
    }
  };

  window.addEventListener('message', messageHandler);

  // 返回清理函数
  return () => {
    window.removeEventListener('message', messageHandler);
    state.isConnected = false;
  };
}

/**
 * 发送错误到 SDK
 */
export function sendErrorToSdk(message: string, code?: string): void {
  sendToSdk({
    type: 'error',
    payload: { message, code },
  });
}

/**
 * 获取 SDK 连接状态
 */
export function getSdkConnectionState(): boolean {
  return state.isConnected;
}
