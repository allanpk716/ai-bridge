import { toast } from 'sonner';
import { z } from 'zod';
import type { SdkIncomingMessage, SdkOutgoingMessage, SdkModeConfig } from './types';
import {
  SdkIncomingMessageSchema,
  SdkOutgoingMessageSchema,
} from './types';

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

/**
 * 发送消息到 SDK
 */
function sendToSdk(message: SdkOutgoingMessage): boolean {
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
    // TODO: 实现实际的消息发送逻辑
    // 这里需要调用现有的消息发送 API
    // 暂时使用模拟响应

    const response = await sendToClaude(msgPayload.text, msgPayload.sessionId);

    sendToSdk({
      type: 'messageResponse',
      payload: {
        messageId: msgPayload.messageId,
        success: true,
        content: response.content,
        metadata: response.metadata,
      },
    });
  } catch (error) {
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
 * 发送消息到 Claude(占位实现)
 */
async function sendToClaude(text: string, sessionId?: string): Promise<{
  content: string;
  metadata: {
    model: string;
    tokensUsed: number;
  };
}> {
  // TODO: 集成现有的 API 调用
  // 这里需要使用 web/src/lib/api/ 中的 API 函数

  // 暂时返回模拟响应
  return {
    content: `这是对 "${text}" 的模拟响应。实际实现需要集成 API。`,
    metadata: {
      model: 'haiku',
      tokensUsed: text.length + 10,
    },
  };
}

/**
 * 处理断开连接消息
 */
function handleDisconnectMessage(): void {
  state.isConnected = false;
  console.log('[SdkBridge] Disconnected from parent');
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
