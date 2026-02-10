import { SDKConfig } from '../types/config';
import { MessageResponse } from '../types/messages';
import { ConnectionManager, ConnectionState } from './Connection';
/**
 * SDK 错误类型
 */
export declare enum SDKErrorType {
    /** iframe 未就绪 */
    IFRAME_NOT_READY = "IFRAME_NOT_READY",
    /** 连接断开 */
    DISCONNECTED = "DISCONNECTED",
    /** 消息超时 */
    MESSAGE_TIMEOUT = "MESSAGE_TIMEOUT",
    /** 无效响应 */
    INVALID_RESPONSE = "INVALID_RESPONSE",
    /** 发送失败 */
    SEND_FAILED = "SEND_FAILED"
}
/**
 * SDK 错误
 */
export declare class SDKError extends Error {
    type: SDKErrorType;
    originalError?: unknown | undefined;
    constructor(type: SDKErrorType, message: string, originalError?: unknown | undefined);
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
export declare class AIBridgeSDK {
    private iframeManager;
    private bridge;
    private config;
    private messageId;
    private messageHistory;
    readonly iframe: HTMLIFrameElement;
    readonly connection: ConnectionManager;
    constructor(config: SDKConfig);
    /**
     * 初始化 SDK
     */
    private init;
    /**
     * 处理来自桥接器的消息
     */
    private handleBridgeMessage;
    /**
     * 发送初始化消息
     */
    private sendInitMessage;
    /**
     * 发送消息到 Claude
     */
    sendMessage(text: string, options?: {
        timeout?: number;
        retry?: number;
    }): Promise<MessageResponse>;
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
    chat(text: string): Promise<MessageResponse>;
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
    batch(messages: string[]): Promise<MessageResponse[]>;
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
    stream(text: string, callbacks?: {
        onProgress?: (delta: string) => void;
        onComplete?: (response: MessageResponse) => void;
        onError?: (error: Error) => void;
    }): Promise<MessageResponse>;
    /**
     * 获取消息历史
     */
    getMessageHistory(): MessageResponse[];
    /**
     * 清空消息历史
     */
    clearHistory(): void;
    /**
     * 拒绝所有待处理的消息
     */
    private rejectPendingMessages;
    /**
     * 检查 SDK 是否可用
     */
    isAvailable(): boolean;
    /**
     * 等待 SDK 连接就绪
     */
    ready(timeout?: number): Promise<void>;
    /**
     * 获取诊断信息
     */
    getDiagnostics(): {
        state: ConnectionState;
        stats: {
            state: ConnectionState;
            missedHeartbeats: number;
            reconnectAttempts: number;
            isHealthy: boolean;
        };
        pendingMessages: number;
        messageHistoryLength: number;
        iframeAttached: boolean;
    };
    /**
     * 销毁 SDK
     */
    destroy(): void;
    /**
     * 获取当前连接状态
     */
    getState(): ConnectionState;
}
//# sourceMappingURL=client.d.ts.map