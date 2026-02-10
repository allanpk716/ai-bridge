export type { SDKConfig, SDKContext, CSSProperties } from './config';
export type { SDKEvent, SdkMessageResponse } from './events';
export { ConnectionState } from './events';
export type { SdkMessage, SendMessagePayload, MessageResponse, IframeResponse, } from './messages';
export { SendMessagePayloadSchema, MessageResponseSchema, SdkMessageSchema, IframeResponseSchema, } from './messages';
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
//# sourceMappingURL=index.d.ts.map