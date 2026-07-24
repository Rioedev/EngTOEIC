export type ApiRequestOptions = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;
  timeoutMs?: number;
  fallbackMessage?: string;
  next?: {
    revalidate?: number;
  };
};

type ApiErrorPayload = {
  message?: string | string[];
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export function normalizeApiBaseUrl(value: string) {
  return value.replace(/\/$/, "");
}

function apiUrl(baseUrl: string, path: string) {
  return `${normalizeApiBaseUrl(baseUrl)}${path.startsWith("/") ? path : `/${path}`}`;
}

async function errorMessage(response: Response, fallbackMessage: string) {
  const payload = (await response
    .json()
    .catch(() => null)) as ApiErrorPayload | null;
  const message = Array.isArray(payload?.message)
    ? payload.message.join(" ")
    : payload?.message;

  return message || `${fallbackMessage} (${response.status}).`;
}

export async function apiRequest<T>(
  baseUrl: string,
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    fallbackMessage = "Yêu cầu thất bại",
    headers: initialHeaders,
    timeoutMs,
    ...init
  } = options;
  const headers = new Headers(initialHeaders);

  if (typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(apiUrl(baseUrl, path), {
    ...init,
    headers,
    signal:
      init.signal ??
      (timeoutMs === undefined ? undefined : AbortSignal.timeout(timeoutMs)),
  });

  if (!response.ok) {
    throw new ApiRequestError(
      await errorMessage(response, fallbackMessage),
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
