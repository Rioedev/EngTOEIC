import "server-only";

import {
  apiRequest,
  normalizeApiBaseUrl,
  type ApiRequestOptions,
} from "./request";

function serverApiBaseUrl() {
  return normalizeApiBaseUrl(
    process.env.API_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      "http://localhost:4000",
  );
}

type ServerApiRequestOptions = ApiRequestOptions & {
  accessToken?: string;
};

export function serverApiRequest<T>(
  path: string,
  options: ServerApiRequestOptions = {},
) {
  const { accessToken, headers: initialHeaders, ...init } = options;
  const headers = new Headers(initialHeaders);

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return apiRequest<T>(serverApiBaseUrl(), path, {
    ...init,
    headers,
  });
}
