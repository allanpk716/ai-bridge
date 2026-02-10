/**
 * 连接状态枚举
 */
export declare enum ConnectionState {
    /** 连接中 */
    CONNECTING = "connecting",
    /** 已连接 */
    CONNECTED = "connected",
    /** 已断开 */
    DISCONNECTED = "disconnected",
    /** 错误状态 */
    ERROR = "error"
}
/**
 * SDK 事件类型
 */
export type SDKEvent = {
    type: 'ready';
} | {
    type: 'stateChange';
    state: ConnectionState;
} | {
    type: 'error';
    error: Error;
} | {
    type: 'message';
    message: SdkMessageResponse;
};
/**
 * 消息响应类型(从 config.ts 重新导出以保持模块一致性)
 */
export interface SdkMessageResponse {
    messageId: string;
    success: boolean;
    content?: string;
    error?: string;
    metadata?: {
        model: string;
        tokensUsed: number;
        duration: number;
    };
}
//# sourceMappingURL=events.d.ts.map