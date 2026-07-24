import type { UserProfile } from "@engtoeic/shared";
import { serverApiRequest } from "@/lib/api/server-client";

export type { UserProfile } from "@engtoeic/shared";

export async function getUserProfile(accessToken: string) {
  try {
    return await serverApiRequest<UserProfile>("/auth/profile", {
      accessToken,
      cache: "no-store",
      timeoutMs: 5000,
      fallbackMessage: "Không thể tải hồ sơ",
    });
  } catch {
    return null;
  }
}
