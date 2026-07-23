import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BrainCircuit,
  BookOpenText,
  BriefcaseBusiness,
  CheckCircle2,
  Keyboard,
  Layers3,
  Sparkles,
  Volume2,
} from "lucide-react";
import { LearningFrame } from "@/components/home/learning-frame";
import { TimeAwareBackground } from "@/components/home/time-aware-background";
import { getVocabularySet } from "@/lib/vocabulary";

type VocabularyDetailPageProps = {
  params: Promise<{ setSlug: string }>;
};

function partLabel(part: string | null) {
  return part?.replace("PART_", "Part ") ?? "Nhiều Part";
}

export async function generateMetadata({
  params,
}: VocabularyDetailPageProps): Promise<Metadata> {
  const { setSlug } = await params;
  const { vocabularySet } = await getVocabularySet(setSlug);

  if (!vocabularySet) {
    return { title: "Không tìm thấy bộ từ | EngTOEIC" };
  }

  return {
    title: `${vocabularySet.title} | EngTOEIC`,
    description: vocabularySet.description,
  };
}

export default async function VocabularyDetailPage({
  params,
}: VocabularyDetailPageProps) {
  const { setSlug } = await params;
  const { vocabularySet, source } = await getVocabularySet(setSlug);

  if (!vocabularySet) {
    notFound();
  }

  const terms = vocabularySet.terms ?? [];

  return (
    <main className="relative min-h-svh overflow-x-hidden bg-[#101617] pb-32 text-white">
      <a
        href="#term-list"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-black"
      >
        Đi tới danh sách từ
      </a>
      <TimeAwareBackground />
      <div
        className="vocabulary-background-overlay absolute inset-0 z-[1]"
        aria-hidden="true"
      />
      <LearningFrame />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-28 sm:px-6 sm:pt-32 lg:px-8">
        <Link
          href="/vocabulary"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/8 px-4 text-sm font-bold text-white/72 backdrop-blur-xl transition hover:bg-white/14 hover:text-white"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Thư viện từ vựng
        </Link>

        <section className="glass-card mt-6 overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-[var(--accent)]">
                  <BriefcaseBusiness className="size-4" aria-hidden="true" />
                  {vocabularySet.topic ?? "TOEIC Vocabulary"}
                </span>
                <span className="rounded-full bg-white/8 px-3 py-1.5 text-xs font-extrabold text-white/65">
                  {partLabel(vocabularySet.part)}
                </span>
                {source === "demo" ? (
                  <span className="rounded-full bg-amber-300/14 px-3 py-1.5 text-xs font-extrabold text-amber-100">
                    Dữ liệu demo
                  </span>
                ) : null}
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.1] tracking-[-0.022em] text-balance sm:text-5xl lg:text-6xl">
                {vocabularySet.title}
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/64 sm:text-base">
                {vocabularySet.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-5 text-sm font-bold text-white/65">
                <span className="flex items-center gap-2">
                  <Layers3
                    className="size-4 text-[var(--accent)]"
                    aria-hidden="true"
                  />
                  {vocabularySet.termCount} từ
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2
                    className="size-4 text-[var(--accent)]"
                    aria-hidden="true"
                  />
                  Nội dung đã biên tập
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <Link
                href={`/vocabulary/${vocabularySet.slug}/learn`}
                className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-7 text-sm font-black text-[var(--accent-ink)] shadow-xl shadow-[var(--accent-glow)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] motion-reduce:transform-none"
                style={{ color: "var(--accent-ink)" }}
              >
                <BrainCircuit className="size-5" aria-hidden="true" />
                Bắt đầu Learn
              </Link>
              <Link
                href={`/vocabulary/${vocabularySet.slug}/write`}
                className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-white/9 px-6 text-sm font-semibold text-white/78 transition hover:bg-white/14 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <Keyboard className="size-5" aria-hidden="true" />
                Luyện Viết từ
              </Link>
              <Link
                href={`/vocabulary/${vocabularySet.slug}/flashcards`}
                className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-white/9 px-6 text-sm font-black text-white/78 transition hover:bg-white/14 hover:text-white"
              >
                <Sparkles className="size-5" aria-hidden="true" />
                Học bằng Flashcard
              </Link>
              <a
                href="#term-list"
                className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/8 px-5 text-xs font-bold text-white/65 transition hover:bg-white/14 hover:text-white"
              >
                <BookOpenText className="size-4" aria-hidden="true" />
                Xem danh sách {vocabularySet.termCount} từ
              </a>
            </div>
          </div>
        </section>

        <section
          id="term-list"
          className="scroll-mt-6 pt-12"
          aria-labelledby="term-list-title"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--accent)]">
                Nội dung bộ từ
              </p>
              <h2
                id="term-list-title"
                className="mt-2 text-2xl font-black tracking-[-0.016em] sm:text-3xl"
              >
                Danh sách từ vựng
              </h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-bold text-white/55">
              <Sparkles
                className="size-4 text-[var(--accent)]"
                aria-hidden="true"
              />
              Sẵn sàng học bằng Flashcard
            </span>
          </div>

          {terms.length ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {terms.map((term, index) => (
                <article
                  key={term.id}
                  className="glass-card group p-5 transition duration-200 hover:bg-white/12 sm:p-6"
                >
                  <div className="flex items-start gap-4">
                    <span className="grid size-9 flex-none place-items-center rounded-xl bg-white/8 text-xs font-black text-white/45">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="text-xl font-black tracking-[-0.012em] text-[var(--accent)] sm:text-2xl">
                          {term.term}
                        </h3>
                        {term.ipa ? (
                          <span className="text-sm font-semibold text-white/46">
                            {term.ipa}
                          </span>
                        ) : null}
                        {term.audioUrl ? (
                          <a
                            href={term.audioUrl}
                            className="grid size-9 place-items-center rounded-full bg-white/8 text-white/65 hover:bg-[var(--accent)] hover:text-[var(--accent-ink)]"
                            aria-label={`Nghe phát âm từ ${term.term}`}
                          >
                            <Volume2 className="size-4" aria-hidden="true" />
                          </a>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs font-extrabold uppercase tracking-wider text-white/40">
                        {term.partOfSpeech}
                      </p>
                      <p className="mt-4 text-base font-bold leading-6 text-white/90">
                        {term.meaningVi}
                      </p>

                      {term.exampleEn ? (
                        <blockquote className="mt-5 border-l-2 border-[var(--accent)] pl-4">
                          <p className="text-sm font-semibold leading-6 text-white/72">
                            {term.exampleEn}
                          </p>
                          {term.exampleVi ? (
                            <p className="mt-1 text-xs leading-5 text-white/42">
                              {term.exampleVi}
                            </p>
                          ) : null}
                        </blockquote>
                      ) : null}

                      {term.collocations.length ? (
                        <div
                          className="mt-5 flex flex-wrap gap-2"
                          aria-label="Cụm từ thường gặp"
                        >
                          {term.collocations.map((collocation) => (
                            <span
                              key={collocation}
                              className="rounded-full bg-white/7 px-3 py-1.5 text-xs font-bold text-white/55"
                            >
                              {collocation}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="glass-card mt-6 p-8 text-center text-sm text-white/55">
              Bộ từ này chưa có nội dung được xuất bản.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
