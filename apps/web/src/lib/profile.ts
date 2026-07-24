export type UserProfile = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  targetScore: number | null;
  examDate: string | null;
  dailyStudyMinutes: number;
  language: "vi" | "en";
  audioAutoplay: boolean;
  audioVolume: number;
  audioPlaybackRate: 0.75 | 1 | 1.25;
  reduceMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  role: "LEARNER" | "EDITOR" | "ADMIN";
  createdAt: string;
  updatedAt: string;
};

function getApiBaseUrl() {
  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:4000"
  ).replace(/\/$/, "");
}

export async function getUserProfile(accessToken: string) {
  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;
    return (await response.json()) as UserProfile;
  } catch {
    return null;
  }
}
