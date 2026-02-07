/**
 * API Client Configuration
 *
 * Centralizes API base URL configuration and provides helper functions
 * for constructing full URLs to backend endpoints.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const API_BASE_PATH = "/api/v1";

/**
 * Constructs a full URL for an API endpoint
 *
 * @param endpoint - The endpoint path (e.g., "sessions", "sessions/123/messages")
 * @returns Full URL including base URL and API version path
 *
 * @example
 * getApiUrl("sessions") // "http://localhost:8080/api/v1/sessions"
 * getApiUrl("sessions/abc-123/messages") // "http://localhost:8080/api/v1/sessions/abc-123/messages"
 */
export function getApiUrl(endpoint: string): string {
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint.slice(1)
    : endpoint;
  return `${API_BASE_URL}${API_BASE_PATH}/${normalizedEndpoint}`;
}

/**
 * HTTP client error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = "ApiError";
  }
}

/**
 * Wrapper around fetch that throws on HTTP errors
 *
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Response object
 * @throws ApiError if response is not OK
 */
export async function fetchWithErrorHandling(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const response = await fetch(url, options);

  if (!response.ok) {
    const data = await response.json().catch(() => undefined);
    throw new ApiError(response.status, response.statusText, data);
  }

  return response;
}

/**
 * Export API base URL for use in other modules (e.g., WebSocket connection)
 */
export { API_BASE_URL };
