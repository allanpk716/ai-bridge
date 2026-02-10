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
 * 错误类型
 */
export declare enum ConnectionErrorType {
    /** 网络错误 */
    NETWORK = "network",
    /** 超时 */
    TIMEOUT = "timeout",
    /** iframe 加载失败 */
    IFRAME_LOAD_FAILED = "iframe_load_failed",
    /** 未授权 */
    UNAUTHORIZED = "unauthorized",
    /** 未知错误 */
    UNKNOWN = "unknown"
}
/**
 * 连接错误
 */
export declare class ConnectionError extends Error {
    type: ConnectionErrorType;
    retryable: boolean;
    constructor(type: ConnectionErrorType, message: string, retryable?: boolean);
}
/**
 * 连接事件类型
 */
export type ConnectionEvent = {
    type: 'stateChange';
    state: ConnectionState;
} | {
    type: 'error';
    error: ConnectionError;
    attempts?: number;
} | {
    type: 'heartbeat';
} | {
    type: 'reconnecting';
    attempt: number;
    maxAttempts: number;
} | {
    type: 'reconnectFailed';
    error: ConnectionError;
};
/**
 * 连接事件监听器
 */
export type ConnectionListener = (event: ConnectionEvent) => void;
/**
 * 连接管理器配置
 */
export interface ConnectionManagerConfig {
    /** 心跳间隔(毫秒) */
    heartbeatInterval?: number;
    /** 最大丢失心跳数 */
    maxMissedHeartbeats?: number;
    /** 重连延迟(毫秒) */
    reconnectDelay?: number;
    /** 最大重连次数 */
    maxReconnectAttempts?: number;
}
/**
 * 连接管理器
 *
 * 负责监控与 iframe 的连接状态,
 * 使用心跳机制检测连接断开,
 * 并自动尝试重连。
 */
export declare class ConnectionManager {
    private config;
    private state;
    private listeners;
    private heartbeatTimer;
    private missedHeartbeats;
    private reconnectAttempts;
    private reconnectTimer;
    private getContentWindow;
    private targetOrigin;
    constructor(getContentWindow: () => Window | null, targetOrigin: string, config?: ConnectionManagerConfig);
    /**
     * 启动连接管理器
     */
    start(): void;
    /**
     * 停止连接管理器
     */
    stop(): void;
    /**
     * 添加事件监听器
     */
    on(listener: ConnectionListener): () => void;
    /**
     * 发送心跳消息
     */
    private sendHeartbeat;
    /**
     * 处理心跳响应
     */
    handleHeartbeatAck(): void;
    /**
     * 处理丢失的心跳
     */
    private handleMissedHeartbeat;
    /**
     * 处理断开连接
     */
    private handleDisconnection;
    /**
     * 尝试重连
     */
    private attemptReconnect;
    /**
     * 处理致命错误
     */
    private handleFatalError;
    /**
     * 处理可恢复错误
     */
    private handleRecoverableError;
    /**
     * 重置重连计数
     */
    resetReconnectAttempts(): void;
    /**
     * 手动触发重连
     */
    reconnect(): void;
    /**
     * 检查连接是否健康
     */
    isHealthy(): boolean;
    /**
     * 获取连接统计信息
     */
    getStats(): {
        state: ConnectionState;
        missedHeartbeats: number;
        reconnectAttempts: number;
        isHealthy: boolean;
    };
    /**
     * 启动心跳
     */
    private startHeartbeat;
    /**
     * 停止心跳
     */
    private stopHeartbeat;
    /**
     * 停止重连
     */
    private stopReconnect;
    /**
     * 设置连接状态
     */
    private setState;
    /**
     * 触发事件
     */
    private emit;
    /**
     * 获取当前连接状态
     */
    getState(): ConnectionState;
    /**
     * 是否已连接
     */
    isConnected(): boolean;
}
//# sourceMappingURL=Connection.d.ts.map