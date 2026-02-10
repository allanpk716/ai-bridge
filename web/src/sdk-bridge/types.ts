import { z } from 'zod';

/**
 * SDK 模式配置
 */
export interface SdkModeConfig {
  /** 是否处于嵌入模式 */
  isEmbedded: boolean;
  /** 父窗口源地址 */
  parentOrigin: string | null;
  /** 初始化上下文 */
  context?: SdkInitContext;
}

/**
 * SDK 初始化上下文
 */
export interface SdkInitContext {
  sessionId?: string;
  theme?: 'light' | 'dark';
  locale?: string;
}

/**
 * 来自 SDK 的消息 Schema
 */
export const SdkIncomingMessageSchema = z.discriminatedUnion('type', [
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
    payload: z.object({
      text: z.string(),
      sessionId: z.string().optional(),
      messageId: z.string(),
    }),
  }),
  z.object({
    type: z.literal('disconnect'),
  }),
  z.object({
    type: z.literal('heartbeat'),
    timestamp: z.number(),
  }),
]);

export type SdkIncomingMessage = z.infer<typeof SdkIncomingMessageSchema>;

/**
 * 发送到 SDK 的消息 Schema
 */
export const SdkOutgoingMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ready'),
  }),
  z.object({
    type: z.literal('messageResponse'),
    payload: z.object({
      messageId: z.string(),
      success: z.boolean(),
      content: z.string().optional(),
      error: z.string().optional(),
      metadata: z.object({
        model: z.string(),
        tokensUsed: z.number(),
        duration: z.number().optional(),
      }).optional(),
    }),
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

export type SdkOutgoingMessage = z.infer<typeof SdkOutgoingMessageSchema>;

/**
 * 检测是否运行在 iframe 嵌入模式
 */
export function detectSdkMode(): SdkModeConfig {
  const isEmbedded = window.self !== window.top;

  // 检查 URL 参数
  const urlParams = new URLSearchParams(window.location.search);
  const embed = urlParams.get('embed') === 'true';

  // 获取父窗口源地址
  let parentOrigin: string | null = null;
  if (isEmbedded) {
    try {
      // 尝试访问父窗口 location(同源情况)
      parentOrigin = window.parent.location.origin;
    } catch {
      // 跨源情况,使用 document.referrer
      if (document.referrer) {
        try {
          parentOrigin = new URL(document.referrer).origin;
        } catch {
          // document.referrer 也是无效 URL,使用 null
          parentOrigin = null;
        }
      }
    }
  }

  return {
    isEmbedded: isEmbedded || embed,
    parentOrigin,
  };
}

/**
 * 从 URL 参数获取初始化上下文
 */
export function getInitContextFromUrl(): SdkInitContext {
  const urlParams = new URLSearchParams(window.location.search);

  return {
    sessionId: urlParams.get('sessionId') || undefined,
    theme: (urlParams.get('theme') as 'light' | 'dark') || undefined,
    locale: urlParams.get('locale') || undefined,
  };
}
