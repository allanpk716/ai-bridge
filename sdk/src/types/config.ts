import type { ConnectionState } from './events';

/**
 * SDK 初始化配置
 */
export interface SDKConfig {
  /** AI-Bridge-Web 应用的 URL */
  url: string;

  /** 受信任的源地址(用于 postMessage 安全验证) */
  targetOrigin: string;

  /** 初始化上下文(可选) */
  context?: SDKContext;

  /** iframe 容器样式 */
  containerStyle?: CSSProperties;

  /** 消息回调 */
  onMessage?: (message: SdkMessageResponse) => void;

  /** 状态变化回调 */
  onStateChange?: (state: ConnectionState) => void;

  /** 错误回调 */
  onError?: (error: Error) => void;
}

/**
 * 初始化上下文
 */
export interface SDKContext {
  /** 会话 ID(可选,指定后自动恢复会话) */
  sessionId?: string;

  /** 主题 */
  theme?: 'light' | 'dark';

  /** 语言 */
  locale?: string;

  /** 自定义参数 */
  custom?: Record<string, unknown>;
}

// CSS 属性类型(简化版)
export interface CSSProperties {
  [property: string]: string | number;
}

/**
 * 消息响应类型
 */
export interface SdkMessageResponse {
  messageId: string;
  success: boolean;
  content?: string;
  error?: string;
  metadata?: {
    model: string;
    tokensUsed: number;
    duration?: number;
  };
}
