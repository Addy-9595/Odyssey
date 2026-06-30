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

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: unknown,
  ) {
    super(`API ${status} ${statusText}`);
    this.name = "ApiError";
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
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText, payload);
  }

  return payload as T;
};

export default customInstance;
