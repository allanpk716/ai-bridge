import { z } from 'zod';
import type { SdkMessage, IframeResponse } from '../types/messages';
import {
  SdkMessageSchema,
  IframeResponseSchema,
} from '../types/messages';

/**
 * 消息处理器类型
 */
export type MessageHandler = (message: IframeResponse) => void;

/**
 * 桥接配置
 */
export interface BridgeConfig {
  /** 目标源地址 */
  targetOrigin: string;
  /** 获取 iframe contentWindow */
  getContentWindow: () => Window | null;
  /** 消息处理回调 */
  onMessage: MessageHandler;
  /** 错误回调 */
  onError?: (error: Error) => void;
}

/**
 * 消息队列项
 */
interface PendingMessage {
  resolve: (value: IframeResponse) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

/**
 * postMessage 桥接器
 *
 * 处理 SDK 与 iframe 之间的双向通信,
 * 包括消息验证、超时处理和请求-响应匹配。
 */
export class MessageBridge {
  private config: BridgeConfig;
  private messageQueue: Map<string, PendingMessage> = new Map();
  private messageId = 0;
  private messageHandler: ((event: MessageEvent) => void) | null = null;
  private isListening = false;

  constructor(config: BridgeConfig) {
    this.config = config;
  }

  /**
   * 启动桥接器
   */
  start(): void {
    if (this.isListening) {
      return;
    }

    this.messageHandler = this.handleMessage.bind(this);
    window.addEventListener('message', this.messageHandler);
    this.isListening = true;
  }

  /**
   * 停止桥接器
   */
  stop(): void {
    if (!this.isListening) {
      return;
    }

    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
      this.messageHandler = null;
    }

    // 清理所有待处理消息
    this.messageQueue.forEach(({ timeout, reject }) => {
      clearTimeout(timeout);
      reject(new Error('Bridge stopped'));
    });
    this.messageQueue.clear();

    this.isListening = false;
  }

  /**
   * 处理来自 iframe 的消息
   */
  private handleMessage(event: MessageEvent): void {
    // 验证来源
    if (event.origin !== this.config.targetOrigin) {
      return;
    }

    // 验证消息结构
    try {
      const response = IframeResponseSchema.parse(event.data);

      // 触发回调
      this.config.onMessage(response);

      // 处理待处理的请求
      if (response.type === 'messageResponse') {
        const pending = this.messageQueue.get(response.payload.messageId);
        if (pending) {
          clearTimeout(pending.timeout);
          this.messageQueue.delete(response.payload.messageId);
          pending.resolve(response);
        }
      } else if (response.type === 'ready') {
        // 处理 init 消息的 ready 响应
        // init 消息的 messageId 格式是 bridge_timestamp_index
        // 找到最早的一个待处理的请求（应该是 init）
        for (const [messageId, pending] of this.messageQueue.entries()) {
          if (messageId.startsWith('bridge_')) {
            clearTimeout(pending.timeout);
            this.messageQueue.delete(messageId);
            pending.resolve(response);
            break; // 只处理第一个匹配的（init 应该是第一个）
          }
        }
      }
      // heartbeatAck 响应由 ConnectionManager 单独处理，不需要在这里 resolve
    } catch (error) {
      // 无效消息,忽略
      console.warn('[MessageBridge] Invalid message:', error);
    }
  }

  /**
   * 发送消息并等待响应
   */
  async sendAndWait(message: SdkMessage, timeout = 30000): Promise<IframeResponse> {
    return new Promise((resolve, reject) => {
      // 如果消息没有 messageId,生成一个
      let actualMessageId: string;

      if (message.type === 'sendMessage') {
        actualMessageId = message.payload.messageId;
      } else {
        actualMessageId = `bridge_${Date.now()}_${this.messageId++}`;
      }

      const timeoutId = setTimeout(() => {
        this.messageQueue.delete(actualMessageId);
        reject(new Error(`Message timeout: ${message.type}`));
      }, timeout);

      this.messageQueue.set(actualMessageId, {
        resolve: resolve as any,
        reject,
        timeout: timeoutId,
      });

      this.send(message);
    });
  }

  /**
   * 发送消息(不等待响应)
   */
  send(message: SdkMessage): boolean {
    const win = this.config.getContentWindow();
    if (!win) {
      this.config.onError?.(new Error('Iframe not available'));
      return false;
    }

    try {
      // 验证消息结构
      SdkMessageSchema.parse(message);

      win.postMessage(message, this.config.targetOrigin);
      return true;
    } catch (error) {
      this.config.onError?.(error as Error);
      return false;
    }
  }

  /**
   * 获取消息 ID(用于请求-响应匹配)
   */
  private getMessageId(message: SdkMessage): string | null {
    if (message.type === 'sendMessage') {
      return message.payload.messageId;
    }
    return null;
  }

  /**
   * 获取待处理消息数量
   */
  getPendingCount(): number {
    return this.messageQueue.size;
  }

  /**
   * 是否正在监听
   */
  isActive(): boolean {
    return this.isListening;
  }
}
