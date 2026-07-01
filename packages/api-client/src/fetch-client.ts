// Single fetch wrapper that every Orval-generated hook routes through.
// Generated hooks call `customInstance(url, options)`; the app never calls
// fetch directly. Base URL is resolved at runtime so the same generated client
// works against local dev and deployed Workers without regenerating.
//
// Signature matches Orval's fetch httpClient: (url, RequestInit) => Promise<T>.
// With includeHttpResponseReturnType:false, T is the parsed response body.

function getApiBaseUrl(): string {
  // EXPO_PUBLIC_* vars are inlined into the web/native bundle by Expo.
  const fromEnv =
    typeof process !== "undefined"
      ? process.env?.EXPO_PUBLIC_API_URL
      : undefined;
  return (fromEnv ?? "http://localhost:8787").replace(/\/$/, "");
}

/**
 * Thrown on non-2xx responses. Fields mirror the API's ErrorResponse shape
 * ({ error, code, details }) extracted from the body, so a React Query `error`
 * typed as the generated `ErrorResponse` reads correctly at runtime — while
 * still being a real Error (kept for `only-throw-error` and stack traces).
 */
export class ApiError extends Error {
  readonly code: string;
  readonly error: string;
  readonly details?: string[];

  constructor(
    public status: number,
    public statusText: string,
    public body: unknown,
  ) {
    super(`API ${status} ${statusText}`);
    this.name = "ApiError";
    const b = (body ?? {}) as {
      code?: unknown;
      error?: unknown;
      details?: unknown;
    };
    this.code = typeof b.code === "string" ? b.code : "HTTP_ERROR";
    this.error = typeof b.error === "string" ? b.error : `${status} ${statusText}`;
    this.details = Array.isArray(b.details)
      ? b.details.filter((d): d is string => typeof d === "string")
      : undefined;
  }
}

export const customInstance = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const response = await fetch(`${getApiBaseUrl()}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  // response.json() is typed `any`; narrow to unknown so callers must cast.
  const payload: unknown = contentType.includes("application/json")
    ? ((await response.json()) as unknown)
    : await response.text();

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText, payload);
  }

  return payload as T;
};

export default customInstance;
