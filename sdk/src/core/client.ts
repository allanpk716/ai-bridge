import type { SDKConfig, SdkMessageResponse } from '../types/config';
import type { SdkMessage, IframeResponse, MessageResponse } from '../types/messages';
import { IframeManager } from './IframeManager';
import { MessageBridge } from './Bridge';
import { ConnectionManager, ConnectionState } from './Connection';

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
  private connection: ConnectionManager;
  private config: SDKConfig;
  private messageId = 0;

  // iframe 元素引用
  public readonly iframe: HTMLIFrameElement;

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
      if (event.type === 'stateChange') {
        this.config.onStateChange?.(event.state);
      } else if (event.type === 'error') {
        this.config.onError?.(event.error);
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
  async sendMessage(text: string): Promise<MessageResponse> {
    if (!this.connection.isConnected()) {
      throw new Error('SDK not connected');
    }

    const messageId = `msg_${Date.now()}_${this.messageId++}`;

    const message: SdkMessage = {
      type: 'sendMessage',
      payload: {
        text,
        sessionId: this.config.context?.sessionId,
        messageId,
      },
    };

    const response = await this.bridge.sendAndWait(message, 30000);

    if (response.type === 'messageResponse') {
      return response.payload;
    }

    throw new Error('Unexpected response type');
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
