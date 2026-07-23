"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  Check,
  CheckCircle2,
  FlipHorizontal2,
  RotateCcw,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import type {
  VocabularyReviewQueueItem,
  VocabularyReviewRating,
} from "@/lib/vocabulary";
import { rateVocabularyTerm } from "@/lib/vocabulary-progress-client";

type ReviewQueuePlayerProps = {
  initialQueue: VocabularyReviewQueueItem[];
  totalDue: number;
  loadError: boolean;
};

type SaveState = "idle" | "saving" | "error";

const ratingMeta: Record<
  VocabularyReviewRating,
  {
    label: string;
    description: string;
    schedule: string;
    tone: string;
  }
> = {
  AGAIN: {
    label: "Again",
    description: "Chưa nhớ",
    schedule: "Học lại sớm",
    tone: "bg-rose-300/13 text-rose-100 hover:bg-rose-300/21",
  },
  HARD: {
    label: "Hard",
    description: "Khó",
    schedule: "Khoảng ngắn hơn",
    tone: "bg-amber-300/13 text-amber-100 hover:bg-amber-300/21",
  },
  GOOD: {
    label: "Good",
    description: "Nhớ được",
    schedule: "Theo nhịp hiện tại",
    tone: "bg-sky-300/13 text-sky-100 hover:bg-sky-300/21",
  },
  EASY: {
    label: "Easy",
    description: "Rất dễ",
    schedule: "Kéo dài khoảng ôn",
    tone: "bg-emerald-300/13 text-emerald-100 hover:bg-emerald-300/21",
  },
};

export function ReviewQueuePlayer({
  initialQueue,
  totalDue,
  loadError,
}: ReviewQueuePlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [announcement, setAnnouncement] = useState("");
  const currentItem = initialQueue[currentIndex];
  const reviewedCount = Math.min(currentIndex, initialQueue.length);
  const remainingInBatch = Math.max(initialQueue.length - currentIndex, 0);
  const progress = initialQueue.length
    ? (reviewedCount / initialQueue.length) * 100
    : 0;

  const speakTerm = useCallback((item: VocabularyReviewQueueItem) => {
    if (item.term.audioUrl) {
      const audio = new Audio(item.term.audioUrl);
      void audio.play().catch(() => undefined);
      return;
    }

    if (!("speechSynthesis" in window)) {
      setAnnouncement("Trình duyệt này chưa hỗ trợ phát âm tự động.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(item.term.term);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, []);

  const flipCard = useCallback(() => {
    if (!currentItem || saveState === "saving") return;
    setFlipped((current) => !current);
    setAnnouncement(
      flipped
        ? `Đã quay lại mặt từ của ${currentItem.term.term}.`
        : `Đã mở nghĩa của ${currentItem.term.term}.`,
    );
  }, [currentItem, flipped, saveState]);

  const rateCurrentItem = useCallback(
    async (rating: VocabularyReviewRating) => {
      if (!currentItem || !flipped || saveState === "saving") return;
      setSaveState("saving");

      try {
        const savedProgress = await rateVocabularyTerm(
          currentItem.set.slug,
          currentItem.term.id,
          rating,
        );
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setFlipped(false);
        setSaveState("idle");
        if (!savedProgress.reviewAccepted) {
          setAnnouncement(
            `${currentItem.term.term} đã được cập nhật ở một lượt khác. Đã chuyển sang từ tiếp theo.`,
          );
          return;
        }
        const scheduleDescription =
          savedProgress.intervalDays === 0
            ? "ôn lại sau khoảng 10 phút"
            : `ôn lại sau ${savedProgress.intervalDays} ngày`;
        setAnnouncement(
          `${currentItem.term.term}: ${ratingMeta[rating].label}, ${scheduleDescription}. ${
            nextIndex < initialQueue.length
              ? "Đã chuyển sang từ tiếp theo."
              : "Đã hoàn thành lượt ôn."
          }`,
        );
      } catch {
        setSaveState("error");
        setAnnouncement(
          "Chưa thể lưu đánh giá. Từ này vẫn được giữ trong hàng đợi.",
        );
      }
    },
    [currentIndex, currentItem, flipped, initialQueue.length, saveState],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select")) return;
      if (!currentItem || saveState === "saving") return;

      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        flipCard();
      } else if (event.key === "1") {
        void rateCurrentItem("AGAIN");
      } else if (event.key === "2") {
        void rateCurrentItem("HARD");
      } else if (event.key === "3") {
        void rateCurrentItem("GOOD");
      } else if (event.key === "4") {
        void rateCurrentItem("EASY");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentItem, flipCard, rateCurrentItem, saveState]);

  if (loadError) {
    return (
      <section
        className="glass-card mx-auto max-w-3xl p-7 text-center sm:p-10"
        role="alert"
      >
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-rose-300/12 text-rose-100">
          <X className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-bold">Chưa tải được hàng đợi</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-white/58">
          API lịch ôn chưa phản hồi. Hãy thử tải lại trang sau ít phút.
        </p>
      </section>
    );
  }

  if (!initialQueue.length) {
    return (
      <section
        className="glass-card mx-auto max-w-3xl p-7 text-center sm:p-10"
        aria-labelledby="review-empty-title"
      >
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-300/12 text-emerald-100">
          <CheckCircle2 className="size-8" aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.13em] text-[var(--accent)]">
          Hàng đợi hôm nay
        </p>
        <h1
          id="review-empty-title"
          className="mt-2 text-3xl font-bold tracking-[-0.018em] sm:text-4xl"
        >
          Không còn từ đến hạn
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/58">
          Bạn đã hoàn thành lịch hiện tại. Hãy học thêm bộ từ hoặc quay lại khi
          lịch ôn tiếp theo đến hạn.
        </p>
        <Link
          href="/vocabulary"
          className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-ink)]"
          style={{ color: "var(--accent-ink)" }}
        >
          <BookOpenText className="size-4" aria-hidden="true" />
          Về thư viện
        </Link>
      </section>
    );
  }

  if (!currentItem) {
    const waitingCount = Math.max(totalDue - initialQueue.length, 0);

    return (
      <section
        className="glass-card mx-auto max-w-3xl p-7 text-center sm:p-10"
        aria-labelledby="review-complete-title"
      >
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
          <Sparkles className="size-8" aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.13em] text-[var(--accent)]">
          Hoàn thành lượt ôn
        </p>
        <h1
          id="review-complete-title"
          className="mt-2 text-3xl font-bold tracking-[-0.018em] sm:text-4xl"
        >
          Đã xử lý {initialQueue.length} từ
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/58">
          {waitingCount > 0
            ? `Còn ${waitingCount} từ chưa vào lượt này. Mở lượt tiếp theo để tiếp tục.`
            : "Lịch của bạn đã được cập nhật theo từng mức đánh giá vừa chọn."}
        </p>
        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <a
            href="/vocabulary/review"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-ink)]"
            style={{ color: "var(--accent-ink)" }}
          >
            Kiểm tra lượt tiếp theo
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
          <Link
            href="/vocabulary"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-white/8 px-5 text-sm font-semibold text-white/68 hover:bg-white/13 hover:text-white"
          >
            Về thư viện
          </Link>
        </div>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="review-session-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[var(--accent)]">
            Ôn tập giãn cách
          </p>
          <h1
            id="review-session-title"
            className="mt-2 text-3xl font-bold tracking-[-0.018em] sm:text-4xl"
          >
            Cần ôn hôm nay
          </h1>
          <p className="mt-2 text-sm text-white/52">
            {remainingInBatch} từ còn lại trong lượt · {totalDue} từ đến hạn
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            saveState === "saving"
              ? "bg-sky-300/12 text-sky-100"
              : saveState === "error"
                ? "bg-rose-300/12 text-rose-100"
                : "bg-white/7 text-white/52"
          }`}
          role="status"
          aria-live="polite"
        >
          {saveState === "saving"
            ? "Đang lưu…"
            : saveState === "error"
              ? "Chưa đồng bộ"
              : `Từ ${currentIndex + 1}/${initialQueue.length}`}
        </span>
      </div>

      <div
        className="mt-6 h-2 overflow-hidden rounded-full bg-white/8"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      <article className="glass-card mx-auto mt-7 max-w-3xl overflow-hidden p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 font-semibold text-[var(--accent)]">
            {currentItem.set.title}
          </span>
          <span className="text-white/42">
            {currentItem.progress.intervalDays > 0
              ? `Chu kỳ ${currentItem.progress.intervalDays} ngày · `
              : ""}
            Đã ôn {currentItem.progress.reviewCount} lần
          </span>
        </div>

        <button
          type="button"
          className="mt-5 grid min-h-[330px] w-full place-items-center rounded-[26px] border border-white/10 bg-black/16 p-7 text-center transition hover:border-[color-mix(in_srgb,var(--accent)_42%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] sm:min-h-[390px] sm:p-10"
          onClick={flipCard}
          aria-pressed={flipped}
          aria-label={`${currentItem.term.term}. ${flipped ? "Đang hiển thị nghĩa, nhấn để quay lại từ." : "Nhấn để xem nghĩa."}`}
        >
          {flipped ? (
            <span className="max-w-2xl">
              <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-white/38">
                Nghĩa tiếng Việt
              </span>
              <span className="mt-4 block text-3xl font-bold leading-tight text-[var(--accent)] sm:text-5xl">
                {currentItem.term.meaningVi}
              </span>
              {currentItem.term.exampleEn ? (
                <span className="mt-7 block border-l-2 border-[var(--accent)] pl-4 text-left">
                  <span className="block text-sm leading-6 text-white/75 sm:text-base">
                    {currentItem.term.exampleEn}
                  </span>
                  {currentItem.term.exampleVi ? (
                    <span className="mt-1 block text-xs leading-5 text-white/42 sm:text-sm">
                      {currentItem.term.exampleVi}
                    </span>
                  ) : null}
                </span>
              ) : null}
            </span>
          ) : (
            <span>
              <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-white/38">
                Từ tiếng Anh
              </span>
              <span className="mt-4 block text-4xl font-bold leading-tight tracking-[-0.02em] text-white sm:text-6xl">
                {currentItem.term.term}
              </span>
              {currentItem.term.ipa ? (
                <span className="mt-4 block text-base text-white/45 sm:text-lg">
                  {currentItem.term.ipa}
                </span>
              ) : null}
              <span className="mt-8 inline-flex items-center gap-2 text-xs text-white/42">
                <FlipHorizontal2 className="size-4" aria-hidden="true" />
                Chạm hoặc nhấn Space để lật
              </span>
            </span>
          )}
        </button>

        <button
          type="button"
          className="mx-auto mt-4 flex min-h-10 items-center gap-2 rounded-full px-3 text-xs font-semibold text-white/48 hover:bg-white/8 hover:text-white"
          onClick={() => speakTerm(currentItem)}
        >
          <Volume2 className="size-4" aria-hidden="true" />
          Nghe phát âm
        </button>
      </article>

      <fieldset
        className="mx-auto mt-5 grid max-w-3xl grid-cols-2 gap-2 sm:grid-cols-4"
        aria-describedby="review-rating-hint"
      >
        <legend className="sr-only">Đánh giá mức độ ghi nhớ</legend>
        {(Object.keys(ratingMeta) as VocabularyReviewRating[]).map(
          (rating, index) => (
            <button
              key={rating}
              type="button"
              className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl px-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-35 ${ratingMeta[rating].tone}`}
              onClick={() => void rateCurrentItem(rating)}
              disabled={!flipped || saveState === "saving"}
              aria-label={`${ratingMeta[rating].label}: ${ratingMeta[rating].description}, ${ratingMeta[rating].schedule}`}
            >
              {rating === "AGAIN" ? (
                <RotateCcw className="size-4" aria-hidden="true" />
              ) : rating === "HARD" ? (
                <X className="size-4" aria-hidden="true" />
              ) : rating === "GOOD" ? (
                <Check className="size-4" aria-hidden="true" />
              ) : (
                <Sparkles className="size-4" aria-hidden="true" />
              )}
              <span>
                <span className="block">{ratingMeta[rating].label}</span>
                <span className="mt-0.5 block text-[0.62rem] font-medium opacity-65">
                  {index + 1} · {ratingMeta[rating].schedule}
                </span>
              </span>
            </button>
          ),
        )}
      </fieldset>

      <p
        id="review-rating-hint"
        className="mx-auto mt-3 max-w-3xl text-center text-xs text-white/42"
      >
        {flipped
          ? "Chọn mức độ nhớ để cập nhật lịch và chuyển sang từ tiếp theo."
          : "Lật thẻ trước khi đánh giá. Dùng phím 1–4 để chấm nhanh."}
      </p>

      {saveState === "error" ? (
        <p
          className="mx-auto mt-4 max-w-3xl rounded-2xl bg-rose-300/10 px-4 py-3 text-center text-sm text-rose-100"
          role="alert"
        >
          Chưa thể lưu đánh giá. Hãy thử chọn lại.
        </p>
      ) : null}

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </section>
  );
}
