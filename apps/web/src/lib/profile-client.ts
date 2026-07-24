import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/profile";

let supabaseClient: ReturnType<typeof createClient> | undefined;

function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(
    /\/$/,
    "",
  );
}

function getSupabaseClient() {
  supabaseClient ??= createClient();
  return supabaseClient;
}

async function getAccessToken() {
  const {
    data: { session },
    error,
  } = await getSupabaseClient().auth.getSession();

  if (error || !session) {
    throw new Error("Phiên đăng nhập đã hết hạn.");
  }

  return session.access_token;
}

export async function updateUserProfile(
  values: Omit<
    UserProfile,
    "id" | "email" | "role" | "createdAt" | "updatedAt"
  >,
) {
  const accessToken = await getAccessToken();
  const response = await fetch(`${getApiBaseUrl()}/auth/profile`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(values),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(error?.message)
      ? error.message[0]
      : error?.message;
    throw new Error(message ?? `Không thể lưu hồ sơ (${response.status}).`);
  }

  return (await response.json()) as UserProfile;
}
