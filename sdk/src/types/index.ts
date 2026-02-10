// ============================================================================
// AI-Bridge SDK 类型定义
// ============================================================================

// ----------------------------------------------------------------------------
// 配置类型
// ----------------------------------------------------------------------------
export type { SDKConfig, SDKContext, CSSProperties } from './config';

// ----------------------------------------------------------------------------
// 事件类型
// ----------------------------------------------------------------------------
export type { SDKEvent, SdkMessageResponse } from './events';
export { ConnectionState } from './events';

// ----------------------------------------------------------------------------
// 消息类型
// ----------------------------------------------------------------------------
export type {
  SdkMessage,
  SendMessagePayload,
  MessageResponse,
  IframeResponse,
} from './messages';

export {
  SendMessagePayloadSchema,
  MessageResponseSchema,
  SdkMessageSchema,
  IframeResponseSchema,
} from './messages';

// ----------------------------------------------------------------------------
// 工具类型
// ----------------------------------------------------------------------------
/**
 * 提取 Promise 的返回值类型
 */
export type Awaitable<T> = T | Promise<T>;

/**
 * 事件监听器类型
 */
export type EventListener<T> = (event: T) => void;

/**
 * 可选的事件监听器
 */
export type OptionalEventListener<T> = EventListener<T> | undefined;
