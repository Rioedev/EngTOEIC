import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { LearningFrame } from "@/components/home/learning-frame";
import { TimeAwareBackground } from "@/components/home/time-aware-background";
import { ReviewQueuePlayer } from "@/components/vocabulary/review-queue-player";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getVocabularyReviewQueue } from "@/lib/vocabulary";

export const metadata: Metadata = {
  title: "Cần ôn hôm nay | EngTOEIC",
  description:
    "Ôn các từ đã đến hạn và cập nhật lịch ghi nhớ bằng Again, Hard, Good hoặc Easy.",
};

export default async function VocabularyReviewPage() {
  if (!isSupabaseConfigured()) {
    redirect("/login?next=/vocabulary/review");
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login?next=/vocabulary/review");
  }

  const queue = await getVocabularyReviewQueue(session.access_token, 20);

  return (
    <main className="relative min-h-svh overflow-x-hidden bg-[#101617] pb-32 text-white">
      <TimeAwareBackground />
      <div
        className="vocabulary-background-overlay fixed inset-0 z-[1]"
        aria-hidden="true"
      />
      <LearningFrame />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-28 sm:px-6 sm:pt-32 lg:px-8">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/vocabulary"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/8 px-4 text-sm font-semibold text-white/72 backdrop-blur-xl transition hover:bg-white/14 hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Thư viện từ vựng
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-white/52">
            <CalendarClock
              className="size-4 text-[var(--accent)]"
              aria-hidden="true"
            />
            Lịch ôn cá nhân
          </div>
        </div>

        <ReviewQueuePlayer
          initialQueue={queue?.data ?? []}
          totalDue={queue?.meta.total ?? 0}
          loadError={!queue}
        />
      </div>
    </main>
  );
}
