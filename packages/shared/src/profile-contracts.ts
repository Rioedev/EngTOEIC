export type UserLanguage = "vi" | "en";
export type UserRole = "LEARNER" | "EDITOR" | "ADMIN";
export type AudioPlaybackRate = 0.75 | 1 | 1.25;

export type UserProfile = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  targetScore: number | null;
  examDate: string | null;
  dailyStudyMinutes: number;
  language: UserLanguage;
  audioAutoplay: boolean;
  audioVolume: number;
  audioPlaybackRate: AudioPlaybackRate;
  reduceMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type UpdateUserProfileInput = Omit<
  UserProfile,
  "id" | "email" | "role" | "createdAt" | "updatedAt"
>;
