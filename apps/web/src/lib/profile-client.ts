import type { UpdateUserProfileInput } from "@engtoeic/shared";
import { authenticatedApiRequest } from "@/lib/api/browser-client";
import type { UserProfile } from "@/lib/profile";

export async function updateUserProfile(values: UpdateUserProfileInput) {
  return authenticatedApiRequest<UserProfile>("/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(values),
    fallbackMessage: "Không thể lưu hồ sơ",
  });
}
