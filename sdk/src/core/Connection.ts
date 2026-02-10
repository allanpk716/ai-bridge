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
 * 连接事件类型
 */
export type ConnectionEvent =
  | { type: 'stateChange'; state: ConnectionState }
  | { type: 'error'; error: Error }
  | { type: 'heartbeat' };

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
      this.setState(ConnectionState.ERROR);
      this.emit({
        type: 'error',
        error: new Error('Max reconnection attempts reached'),
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    this.reconnectTimer = setTimeout(() => {
      console.log(`[ConnectionManager] Reconnect attempt ${this.reconnectAttempts}`);
      this.setState(ConnectionState.CONNECTING);
      this.startHeartbeat();
    }, delay);
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
