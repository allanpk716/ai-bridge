/**
 * 连接状态枚举
 */
export enum ConnectionState {
  /** 连接中 */
  CONNECTING = 'connecting',
  /** 已连接 */
  CONNECTED = 'connected',
  /** 已断开 */
  DISCONNECTED = 'disconnected',
  /** 错误状态 */
  ERROR = 'error',
}

/**
 * 错误类型
 */
export enum ConnectionErrorType {
  /** 网络错误 */
  NETWORK = 'network',
  /** 超时 */
  TIMEOUT = 'timeout',
  /** iframe 加载失败 */
  IFRAME_LOAD_FAILED = 'iframe_load_failed',
  /** 未授权 */
  UNAUTHORIZED = 'unauthorized',
  /** 未知错误 */
  UNKNOWN = 'unknown',
}

/**
 * 连接错误
 */
export class ConnectionError extends Error {
  constructor(
    public type: ConnectionErrorType,
    message: string,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'ConnectionError';
  }
}

/**
 * 连接事件类型
 */
export type ConnectionEvent =
  | { type: 'stateChange'; state: ConnectionState }
  | { type: 'error'; error: ConnectionError; attempts?: number }
  | { type: 'heartbeat' }
  | { type: 'reconnecting'; attempt: number; maxAttempts: number }
  | { type: 'reconnectFailed'; error: ConnectionError };

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
export class ConnectionManager {
  private config: Required<ConnectionManagerConfig>;
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private listeners: Set<ConnectionListener> = new Set();

  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private missedHeartbeats = 0;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // 获取 iframe contentWindow 的函数
  private getContentWindow: () => Window | null;
  private targetOrigin: string;

  constructor(
    getContentWindow: () => Window | null,
    targetOrigin: string,
    config?: ConnectionManagerConfig
  ) {
    this.getContentWindow = getContentWindow;
    this.targetOrigin = targetOrigin;
    this.config = {
      heartbeatInterval: config?.heartbeatInterval ?? 5000,
      maxMissedHeartbeats: config?.maxMissedHeartbeats ?? 3,
      reconnectDelay: config?.reconnectDelay ?? 1000,
      maxReconnectAttempts: config?.maxReconnectAttempts ?? 5,
    };
  }

  /**
   * 启动连接管理器
   */
  start(): void {
    this.setState(ConnectionState.CONNECTING);
    this.startHeartbeat();
  }

  /**
   * 停止连接管理器
   */
  stop(): void {
    this.stopHeartbeat();
    this.stopReconnect();
    this.setState(ConnectionState.DISCONNECTED);
  }

  /**
   * 添加事件监听器
   */
  on(listener: ConnectionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 发送心跳消息
   */
  private sendHeartbeat(): void {
    const win = this.getContentWindow();
    if (!win) {
      this.handleMissedHeartbeat();
      return;
    }

    try {
      win.postMessage(
        { type: 'heartbeat', timestamp: Date.now() },
        this.targetOrigin
      );

      // 如果没有收到响应,计数增加
      this.missedHeartbeats++;

      if (this.missedHeartbeats > this.config.maxMissedHeartbeats) {
        this.handleDisconnection();
      }
    } catch {
      this.handleMissedHeartbeat();
    }
  }

  /**
   * 处理心跳响应
   */
  handleHeartbeatAck(): void {
    this.missedHeartbeats = 0;

    if (this.state !== ConnectionState.CONNECTED) {
      this.setState(ConnectionState.CONNECTED);
      this.reconnectAttempts = 0;
    }

    this.emit({ type: 'heartbeat' });
  }

  /**
   * 处理丢失的心跳
   */
  private handleMissedHeartbeat(): void {
    this.missedHeartbeats++;

    if (this.missedHeartbeats > this.config.maxMissedHeartbeats) {
      this.handleDisconnection();
    }
  }

  /**
   * 处理断开连接
   */
  private handleDisconnection(): void {
    this.setState(ConnectionState.DISCONNECTED);
    this.stopHeartbeat();

    // 尝试重连
    this.attemptReconnect();
  }

  /**
   * 尝试重连
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      const error = new ConnectionError(
        ConnectionErrorType.NETWORK,
        'Max reconnection attempts reached',
        false
      );
      this.setState(ConnectionState.ERROR);
      this.emit({
        type: 'reconnectFailed',
        error,
      });
      return;
    }

    this.reconnectAttempts++;

    // 发送重连事件
    this.emit({
      type: 'reconnecting',
      attempt: this.reconnectAttempts,
      maxAttempts: this.config.maxReconnectAttempts,
    });

    // 计算延迟时间(指数退避)
    const baseDelay = this.config.reconnectDelay;
    const exponentialDelay = Math.min(
      baseDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000 // 最大 30 秒
    );

    // 添加随机抖动(避免雷鸣效应)
    const jitter = Math.random() * 1000;
    const finalDelay = exponentialDelay + jitter;

    console.log(
      `[ConnectionManager] Reconnect attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} in ${Math.round(finalDelay)}ms`
    );

    this.reconnectTimer = setTimeout(() => {
      this.setState(ConnectionState.CONNECTING);
      this.startHeartbeat();
    }, finalDelay);
  }

  /**
   * 处理致命错误
   */
  private handleFatalError(errorType: ConnectionErrorType, message: string): void {
    const error = new ConnectionError(errorType, message, false);
    this.setState(ConnectionState.ERROR);
    this.stopHeartbeat();
    this.stopReconnect();
    this.emit({
      type: 'error',
      error,
    });
  }

  /**
   * 处理可恢复错误
   */
  private handleRecoverableError(errorType: ConnectionErrorType, message: string): void {
    const error = new ConnectionError(errorType, message, true);
    this.emit({
      type: 'error',
      error,
    });
    // 不立即断开,让心跳机制处理
  }

  /**
   * 重置重连计数
   */
  public resetReconnectAttempts(): void {
    this.reconnectAttempts = 0;
  }

  /**
   * 手动触发重连
   */
  public reconnect(): void {
    this.stopReconnect();
    this.reconnectAttempts = 0;
    this.setState(ConnectionState.CONNECTING);
    this.startHeartbeat();
  }

  /**
   * 检查连接是否健康
   */
  public isHealthy(): boolean {
    return this.state === ConnectionState.CONNECTED &&
      this.missedHeartbeats < Math.floor(this.config.maxMissedHeartbeats / 2);
  }

  /**
   * 获取连接统计信息
   */
  public getStats() {
    return {
      state: this.state,
      missedHeartbeats: this.missedHeartbeats,
      reconnectAttempts: this.reconnectAttempts,
      isHealthy: this.isHealthy(),
    };
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatInterval);
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.missedHeartbeats = 0;
  }

  /**
   * 停止重连
   */
  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
  }

  /**
   * 设置连接状态
   */
  private setState(state: ConnectionState): void {
    if (this.state !== state) {
      this.state = state;
      this.emit({ type: 'stateChange', state });
    }
  }

  /**
   * 触发事件
   */
  private emit(event: ConnectionEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('[ConnectionManager] Listener error:', error);
      }
    });
  }

  /**
   * 获取当前连接状态
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.state === ConnectionState.CONNECTED;
  }
}
