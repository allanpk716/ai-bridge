export { AIBridgeSDK } from './core/client';
export { IframeManager } from './core/IframeManager';

export type { SDKConfig, SDKContext, CSSProperties } from './types/config';
export type { ConnectionState, SDKEvent, SdkMessageResponse } from './types/events';
export type {
  SdkMessage,
  SendMessagePayload,
  MessageResponse,
  IframeResponse
} from './types/messages';
export {
  SendMessagePayloadSchema,
  MessageResponseSchema,
  SdkMessageSchema,
  IframeResponseSchema
} from './types/messages';
