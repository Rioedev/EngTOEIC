import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Keyboard, Layers3 } from "lucide-react";
import { LearningFrame } from "@/components/home/learning-frame";
import { TimeAwareBackground } from "@/components/home/time-aware-background";
import { LearnPlayer } from "@/components/vocabulary/learn-player";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  getVocabularyProgress,
  getVocabularySet,
  type VocabularyLearnSession,
  type VocabularyTermProgress,
} from "@/lib/vocabulary";

type WritePageProps = {
  params: Promise<{ setSlug: string }>;
};

export async function generateMetadata({
  params,
}: WritePageProps): Promise<Metadata> {
  const { setSlug } = await params;
  const { vocabularySet } = await getVocabularySet(setSlug);

  return {
    title: vocabularySet
      ? `Viết từ: ${vocabularySet.title} | EngTOEIC`
      : "Không tìm thấy bộ từ | EngTOEIC",
    description: vocabularySet
      ? `Nhìn nghĩa tiếng Việt và viết lại từ tiếng Anh trong bộ ${vocabularySet.title}.`
      : undefined,
  };
}

export default async function WritePage({ params }: WritePageProps) {
  const { setSlug } = await params;
  const { vocabularySet, source } = await getVocabularySet(setSlug);

  if (!vocabularySet) notFound();

  let initialProgress: VocabularyTermProgress[] = [];
  let initialLearnSession: VocabularyLearnSession | null = null;
  let progressPersistenceEnabled = false;

  if (source === "api" && isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      progressPersistenceEnabled = true;
      const progress = await getVocabularyProgress(
        vocabularySet.slug,
        session.access_token,
      );
      initialProgress = progress?.data ?? [];
      initialLearnSession =
        progress?.learnSession?.studyMode === "write"
          ? progress.learnSession
          : null;
    }
  }

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
            href={`/vocabulary/${vocabularySet.slug}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/8 px-4 text-sm font-semibold text-white/72 backdrop-blur-xl transition hover:bg-white/14 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {vocabularySet.title}
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-white/52">
            <Keyboard
              className="size-4 text-[var(--accent)]"
              aria-hidden="true"
            />
            Viết từ
            <span className="text-white/25">•</span>
            <Layers3
              className="size-4 text-[var(--accent)]"
              aria-hidden="true"
            />
            {vocabularySet.termCount} từ
          </div>
        </div>

        <LearnPlayer
          terms={vocabularySet.terms ?? []}
          setSlug={vocabularySet.slug}
          initialProgress={initialProgress}
          initialLearnSession={initialLearnSession}
          progressPersistenceEnabled={progressPersistenceEnabled}
          lockedStudyMode="write"
        />
      </div>
    </main>
  );
}
