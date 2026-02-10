import { z } from 'zod';

/**
 * 发送消息负载 Schema
 */
export const SendMessagePayloadSchema = z.object({
  text: z.string().min(1).max(10000),
  sessionId: z.string().optional(),
  context: z.record(z.string(), z.any()).optional(),
});

export type SendMessagePayload = z.infer<typeof SendMessagePayloadSchema>;

/**
 * 消息响应 Schema
 */
export const MessageResponseSchema = z.object({
  messageId: z.string(),
  success: z.boolean(),
  content: z.string().optional(),
  error: z.string().optional(),
  metadata: z.object({
    model: z.string(),
    tokensUsed: z.number(),
    duration: z.number().optional(),
  }).optional(),
});

export type MessageResponse = z.infer<typeof MessageResponseSchema>;

/**
 * SDK 消息类型(用于 postMessage)
 */
export const SdkMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('init'),
    payload: z.object({
      sessionId: z.string().optional(),
      theme: z.enum(['light', 'dark']).optional(),
      locale: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal('sendMessage'),
    payload: SendMessagePayloadSchema.extend({
      messageId: z.string(),
    }),
  }),
  z.object({
    type: z.literal('disconnect'),
  }),
]);

export type SdkMessage = z.infer<typeof SdkMessageSchema>;

/**
 * iframe 响应消息类型
 */
export const IframeResponseSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ready'),
  }),
  z.object({
    type: z.literal('messageResponse'),
    payload: MessageResponseSchema,
  }),
  z.object({
    type: z.literal('error'),
    payload: z.object({
      message: z.string(),
      code: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal('heartbeatAck'),
    payload: z.object({
      timestamp: z.number().optional(),
    }),
  }),
]);

export type IframeResponse = z.infer<typeof IframeResponseSchema>;
