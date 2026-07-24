import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardCheck, Layers3 } from "lucide-react";
import { LearningFrame } from "@/components/home/learning-frame";
import { TimeAwareBackground } from "@/components/home/time-aware-background";
import { VocabularyTestPlayer } from "@/components/vocabulary/vocabulary-test-player";
import { getVocabularySet } from "@/lib/vocabulary";
import { getVocabularySetForCurrentUser } from "@/lib/vocabulary-server";

type TestPageProps = {
  params: Promise<{ setSlug: string }>;
};

export async function generateMetadata({
  params,
}: TestPageProps): Promise<Metadata> {
  const { setSlug } = await params;
  const { vocabularySet } = await getVocabularySet(setSlug);

  return {
    title: vocabularySet
      ? `Test: ${vocabularySet.title} | EngTOEIC`
      : "Không tìm thấy bộ từ | EngTOEIC",
    description: vocabularySet
      ? `Tạo bài kiểm tra từ bộ ${vocabularySet.title} với câu hỏi trắc nghiệm, viết từ và đúng sai.`
      : undefined,
  };
}

export default async function TestPage({ params }: TestPageProps) {
  const { setSlug } = await params;
  const { vocabularySet } = await getVocabularySetForCurrentUser(setSlug);

  if (!vocabularySet) notFound();

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
          <div className="flex items-center gap-2 text-xs text-white/54">
            <ClipboardCheck
              className="size-4 text-[var(--accent)]"
              aria-hidden="true"
            />
            Test từ vựng
            <span className="text-white/25">•</span>
            <Layers3
              className="size-4 text-[var(--accent)]"
              aria-hidden="true"
            />
            {vocabularySet.termCount} từ
          </div>
        </div>

        <VocabularyTestPlayer
          terms={vocabularySet.terms ?? []}
          setSlug={vocabularySet.slug}
        />
      </div>
    </main>
  );
}
