/**
 * API Error Handler Utilities
 *
 * Provides user-friendly error messages and error handling for API requests.
 * Converts technical errors into user-friendly Chinese messages.
 */

import { ApiError } from "./client";

/**
 * Enhanced API Error class with user-friendly messages
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "APIError";
  }
}

/**
 * Network error class for network-related failures
 */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

/**
 * Handle API errors and convert to user-friendly messages
 *
 * @param error - The error to handle (can be any type)
 * @returns APIError with user-friendly message
 */
export function handleAPIError(error: unknown): APIError {
  // Already an APIError
  if (error instanceof APIError) {
    return error;
  }

  // ApiError from client.ts
  if (error instanceof ApiError) {
    return new APIError(
      getStatusMessage(error.status),
      error.status,
      error.data
    );
  }

  // Network errors
  if (error instanceof Error) {
    // Fetch network errors
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return new APIError("网络连接失败,请检查您的网络", 0);
    }

    // Timeout errors
    if (error.message.includes("timeout") || error.message.includes("timed out")) {
      return new APIError("请求超时,请稍后重试", 408);
    }

    // Abort errors (user cancelled)
    if (error.name === "AbortError") {
      return new APIError("请求已取消", 0);
    }
  }

  // Unknown error
  return new APIError("发生了未知错误,请稍后重试", 500);
}

/**
 * Get user-friendly message for HTTP status code
 *
 * @param status - HTTP status code
 * @returns User-friendly Chinese message
 */
export function getStatusMessage(status: number): string {
  const messages: Record<number, string> = {
    400: "请求参数错误",
    401: "未授权,请重新登录",
    403: "没有权限访问",
    404: "请求的资源不存在",
    408: "请求超时",
    409: "资源冲突",
    422: "请求数据验证失败",
    429: "请求过于频繁,请稍后重试",
    500: "服务器错误,请稍后重试",
    502: "网关错误",
    503: "服务暂时不可用",
    504: "网关超时",
  };

  return messages[status] || "发生了未知错误";
}

/**
 * Check if error is a network error (retry-worthy)
 *
 * @param error - The error to check
 * @returns True if error is network-related and worth retrying
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof NetworkError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("fetch") ||
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("econnrefused") ||
      message.includes("enotfound")
    );
  }

  return false;
}

/**
 * Check if error is retry-worthy based on status code
 *
 * @param status - HTTP status code
 * @returns True if error is worth retrying
 */
export function isRetryWorthy(status: number): boolean {
  // Retry on: 408 (timeout), 429 (rate limit), 500+ (server errors)
  // Don't retry on: 4xx client errors (except 408, 429)
  return status === 408 || status === 429 || status >= 500;
}
