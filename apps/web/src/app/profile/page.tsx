import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Settings2 } from "lucide-react";
import { LearningFrame } from "@/components/home/learning-frame";
import { TimeAwareBackground } from "@/components/home/time-aware-background";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile, type UserProfile } from "@/lib/profile";

export const metadata: Metadata = {
  title: "Hồ sơ & cài đặt | EngTOEIC",
  description:
    "Quản lý hồ sơ, mục tiêu TOEIC, audio và tùy chọn accessibility.",
};

export default async function ProfilePage() {
  if (!isSupabaseConfigured()) redirect("/login?next=/profile");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!user || !session) redirect("/login?next=/profile");

  const storedProfile = await getUserProfile(session.access_token);
  const fallbackProfile: UserProfile = {
    id: user.id,
    email: user.email ?? "",
    displayName:
      user.user_metadata.full_name ??
      user.user_metadata.name ??
      user.email?.split("@")[0] ??
      "Người học",
    avatarUrl: user.user_metadata.avatar_url ?? null,
    targetScore: null,
    examDate: null,
    dailyStudyMinutes: 30,
    language: "vi",
    audioAutoplay: true,
    audioVolume: 100,
    audioPlaybackRate: 1,
    reduceMotion: false,
    highContrast: false,
    largeText: false,
    role: "LEARNER",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const profile = storedProfile
    ? {
        ...storedProfile,
        displayName: storedProfile.displayName ?? fallbackProfile.displayName,
      }
    : fallbackProfile;

  return (
    <main className="relative min-h-svh overflow-x-hidden bg-[#101617] pb-28 text-white">
      <a
        href="#profile-settings"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-black"
      >
        Đi tới cài đặt hồ sơ
      </a>
      <TimeAwareBackground />
      <div
        className="vocabulary-background-overlay fixed inset-0 z-[1]"
        aria-hidden="true"
      />
      <LearningFrame />

      <div
        id="profile-settings"
        className="relative z-10 mx-auto w-full max-w-5xl px-4 pt-28 sm:px-6 sm:pt-32 lg:px-8"
      >
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/8 px-4 text-sm font-semibold text-white/72 backdrop-blur-xl transition hover:bg-white/14 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Trang chủ
            </Link>
            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
              Không gian cá nhân
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.02em] sm:text-5xl">
              Hồ sơ & cài đặt
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
              Cá nhân hóa mục tiêu học, trải nghiệm nghe và cách giao diện hỗ
              trợ bạn trong mỗi phiên học.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs text-white/54">
            <Settings2
              className="size-4 text-[var(--accent)]"
              aria-hidden="true"
            />
            Đồng bộ theo tài khoản
          </span>
        </div>

        <ProfileSettingsForm initialProfile={profile} />
      </div>
    </main>
  );
}
