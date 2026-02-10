import { z } from 'zod';
/**
 * 发送消息负载 Schema
 */
export declare const SendMessagePayloadSchema: z.ZodObject<{
    text: z.ZodString;
    sessionId: z.ZodOptional<z.ZodString>;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
export type SendMessagePayload = z.infer<typeof SendMessagePayloadSchema>;
/**
 * 消息响应 Schema
 */
export declare const MessageResponseSchema: z.ZodObject<{
    messageId: z.ZodString;
    success: z.ZodBoolean;
    content: z.ZodOptional<z.ZodString>;
    error: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodObject<{
        model: z.ZodString;
        tokensUsed: z.ZodNumber;
        duration: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type MessageResponse = z.infer<typeof MessageResponseSchema>;
/**
 * SDK 消息类型(用于 postMessage)
 */
export declare const SdkMessageSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"init">;
    payload: z.ZodObject<{
        sessionId: z.ZodOptional<z.ZodString>;
        theme: z.ZodOptional<z.ZodEnum<{
            light: "light";
            dark: "dark";
        }>>;
        locale: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"sendMessage">;
    payload: z.ZodObject<{
        text: z.ZodString;
        sessionId: z.ZodOptional<z.ZodString>;
        context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        messageId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"disconnect">;
}, z.core.$strip>], "type">;
export type SdkMessage = z.infer<typeof SdkMessageSchema>;
/**
 * iframe 响应消息类型
 */
export declare const IframeResponseSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"ready">;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"messageResponse">;
    payload: z.ZodObject<{
        messageId: z.ZodString;
        success: z.ZodBoolean;
        content: z.ZodOptional<z.ZodString>;
        error: z.ZodOptional<z.ZodString>;
        metadata: z.ZodOptional<z.ZodObject<{
            model: z.ZodString;
            tokensUsed: z.ZodNumber;
            duration: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"error">;
    payload: z.ZodObject<{
        message: z.ZodString;
        code: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"heartbeatAck">;
    payload: z.ZodObject<{
        timestamp: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>], "type">;
export type IframeResponse = z.infer<typeof IframeResponseSchema>;
//# sourceMappingURL=messages.d.ts.map