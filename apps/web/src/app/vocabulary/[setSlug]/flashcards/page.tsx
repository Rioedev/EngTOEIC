import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers3 } from "lucide-react";
import { LearningFrame } from "@/components/home/learning-frame";
import { TimeAwareBackground } from "@/components/home/time-aware-background";
import { FlashcardPlayer } from "@/components/vocabulary/flashcard-player";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  getVocabularyProgress,
  getVocabularySet,
  type VocabularyStudySession,
  type VocabularyTermProgress,
} from "@/lib/vocabulary";

type FlashcardsPageProps = {
  params: Promise<{ setSlug: string }>;
};

export async function generateMetadata({
  params,
}: FlashcardsPageProps): Promise<Metadata> {
  const { setSlug } = await params;
  const { vocabularySet } = await getVocabularySet(setSlug);

  return {
    title: vocabularySet
      ? `Flashcard: ${vocabularySet.title} | EngTOEIC`
      : "Không tìm thấy bộ từ | EngTOEIC",
    description: vocabularySet
      ? `Học ${vocabularySet.termCount} từ trong bộ ${vocabularySet.title} bằng flashcard.`
      : undefined,
  };
}

export default async function FlashcardsPage({ params }: FlashcardsPageProps) {
  const { setSlug } = await params;
  const { vocabularySet, source } = await getVocabularySet(setSlug);

  if (!vocabularySet) {
    notFound();
  }

  let initialProgress: VocabularyTermProgress[] = [];
  let initialSession: VocabularyStudySession | null = null;
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
      initialSession = progress?.session ?? null;
    }
  }

  return (
    <main className="relative min-h-svh overflow-x-hidden bg-[#101617] pb-32 text-white">
      <TimeAwareBackground />
      <div
        className="vocabulary-background-overlay absolute inset-0 z-[1]"
        aria-hidden="true"
      />
      <LearningFrame />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-28 sm:px-6 sm:pt-32 lg:px-8">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href={`/vocabulary/${vocabularySet.slug}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/8 px-4 text-sm font-bold text-white/72 backdrop-blur-xl transition hover:bg-white/14 hover:text-white"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {vocabularySet.title}
            </Link>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-white/52">
            <Layers3
              className="size-4 text-[var(--accent)]"
              aria-hidden="true"
            />
            {vocabularySet.termCount} từ
            {source === "demo" ? (
              <span className="rounded-full bg-amber-300/14 px-2.5 py-1 text-amber-100">
                Dữ liệu demo
              </span>
            ) : null}
          </div>
        </div>

        <FlashcardPlayer
          terms={vocabularySet.terms ?? []}
          setSlug={vocabularySet.slug}
          initialProgress={initialProgress}
          initialSession={initialSession}
          progressPersistenceEnabled={progressPersistenceEnabled}
        />
      </div>
    </main>
  );
}
