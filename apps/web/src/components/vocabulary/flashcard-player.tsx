"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FlipHorizontal2,
  Languages,
  Play,
  RotateCcw,
  Shuffle,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type {
  VocabularyReviewRating,
  VocabularyStudySession,
  VocabularyTerm,
  VocabularyTermProgress,
} from "@/lib/vocabulary";
import {
  loadVocabularyProgress,
  rateVocabularyTerm,
  saveVocabularyStudySession,
} from "@/lib/vocabulary-progress-client";

type FlashcardPlayerProps = {
  terms: VocabularyTerm[];
  setSlug: string;
  initialProgress: VocabularyTermProgress[];
  initialSession: VocabularyStudySession | null;
  progressPersistenceEnabled: boolean;
};

type Rating = VocabularyReviewRating;
type StudyDirection = "EN_VI" | "VI_EN";
type SaveState = "idle" | "saving" | "saved" | "error";

const ratingMeta: Record<
  Rating,
  {
    label: string;
    description: string;
    schedule: string;
    badgeTone: string;
    buttonTone: string;
  }
> = {
  AGAIN: {
    label: "Again",
    description: "Chưa nhớ",
    schedule: "Ôn lại ngay",
    badgeTone: "bg-rose-300/14 text-rose-100",
    buttonTone: "bg-rose-300/13 text-rose-100 hover:bg-rose-300/21",
  },
  HARD: {
    label: "Hard",
    description: "Khó",
    schedule: "Sau 1 ngày",
    badgeTone: "bg-amber-300/14 text-amber-100",
    buttonTone: "bg-amber-300/13 text-amber-100 hover:bg-amber-300/21",
  },
  GOOD: {
    label: "Good",
    description: "Nhớ được",
    schedule: "Sau 3 ngày",
    badgeTone: "bg-sky-300/14 text-sky-100",
    buttonTone: "bg-sky-300/13 text-sky-100 hover:bg-sky-300/21",
  },
  EASY: {
    label: "Easy",
    description: "Rất dễ",
    schedule: "Sau 7 ngày",
    badgeTone: "bg-emerald-300/14 text-emerald-100",
    buttonTone: "bg-emerald-300/13 text-emerald-100 hover:bg-emerald-300/21",
  },
};

function createInitialRatings(
  progress: VocabularyTermProgress[],
): Record<string, Rating> {
  return progress.reduce<Record<string, Rating>>((ratings, item) => {
    if (item.lastRating) {
      ratings[item.termId] = item.lastRating;
    } else if (item.status === "MASTERED") {
      ratings[item.termId] = "EASY";
    } else if (item.status === "FAMILIAR") {
      ratings[item.termId] = "GOOD";
    } else if (item.status === "LEARNING") {
      ratings[item.termId] = "AGAIN";
    }
    return ratings;
  }, {});
}

function getSessionIndex(
  session: VocabularyStudySession | null,
  cards: VocabularyTerm[],
) {
  if (!session || !cards.length) return 0;
  const termIndex = session.currentTermId
    ? cards.findIndex((term) => term.id === session.currentTermId)
    : -1;

  if (termIndex >= 0) return termIndex;
  return Math.min(Math.max(session.currentIndex, 0), cards.length - 1);
}

export function FlashcardPlayer({
  terms,
  setSlug,
  initialProgress,
  initialSession,
  progressPersistenceEnabled,
}: FlashcardPlayerProps) {
  const orderedTerms = useMemo(
    () => [...terms].sort((first, second) => first.order - second.order),
    [terms],
  );
  const initialRatings = useMemo(
    () => createInitialRatings(initialProgress),
    [initialProgress],
  );
  const initialSessionIndex = useMemo(
    () => getSessionIndex(initialSession, orderedTerms),
    [initialSession, orderedTerms],
  );
  const hasResumableSession =
    progressPersistenceEnabled &&
    Boolean(initialSession) &&
    initialSessionIndex > 0;
  const [cards, setCards] = useState(orderedTerms);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState<StudyDirection>("EN_VI");
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [ratings, setRatings] =
    useState<Record<string, Rating>>(initialRatings);
  const [saveState, setSaveState] = useState<SaveState>(() =>
    progressPersistenceEnabled && (initialProgress.length || initialSession)
      ? "saved"
      : "idle",
  );
  const [resumePromptOpen, setResumePromptOpen] = useState(hasResumableSession);
  const [announcement, setAnnouncement] = useState("");
  const pointerStartX = useRef<number | null>(null);
  const ignoreNextClick = useRef(false);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const pendingSaveCount = useRef(0);
  const saveFailed = useRef(false);
  const locallyRatedTerms = useRef(new Set<string>());
  const positionPersistenceReady = useRef(!hasResumableSession);
  const lastPersistedPosition = useRef(
    initialSession
      ? `${initialSession.currentTermId ?? ""}:${initialSession.currentIndex}`
      : null,
  );

  const currentTerm = cards[currentIndex];
  const rememberedCount = Object.values(ratings).filter(
    (rating) => rating === "GOOD" || rating === "EASY",
  ).length;
  const needsReviewCount = Object.values(ratings).filter(
    (rating) => rating === "AGAIN" || rating === "HARD",
  ).length;
  const resumeTerm = orderedTerms[initialSessionIndex];

  useEffect(() => {
    if (!progressPersistenceEnabled) return;

    let cancelled = false;
    setSaveState("saving");

    void loadVocabularyProgress(setSlug)
      .then((response) => {
        if (cancelled) return;
        const loadedRatings = createInitialRatings(response.data);
        setRatings((currentRatings) => {
          locallyRatedTerms.current.forEach((termId) => {
            const localRating = currentRatings[termId];
            if (localRating) loadedRatings[termId] = localRating;
          });
          return loadedRatings;
        });
        setSaveState("saved");
      })
      .catch(() => {
        if (cancelled) return;
        setSaveState("error");
        setAnnouncement(
          "Chưa thể tải tiến độ đã lưu. Bạn vẫn có thể tiếp tục học trong phiên này.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [progressPersistenceEnabled, setSlug]);

  const speakTerm = useCallback((term: VocabularyTerm) => {
    if (term.audioUrl) {
      const audio = new Audio(term.audioUrl);
      void audio.play().catch(() => undefined);
      return;
    }

    if (!("speechSynthesis" in window)) {
      setAnnouncement("Trình duyệt này chưa hỗ trợ phát âm tự động.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(term.term);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, []);

  const showCard = useCallback(
    (index: number) => {
      if (!cards.length) return;
      const normalizedIndex = (index + cards.length) % cards.length;
      setCurrentIndex(normalizedIndex);
      setFlipped(false);
      setAnnouncement(
        `Thẻ ${normalizedIndex + 1} trên ${cards.length}: ${cards[normalizedIndex]?.term ?? ""}`,
      );
    },
    [cards],
  );

  const showNext = useCallback(
    () => showCard(currentIndex + 1),
    [currentIndex, showCard],
  );
  const showPrevious = useCallback(
    () => showCard(currentIndex - 1),
    [currentIndex, showCard],
  );

  const flipCard = useCallback(() => {
    if (resumePromptOpen) {
      setAnnouncement("Hãy chọn tiếp tục hoặc học lại từ đầu trước.");
      return;
    }
    setFlipped((isFlipped) => !isFlipped);
    setAnnouncement(flipped ? "Đã xem mặt trước." : "Đã xem mặt sau.");
  }, [flipped, resumePromptOpen]);

  const enqueueSave = useCallback(
    (operation: () => Promise<unknown>, failureMessage: string) => {
      if (pendingSaveCount.current === 0) {
        saveFailed.current = false;
      }
      pendingSaveCount.current += 1;
      setSaveState("saving");

      const task = saveQueue.current.then(operation);
      saveQueue.current = task.then(
        () => undefined,
        () => undefined,
      );

      void task
        .catch(() => {
          saveFailed.current = true;
          setAnnouncement(failureMessage);
        })
        .finally(() => {
          pendingSaveCount.current -= 1;
          if (pendingSaveCount.current === 0) {
            setSaveState(saveFailed.current ? "error" : "saved");
          }
        });
    },
    [],
  );

  const persistRating = useCallback(
    (termId: string, rating: Rating) => {
      if (!progressPersistenceEnabled) return;
      enqueueSave(
        () => rateVocabularyTerm(setSlug, termId, rating),
        "Chưa thể đồng bộ tiến độ. Kết quả vẫn được giữ trong phiên này.",
      );
    },
    [enqueueSave, progressPersistenceEnabled, setSlug],
  );

  const persistStudyPosition = useCallback(
    (termId: string, index: number) => {
      if (!progressPersistenceEnabled) return;
      const positionKey = `${termId}:${index}`;
      if (lastPersistedPosition.current === positionKey) return;
      lastPersistedPosition.current = positionKey;

      enqueueSave(async () => {
        try {
          await saveVocabularyStudySession(setSlug, termId, index);
        } catch (error) {
          if (lastPersistedPosition.current === positionKey) {
            lastPersistedPosition.current = null;
          }
          throw error;
        }
      }, "Chưa thể lưu vị trí thẻ hiện tại. Bạn vẫn có thể tiếp tục học trong phiên này.");
    },
    [enqueueSave, progressPersistenceEnabled, setSlug],
  );

  useEffect(() => {
    if (!positionPersistenceReady.current || resumePromptOpen || !currentTerm) {
      return;
    }

    persistStudyPosition(currentTerm.id, currentIndex);
  }, [currentIndex, currentTerm, persistStudyPosition, resumePromptOpen]);

  const rateCard = useCallback(
    (rating: Rating) => {
      if (!currentTerm || resumePromptOpen) return;
      if (!flipped) {
        setAnnouncement("Hãy lật thẻ trước khi chọn mức độ ghi nhớ.");
        return;
      }
      locallyRatedTerms.current.add(currentTerm.id);
      setRatings((currentRatings) => ({
        ...currentRatings,
        [currentTerm.id]: rating,
      }));
      persistRating(currentTerm.id, rating);
      showNext();
      setAnnouncement(
        `${currentTerm.term}: ${ratingMeta[rating].label}, ${ratingMeta[rating].schedule.toLocaleLowerCase("vi")}. Đã chuyển sang thẻ tiếp theo.`,
      );
    },
    [currentTerm, flipped, persistRating, resumePromptOpen, showNext],
  );

  const shuffleCards = useCallback(() => {
    setCards((currentCards) => {
      const shuffledCards = [...currentCards];
      for (let index = shuffledCards.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffledCards[index], shuffledCards[randomIndex]] = [
          shuffledCards[randomIndex]!,
          shuffledCards[index]!,
        ];
      }
      return shuffledCards;
    });
    setCurrentIndex(0);
    setFlipped(false);
    setAnnouncement("Đã xáo trộn bộ thẻ.");
  }, []);

  const resetSession = useCallback(() => {
    positionPersistenceReady.current = true;
    setResumePromptOpen(false);
    setCards(orderedTerms);
    setCurrentIndex(0);
    setFlipped(false);
    if (!progressPersistenceEnabled) {
      setRatings({});
    }
    setAnnouncement(
      progressPersistenceEnabled
        ? "Đã quay lại thẻ đầu tiên. Tiến độ đã lưu được giữ nguyên."
        : "Đã bắt đầu lại phiên học.",
    );
    const firstTerm = orderedTerms[0];
    if (firstTerm) persistStudyPosition(firstTerm.id, 0);
  }, [orderedTerms, persistStudyPosition, progressPersistenceEnabled]);

  const continueSavedSession = useCallback(() => {
    positionPersistenceReady.current = true;
    setResumePromptOpen(false);
    setCurrentIndex(initialSessionIndex);
    setFlipped(false);
    setAnnouncement(
      `Đã tiếp tục từ thẻ ${initialSessionIndex + 1} trên ${orderedTerms.length}.`,
    );
  }, [initialSessionIndex, orderedTerms.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select")) return;
      if (resumePromptOpen) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrevious();
      } else if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        flipCard();
      } else if (event.key === "1") {
        rateCard("AGAIN");
      } else if (event.key === "2") {
        rateCard("HARD");
      } else if (event.key === "3") {
        rateCard("GOOD");
      } else if (event.key === "4") {
        rateCard("EASY");
      } else if (event.key.toLocaleLowerCase() === "s" && currentTerm) {
        speakTerm(currentTerm);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentTerm,
    flipCard,
    rateCard,
    resumePromptOpen,
    showNext,
    showPrevious,
    speakTerm,
  ]);

  useEffect(() => {
    if (autoSpeak && currentTerm) {
      speakTerm(currentTerm);
    }
  }, [autoSpeak, currentIndex, currentTerm, speakTerm]);

  if (!currentTerm) {
    return (
      <div className="glass-card p-8 text-center text-sm text-white/60">
        Bộ từ này chưa có thẻ để học.
      </div>
    );
  }

  const frontIsEnglish = direction === "EN_VI";
  const currentRating = ratings[currentTerm.id];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <section aria-labelledby="flashcard-session-title">
      {resumePromptOpen && resumeTerm ? (
        <div
          className="glass-card mb-6 flex flex-col gap-5 border border-[color-mix(in_srgb,var(--accent)_28%,transparent)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
          role="region"
          aria-labelledby="resume-session-title"
        >
          <div className="flex items-start gap-4">
            <span className="grid size-11 flex-none place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--accent)]">
                Phiên học đang dở
              </p>
              <h2
                id="resume-session-title"
                className="mt-1 text-lg font-black text-white sm:text-xl"
              >
                Tiếp tục từ thẻ {initialSessionIndex + 1}?
              </h2>
              <p className="mt-1 text-sm leading-6 text-white/60">
                Lần trước bạn dừng ở “{resumeTerm.term}”.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 text-sm font-black text-[var(--accent-ink)] transition hover:bg-[var(--accent-hover)]"
              onClick={continueSavedSession}
              autoFocus
            >
              <Play className="size-4" aria-hidden="true" />
              Tiếp tục
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/8 px-5 text-sm font-bold text-white/72 transition hover:bg-white/14 hover:text-white"
              onClick={resetSession}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Học lại từ đầu
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--accent)]">
            Phiên học Flashcard
          </p>
          <h1
            id="flashcard-session-title"
            className="mt-2 text-2xl font-black tracking-[-0.018em] sm:text-3xl"
          >
            Thẻ {currentIndex + 1} / {cards.length}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="flex min-h-11 items-center gap-2 rounded-full bg-white/8 px-4 text-xs font-extrabold text-white/70 transition hover:bg-white/14 hover:text-white"
            onClick={() => {
              setDirection((currentDirection) =>
                currentDirection === "EN_VI" ? "VI_EN" : "EN_VI",
              );
              setFlipped(false);
            }}
            aria-label="Đổi chiều học"
          >
            <Languages className="size-4" aria-hidden="true" />
            {frontIsEnglish ? "Anh → Việt" : "Việt → Anh"}
          </button>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full bg-white/8 text-white/65 transition hover:bg-white/14 hover:text-white"
            onClick={shuffleCards}
            aria-label="Xáo trộn bộ thẻ"
            title="Xáo trộn"
          >
            <Shuffle className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`grid size-11 place-items-center rounded-full transition ${
              autoSpeak
                ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                : "bg-white/8 text-white/65 hover:bg-white/14 hover:text-white"
            }`}
            onClick={() => setAutoSpeak((enabled) => !enabled)}
            aria-pressed={autoSpeak}
            aria-label={
              autoSpeak ? "Tắt tự động phát âm" : "Bật tự động phát âm"
            }
            title={autoSpeak ? "Tắt tự động phát âm" : "Bật tự động phát âm"}
            style={autoSpeak ? { color: "var(--accent-ink)" } : undefined}
          >
            {autoSpeak ? (
              <Volume2 className="size-4" aria-hidden="true" />
            ) : (
              <VolumeX className="size-4" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full bg-white/8 text-white/65 transition hover:bg-white/14 hover:text-white"
            onClick={resetSession}
            aria-label="Bắt đầu lại phiên học"
            title="Bắt đầu lại"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
          </button>
        </div>
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

      <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-white/58">
        <span className="rounded-full bg-emerald-300/12 px-3 py-1.5 text-emerald-100">
          Nhớ tốt {rememberedCount}
        </span>
        <span className="rounded-full bg-amber-300/12 px-3 py-1.5 text-amber-100">
          Cần ôn {needsReviewCount}
        </span>
        <span className="rounded-full bg-white/7 px-3 py-1.5">
          Đã phân loại {Object.keys(ratings).length}/{cards.length}
        </span>
        <span
          className={`rounded-full px-3 py-1.5 ${
            saveState === "error"
              ? "bg-red-300/12 text-red-100"
              : saveState === "saving"
                ? "bg-sky-300/12 text-sky-100"
                : "bg-white/7"
          }`}
          role="status"
          aria-live="polite"
        >
          {progressPersistenceEnabled
            ? saveState === "saving"
              ? "Đang lưu…"
              : saveState === "error"
                ? "Chưa đồng bộ"
                : saveState === "saved"
                  ? "Đã đồng bộ"
                  : "Tự động lưu"
            : "Chỉ lưu trong phiên"}
        </span>
      </div>

      <div className="relative mx-auto mt-7 h-[390px] w-full max-w-3xl [perspective:1400px] sm:h-[430px]">
        <button
          type="button"
          className="block h-full w-full touch-pan-y rounded-[28px] text-left"
          onClick={() => {
            if (ignoreNextClick.current) return;
            flipCard();
          }}
          disabled={resumePromptOpen}
          onPointerDown={(event) => {
            pointerStartX.current = event.clientX;
          }}
          onPointerUp={(event) => {
            if (pointerStartX.current === null) return;
            const distance = event.clientX - pointerStartX.current;
            pointerStartX.current = null;

            if (Math.abs(distance) < 60) return;
            ignoreNextClick.current = true;
            if (distance < 0) showNext();
            else showPrevious();
            window.setTimeout(() => {
              ignoreNextClick.current = false;
            }, 0);
          }}
          onPointerCancel={() => {
            pointerStartX.current = null;
          }}
          aria-label={`Thẻ ${currentIndex + 1}: ${currentTerm.term}. Nhấn để lật thẻ.`}
          aria-pressed={flipped}
        >
          <span
            className={`relative block h-full w-full transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none ${
              flipped ? "[transform:rotateY(180deg)]" : ""
            }`}
          >
            <span
              className="glass-card absolute inset-0 grid place-items-center overflow-hidden border border-white/12 p-7 text-center shadow-2xl shadow-black/30 [backface-visibility:hidden] sm:p-12"
              aria-hidden={flipped}
            >
              <span className="absolute left-5 top-5 rounded-full bg-white/8 px-3 py-1.5 text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-white/48">
                {frontIsEnglish ? "English" : "Tiếng Việt"}
              </span>
              {currentRating ? (
                <span
                  className={`absolute right-5 top-5 rounded-full px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wider ${ratingMeta[currentRating].badgeTone}`}
                >
                  {ratingMeta[currentRating].label}
                </span>
              ) : null}

              <span>
                <span className="block text-4xl font-black leading-tight tracking-[-0.022em] text-balance sm:text-6xl">
                  {frontIsEnglish ? currentTerm.term : currentTerm.meaningVi}
                </span>
                {frontIsEnglish && currentTerm.ipa ? (
                  <span className="mt-4 block text-base font-semibold text-white/48 sm:text-lg">
                    {currentTerm.ipa}
                  </span>
                ) : null}
                <span className="mt-8 inline-flex items-center gap-2 text-xs font-bold text-white/42">
                  <FlipHorizontal2 className="size-4" aria-hidden="true" />
                  Chạm hoặc nhấn Space để lật
                </span>
              </span>
            </span>

            <span
              className="glass-card absolute inset-0 grid place-items-center overflow-hidden border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--glass-strong)_86%,var(--accent-soft))] p-7 text-center shadow-2xl shadow-black/30 [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-12"
              aria-hidden={!flipped}
            >
              <span className="absolute left-5 top-5 rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-[var(--accent)]">
                {frontIsEnglish ? "Nghĩa & ví dụ" : "English"}
              </span>
              <span className="max-w-2xl">
                <span className="block text-2xl font-black leading-tight tracking-[-0.016em] text-[var(--accent)] sm:text-4xl">
                  {frontIsEnglish ? currentTerm.meaningVi : currentTerm.term}
                </span>
                {!frontIsEnglish && currentTerm.ipa ? (
                  <span className="mt-2 block text-sm font-semibold text-white/48">
                    {currentTerm.ipa}
                  </span>
                ) : null}
                {currentTerm.exampleEn ? (
                  <span className="mt-7 block border-l-2 border-[var(--accent)] pl-4 text-left">
                    <span className="block text-sm font-semibold leading-6 text-white/78 sm:text-base">
                      {currentTerm.exampleEn}
                    </span>
                    {currentTerm.exampleVi ? (
                      <span className="mt-1 block text-xs leading-5 text-white/45 sm:text-sm">
                        {currentTerm.exampleVi}
                      </span>
                    ) : null}
                  </span>
                ) : null}
                {currentTerm.collocations.length ? (
                  <span className="mt-6 flex flex-wrap justify-center gap-2">
                    {currentTerm.collocations.map((collocation) => (
                      <span
                        key={collocation}
                        className="rounded-full bg-white/8 px-3 py-1.5 text-xs font-bold text-white/58"
                      >
                        {collocation}
                      </span>
                    ))}
                  </span>
                ) : null}
              </span>
            </span>
          </span>
        </button>
      </div>

      <div className="mx-auto mt-6 grid max-w-3xl grid-cols-[auto_1fr_auto] items-stretch gap-2 sm:gap-3">
        <button
          type="button"
          className="grid min-h-12 min-w-12 place-items-center rounded-2xl bg-white/8 text-white/65 transition hover:bg-white/14 hover:text-white"
          onClick={showPrevious}
          disabled={resumePromptOpen}
          aria-label="Thẻ trước"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>
        <fieldset
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          aria-describedby="flashcard-rating-hint"
        >
          <legend className="sr-only">Đánh giá mức độ ghi nhớ</legend>
          {(Object.keys(ratingMeta) as Rating[]).map((rating, index) => (
            <button
              key={rating}
              type="button"
              className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl px-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-35 ${ratingMeta[rating].buttonTone}`}
              onClick={() => rateCard(rating)}
              disabled={resumePromptOpen || !flipped}
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
          ))}
        </fieldset>
        <button
          type="button"
          className="grid min-h-12 min-w-12 place-items-center rounded-2xl bg-[var(--accent)] text-[var(--accent-ink)] transition hover:bg-[var(--accent-hover)]"
          onClick={showNext}
          disabled={resumePromptOpen}
          aria-label="Thẻ tiếp theo"
          style={{ color: "var(--accent-ink)" }}
        >
          <ArrowRight className="size-5" aria-hidden="true" />
        </button>
      </div>

      <p
        id="flashcard-rating-hint"
        className="mx-auto mt-3 max-w-3xl text-center text-xs text-white/42"
      >
        {flipped
          ? "Chọn mức độ nhớ để lên lịch ôn tiếp theo."
          : "Lật thẻ để mở bốn mức đánh giá."}
      </p>

      <div className="mx-auto mt-3 flex max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[0.68rem] font-semibold text-white/38">
        <span>← → điều hướng</span>
        <span>Space lật thẻ</span>
        <span>1–4 đánh giá</span>
        <button
          type="button"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-2 text-white/48 hover:bg-white/8 hover:text-white"
          onClick={() => speakTerm(currentTerm)}
        >
          <Volume2 className="size-3.5" aria-hidden="true" />S phát âm
        </button>
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </section>
  );
}
