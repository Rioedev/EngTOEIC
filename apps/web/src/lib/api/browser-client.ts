"use client";

import { createClient } from "@/lib/supabase/client";
import {
  apiRequest,
  normalizeApiBaseUrl,
  type ApiRequestOptions,
} from "./request";

let supabaseClient: ReturnType<typeof createClient> | undefined;

function browserApiBaseUrl() {
  return normalizeApiBaseUrl(
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  );
}

function getSupabaseClient() {
  supabaseClient ??= createClient();
  return supabaseClient;
}

export async function getBrowserAccessToken() {
  const {
    data: { session },
    error,
  } = await getSupabaseClient().auth.getSession();

  if (error || !session) {
    throw new Error("Phiên đăng nhập đã hết hạn.");
  }

  return session.access_token;
}

type BrowserApiRequestOptions = ApiRequestOptions & {
  accessToken?: string;
};

export function browserApiRequest<T>(
  path: string,
  options: BrowserApiRequestOptions = {},
) {
  const { accessToken, headers: initialHeaders, ...init } = options;
  const headers = new Headers(initialHeaders);

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return apiRequest<T>(browserApiBaseUrl(), path, {
    cache: "no-store",
    ...init,
    headers,
  });
}

export async function authenticatedApiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
) {
  return browserApiRequest<T>(path, {
    ...options,
    accessToken: await getBrowserAccessToken(),
  });
}
