import { SdkMessage, IframeResponse } from '../types/messages';
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
 * postMessage 桥接器
 *
 * 处理 SDK 与 iframe 之间的双向通信,
 * 包括消息验证、超时处理和请求-响应匹配。
 */
export declare class MessageBridge {
    private config;
    private messageQueue;
    private messageId;
    private messageHandler;
    private isListening;
    constructor(config: BridgeConfig);
    /**
     * 启动桥接器
     */
    start(): void;
    /**
     * 停止桥接器
     */
    stop(): void;
    /**
     * 处理来自 iframe 的消息
     */
    private handleMessage;
    /**
     * 发送消息并等待响应
     */
    sendAndWait(message: SdkMessage, timeout?: number): Promise<IframeResponse>;
    /**
     * 发送消息(不等待响应)
     */
    send(message: SdkMessage): boolean;
    /**
     * 获取消息 ID(用于请求-响应匹配)
     */
    private getMessageId;
    /**
     * 获取待处理消息数量
     */
    getPendingCount(): number;
    /**
     * 是否正在监听
     */
    isActive(): boolean;
}
//# sourceMappingURL=Bridge.d.ts.map