import type { SDKConfig, SdkMessageResponse } from '../types/config';
import type { SdkMessage, IframeResponse, MessageResponse } from '../types/messages';
import { IframeManager } from './IframeManager';
import { MessageBridge } from './Bridge';
import { ConnectionManager, ConnectionState, ConnectionError } from './Connection';

/**
 * SDK 错误类型
 */
export enum SDKErrorType {
  /** iframe 未就绪 */
  IFRAME_NOT_READY = 'IFRAME_NOT_READY',
  /** 连接断开 */
  DISCONNECTED = 'DISCONNECTED',
  /** 消息超时 */
  MESSAGE_TIMEOUT = 'MESSAGE_TIMEOUT',
  /** 无效响应 */
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  /** 发送失败 */
  SEND_FAILED = 'SEND_FAILED',
}

/**
 * SDK 错误
 */
export class SDKError extends Error {
  constructor(
    public type: SDKErrorType,
    message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'SDKError';
  }
}

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
  private bridge: MessageBridge;
  private config: SDKConfig;
  private messageId = 0;
  private messageHistory: MessageResponse[] = [];

  // iframe 元素引用
  public readonly iframe: HTMLIFrameElement;

  // 暴露 connection 供外部访问
  public readonly connection: ConnectionManager;

  constructor(config: SDKConfig) {
    this.config = config;
    this.iframeManager = new IframeManager(config);
    this.iframe = this.iframeManager.createIframe();

    // 创建桥接器
    this.bridge = new MessageBridge({
      targetOrigin: config.targetOrigin,
      getContentWindow: () => this.iframeManager.getContentWindow(),
      onMessage: this.handleBridgeMessage.bind(this),
      onError: config.onError,
    });

    // 创建连接管理器
    this.connection = new ConnectionManager(
      () => this.iframeManager.getContentWindow(),
      config.targetOrigin
    );

    // 监听连接状态变化
    this.connection.on((event) => {
      switch (event.type) {
        case 'stateChange':
          this.config.onStateChange?.(event.state);

          // 如果从连接状态变为断开,通知等待中的消息
          if (event.state === ConnectionState.DISCONNECTED ||
              event.state === ConnectionState.ERROR) {
            this.rejectPendingMessages(new SDKError(
              SDKErrorType.DISCONNECTED,
              'Connection lost while waiting for response'
            ));
          }
          break;

        case 'error':
          // 转换连接错误为 SDK 错误
          this.config.onError?.(new SDKError(
            SDKErrorType.DISCONNECTED,
            event.error.message,
            event.error
          ));
          break;

        case 'reconnecting':
          console.log(`[AIBridgeSDK] Reconnecting... (${event.attempt}/${event.maxAttempts})`);
          break;

        case 'reconnectFailed':
          this.config.onError?.(new SDKError(
            SDKErrorType.DISCONNECTED,
            'Reconnection failed',
            event.error
          ));
          break;
      }
    });

    this.init();
  }

  /**
   * 初始化 SDK
   */
  private async init(): Promise<void> {
    try {
      // 等待 iframe 加载
      await this.iframeManager.waitForLoad();

      // 启动桥接器
      this.bridge.start();

      // 启动连接管理器
      this.connection.start();

      // 发送初始化消息
      await this.sendInitMessage();

    } catch (error) {
      this.config.onError?.(error as Error);
    }
  }

  /**
   * 处理来自桥接器的消息
   */
  private handleBridgeMessage(response: IframeResponse): void {
    switch (response.type) {
      case 'ready':
        // 连接管理器会处理状态变化
        break;

      case 'messageResponse':
        this.config.onMessage?.(response.payload);
        break;

      case 'error':
        this.config.onError?.(new Error(response.payload.message));
        break;

      case 'heartbeatAck':
        this.connection.handleHeartbeatAck();
        break;
    }
  }

  /**
   * 发送初始化消息
   */
  private async sendInitMessage(): Promise<void> {
    const message: SdkMessage = {
      type: 'init',
      payload: {
        sessionId: this.config.context?.sessionId,
        theme: this.config.context?.theme ?? 'light',
        locale: this.config.context?.locale ?? 'zh-CN',
      },
    };

    await this.bridge.sendAndWait(message, 5000);
  }

  /**
   * 发送消息到 Claude
   */
  async sendMessage(text: string, options?: {
    timeout?: number;
    retry?: number;
  }): Promise<MessageResponse> {
    const timeout = options?.timeout ?? 30000;
    const maxRetries = options?.retry ?? 1;

    // 检查连接状态
    if (!this.connection.isConnected()) {
      throw new SDKError(
        SDKErrorType.DISCONNECTED,
        'SDK not connected. Wait for the connection to be established.',
      );
    }

    // 验证输入
    if (!text || text.trim().length === 0) {
      throw new SDKError(
        SDKErrorType.INVALID_RESPONSE,
        'Message text cannot be empty',
      );
    }

    if (text.length > 10000) {
      throw new SDKError(
        SDKErrorType.INVALID_RESPONSE,
        'Message text too long (max 10000 characters)',
      );
    }

    let lastError: Error | null = null;

    // 重试逻辑
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const messageId = `msg_${Date.now()}_${this.messageId++}`;

        const message: SdkMessage = {
          type: 'sendMessage',
          payload: {
            text,
            sessionId: this.config.context?.sessionId,
            messageId,
          },
        };

        const response = await this.bridge.sendAndWait(message, timeout);

        if (response.type === 'messageResponse') {
          const messageResponse = response.payload;

          // 记录到历史
          this.messageHistory.push(messageResponse);

          // 触发回调
          this.config.onMessage?.(messageResponse);

          return messageResponse;
        } else {
          throw new SDKError(
            SDKErrorType.INVALID_RESPONSE,
            `Unexpected response type: ${response.type}`,
          );
        }
      } catch (error) {
        lastError = error as Error;

        // 如果是最后一次尝试,不继续重试
        if (attempt === maxRetries) {
          break;
        }

        // 某些错误不应该重试
        if (error instanceof SDKError) {
          if (error.type === SDKErrorType.INVALID_RESPONSE) {
            break;
          }
        }

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }

    // 所有重试都失败
    throw new SDKError(
      SDKErrorType.SEND_FAILED,
      `Failed to send message after ${maxRetries + 1} attempts`,
      lastError
    );
  }

  /**
   * 发送文本消息(简化版)
   *
   * @param text - 要发送的文本内容
   * @returns Promise<MessageResponse> Claude 的响应
   *
   * @example
   * const response = await sdk.chat('Hello, Claude!');
   * console.log(response.content);
   */
  async chat(text: string): Promise<MessageResponse> {
    return this.sendMessage(text);
  }

  /**
   * 批量发送消息
   *
   * @param messages - 消息数组
   * @returns Promise<MessageResponse[]> 所有响应
   *
   * @example
   * const responses = await sdk.batch([
   *   'First message',
   *   'Second message',
   * ]);
   */
  async batch(messages: string[]): Promise<MessageResponse[]> {
    const responses: MessageResponse[] = [];

    for (const message of messages) {
      const response = await this.sendMessage(message);
      responses.push(response);
    }

    return responses;
  }

  /**
   * 流式发送消息(带回调)
   *
   * @param text - 要发送的文本
   * @param callbacks - 回调函数
   * @returns Promise<MessageResponse> 最终响应
   *
   * @example
   * await sdk.stream('Long message...', {
   *   onProgress: (delta) => console.log('Received:', delta),
   *   onComplete: (response) => console.log('Done:', response),
   * });
   */
  async stream(
    text: string,
    callbacks?: {
      onProgress?: (delta: string) => void;
      onComplete?: (response: MessageResponse) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<MessageResponse> {
    try {
      const response = await this.sendMessage(text);
      callbacks?.onComplete?.(response);
      return response;
    } catch (error) {
      callbacks?.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * 获取消息历史
   */
  getMessageHistory(): MessageResponse[] {
    return [...this.messageHistory];
  }

  /**
   * 清空消息历史
   */
  clearHistory(): void {
    this.messageHistory = [];
  }

  /**
   * 拒绝所有待处理的消息
   */
  private rejectPendingMessages(error: SDKError): void {
    // 注意: 这需要在 Bridge 类中实现获取待处理消息的方法
    // 或者在这里维护一个额外的消息队列
    this.config.onError?.(error);
  }

  /**
   * 检查 SDK 是否可用
   */
  isAvailable(): boolean {
    return this.connection.isConnected() &&
      this.bridge.isActive();
  }

  /**
   * 等待 SDK 连接就绪
   */
  async ready(timeout = 30000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connection.isConnected()) {
        resolve();
        return;
      }

      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new SDKError(
          SDKErrorType.MESSAGE_TIMEOUT,
          'SDK ready timeout'
        ));
      }, timeout);

      const unsubscribe = this.connection.on((event) => {
        if (event.type === 'stateChange' &&
            event.state === ConnectionState.CONNECTED) {
          cleanup();
          resolve();
        } else if (event.type === 'reconnectFailed') {
          cleanup();
          reject(new SDKError(
            SDKErrorType.DISCONNECTED,
            'Failed to connect'
          ));
        }
      });

      const cleanup = () => {
        clearTimeout(timeoutId);
        unsubscribe();
      };
    });
  }

  /**
   * 获取诊断信息
   */
  getDiagnostics() {
    return {
      state: this.connection.getState(),
      stats: this.connection.getStats(),
      pendingMessages: this.bridge.getPendingCount(),
      messageHistoryLength: this.messageHistory.length,
      iframeAttached: !!this.iframe.parentNode,
    };
  }

  /**
   * 销毁 SDK
   */
  destroy(): void {
    this.bridge.stop();
    this.connection.stop();
    this.iframeManager.destroy();
  }

  /**
   * 获取当前连接状态
   */
  getState(): ConnectionState {
    return this.connection.getState();
  }
}
