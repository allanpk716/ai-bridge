import { useCallback } from 'react';

/**
 * SDK 消息处理结果
 */
export interface SdkMessageResult {
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

/**
 * 流式响应处理器接口
 */
export interface StreamingHandler {
  onStart: (messageId: string) => void;
  onChunk: (messageId: string, content: string) => void;
  onComplete: (result: SdkMessageResult) => void;
  onError: (messageId: string, error: Error) => void;
}

/**
 * 发送 SDK 消息到后端
 *
 * 将来自 SDK 的消息转发到后端 API,
 * 处理响应并返回结果。
 */
export async function sendSdkMessageToBackend(
  text: string,
  sessionId: string | undefined,
  _signal?: AbortSignal
): Promise<SdkMessageResult> {
  const startTime = Date.now();

  try {
    // 导入 API 函数
    const { sendMessage } = await import('@/lib/api/messages');

    // 如果没有 sessionId,使用默认会话或创建新会话
    const effectiveSessionId = sessionId || 'default';

    // 发送消息到后端
    const response = await sendMessage(effectiveSessionId, { content: text });

    return {
      messageId: response.id || `msg_${response.seq}`,
      success: true,
      content: response.content,
      metadata: {
        model: 'haiku', // 默认模型,可以从会话元数据获取
        tokensUsed: text.split(' ').length, // 简单估算
        duration: Date.now() - startTime,
      },
    };
  } catch (error) {
    return {
      messageId: `error_${Date.now()}`,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 处理流式响应的 Hook
 *
 * 用于处理 SDK 消息的流式响应。
 */
export function useSdkStreamingHandler(
  _sessionId: string | undefined
): StreamingHandler {
  const onStart = useCallback((messageId: string) => {
    console.log('[SdkStreaming] Started:', messageId);
    // TODO: 可以在这里触发 UI 更新
  }, []);

  const onChunk = useCallback((messageId: string, content: string) => {
    console.log('[SdkStreaming] Chunk:', messageId, content.slice(0, 50));
    // TODO: 可以在这里将 chunk 发送给 SDK
  }, []);

  const onComplete = useCallback((result: SdkMessageResult) => {
    console.log('[SdkStreaming] Complete:', result);
    // 将最终结果发送给 SDK
    sendResultToSdk(result);
  }, []);

  const onError = useCallback((messageId: string, error: Error) => {
    console.error('[SdkStreaming] Error:', messageId, error);
    // 将错误发送给 SDK
    import('./handlers').then((module) => {
      if (typeof module.sendErrorToSdk === 'function') {
        module.sendErrorToSdk(error.message, 'STREAM_ERROR');
      }
    });
  }, []);

  return { onStart, onChunk, onComplete, onError };
}

/**
 * 发送结果到 SDK
 */
export function sendResultToSdk(result: SdkMessageResult): void {
  // 导入发送函数
  import('./handlers').then((module) => {
    // sendToSdk 是私有函数,需要导出或使用模块内部调用
    if (typeof module.sendToSdk === 'function') {
      module.sendToSdk({
        type: 'messageResponse',
        payload: {
          messageId: result.messageId,
          success: result.success,
          content: result.content,
          error: result.error,
          metadata: result.metadata ? {
            model: result.metadata.model,
            tokensUsed: result.metadata.tokensUsed,
            duration: result.metadata.duration,
          } : undefined,
        },
      });
    }
  });
}

/**
 * 创建 SDK 消息处理器
 *
 * 用于在 SDK 桥接层处理发送消息请求。
 */
export function createSdkMessageHandler() {
  const activeRequests = new Map<string, AbortController>();

  return {
    async handle(
      text: string,
      sessionId: string | undefined,
      messageId: string
    ): Promise<SdkMessageResult> {
      // 创建取消控制器
      const controller = new AbortController();
      activeRequests.set(messageId, controller);

      try {
        const result = await sendSdkMessageToBackend(
          text,
          sessionId,
          controller.signal
        );
        return result;
      } finally {
        activeRequests.delete(messageId);
      }
    },

    cancel(messageId: string): void {
      const controller = activeRequests.get(messageId);
      if (controller) {
        controller.abort();
        activeRequests.delete(messageId);
      }
    },

    cancelAll(): void {
      activeRequests.forEach((controller) => controller.abort());
      activeRequests.clear();
    },
  };
}
