import { ConnectionState } from '../types/events';
import type { SDKConfig, SdkMessageResponse } from '../types/config';
import type { SdkMessage, IframeResponse, MessageResponse } from '../types/messages';
import { IframeResponseSchema, SdkMessageSchema } from '../types/messages';
import { z } from 'zod';
import { IframeManager } from './IframeManager';

/**
 * AI-Bridge SDK 主客户端类
 *
 * @example
 * const sdk = new AIBridgeSDK({
 *   url: 'https://ai-bridge.example.com',
 *   targetOrigin: 'https://ai-bridge.example.com',
 * });
 * document.body.appendChild(sdk.iframe);
 */
export class AIBridgeSDK {
  private iframeManager: IframeManager;
  private config: SDKConfig;
  private state: ConnectionState = ConnectionState.CONNECTING;
  private messageQueue: Map<string, {
    resolve: (value: MessageResponse) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }> = new Map();
  private messageId = 0;
  private messageHandler: ((event: MessageEvent) => void) | null = null;

  // iframe 元素引用(便于外部挂载)
  public readonly iframe: HTMLIFrameElement;

  constructor(config: SDKConfig) {
    this.config = config;
    this.iframeManager = new IframeManager(config);
    this.iframe = this.iframeManager.createIframe();

    this.init();
  }

  /**
   * 初始化 SDK
   */
  private async init(): Promise<void> {
    try {
      // 等待 iframe 加载
      await this.iframeManager.waitForLoad();

      // 设置消息监听器
      this.setupMessageListener();

      // 发送初始化消息
      this.sendInitMessage();

    } catch (error) {
      this.setState(ConnectionState.ERROR);
      this.config.onError?.(error as Error);
    }
  }

  /**
   * 设置 postMessage 消息监听器
   */
  private setupMessageListener(): void {
    this.messageHandler = this.handleMessage.bind(this);
    window.addEventListener('message', this.messageHandler);
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

      switch (response.type) {
        case 'ready':
          this.setState(ConnectionState.CONNECTED);
          break;

        case 'messageResponse':
          this.handleMessageResponse(response.payload);
          break;

        case 'error':
          this.handleError(response.payload);
          break;
      }
    } catch (error) {
      // 忽略无效消息
      console.warn('[AIBridgeSDK] Invalid message received:', error);
    }
  }

  /**
   * 处理消息响应
   */
  private handleMessageResponse(response: MessageResponse): void {
    const pending = this.messageQueue.get(response.messageId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.messageQueue.delete(response.messageId);
      pending.resolve(response);
    }

    // 触发消息回调
    this.config.onMessage?.(response as SdkMessageResponse);
  }

  /**
   * 处理错误
   */
  private handleError(errorPayload: { message: string; code?: string }): void {
    const error = new Error(errorPayload.message);
    this.config.onError?.(error);
  }

  /**
   * 发送初始化消息
   */
  private sendInitMessage(): void {
    const message: SdkMessage = {
      type: 'init',
      payload: {
        sessionId: this.config.context?.sessionId,
        theme: this.config.context?.theme ?? 'light',
        locale: this.config.context?.locale ?? 'zh-CN',
      },
    };

    this.postMessage(message);
  }

  /**
   * 发送 postMessage
   */
  private postMessage(message: SdkMessage): void {
    const win = this.iframeManager.getContentWindow();
    if (win) {
      win.postMessage(message, this.config.targetOrigin);
    }
  }

  /**
   * 设置连接状态
   */
  private setState(state: ConnectionState): void {
    if (this.state !== state) {
      this.state = state;
      this.config.onStateChange?.(state);
    }
  }

  /**
   * 发送消息到 Claude
   */
  async sendMessage(text: string): Promise<MessageResponse> {
    if (this.state !== ConnectionState.CONNECTED) {
      throw new Error('SDK not connected');
    }

    const messageId = `msg_${Date.now()}_${this.messageId++}`;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.messageQueue.delete(messageId);
        reject(new Error('Message timeout'));
      }, 30000);

      this.messageQueue.set(messageId, { resolve, reject, timeout });

      const message: SdkMessage = {
        type: 'sendMessage',
        payload: {
          text,
          sessionId: this.config.context?.sessionId,
          messageId,
        },
      };

      this.postMessage(message);
    });
  }

  /**
   * 销毁 SDK
   */
  destroy(): void {
    // 移除消息监听器
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
    }

    // 清理消息队列
    this.messageQueue.forEach(({ timeout }) => clearTimeout(timeout));
    this.messageQueue.clear();

    // 销毁 iframe
    this.iframeManager.destroy();

    this.setState(ConnectionState.DISCONNECTED);
  }

  /**
   * 获取当前连接状态
   */
  getState(): ConnectionState {
    return this.state;
  }
}
