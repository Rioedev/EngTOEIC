"use client";

import {
  Check,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Grid3X3,
  Headphones,
  Keyboard,
  ListChecks,
  Medal,
  RefreshCcw,
  Shuffle,
  Sparkles,
  Timer,
  Trophy,
  Volume2,
  X,
} from "lucide-react";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  VocabularyLearnSession,
  VocabularyLearnStudyMode,
  VocabularyMatchLeaderboard,
  VocabularyProgressStatus,
  VocabularyTerm,
  VocabularyTermProgress,
} from "@/lib/vocabulary";
import {
  clearVocabularyLearnSession,
  recordVocabularyTermAnswer,
  saveVocabularyLearnSession,
  saveVocabularyMatchResult,
} from "@/lib/vocabulary-progress-client";
import {
  getAudioPreferences,
  playVocabularyAudio,
} from "@/lib/user-preferences";

type LearnPlayerProps = {
  terms: VocabularyTerm[];
  setSlug: string;
  initialProgress: VocabularyTermProgress[];
  initialLearnSession: VocabularyLearnSession | null;
  initialMatchLeaderboard: VocabularyMatchLeaderboard | null;
  progressPersistenceEnabled: boolean;
};

type QuestionMode =
  "multiple-choice" | "write" | "listen" | "dictation" | "true-false";
type StudyMode = VocabularyLearnStudyMode;
type SaveState = "idle" | "saving" | "saved" | "error";
type Feedback = {
  correct: boolean;
  answer: string;
  statusAfter: VocabularyProgressStatus;
  mode: QuestionMode;
};

const adaptiveModes: Record<VocabularyProgressStatus, QuestionMode[]> = {
  NEW: ["multiple-choice", "true-false"],
  LEARNING: ["listen", "multiple-choice", "true-false"],
  FAMILIAR: ["write", "listen", "dictation"],
  MASTERED: ["dictation", "write"],
};

const progressMeta: Record<
  VocabularyProgressStatus,
  { label: string; description: string; tone: string }
> = {
  NEW: {
    label: "Mới",
    description: "Bắt đầu bằng dạng nhận diện.",
    tone: "bg-white/8 text-white/62",
  },
  LEARNING: {
    label: "Đang học",
    description: "Củng cố bằng nghe và lựa chọn.",
    tone: "bg-amber-300/12 text-amber-100",
  },
  FAMILIAR: {
    label: "Quen thuộc",
    description: "Chuyển sang chủ động nhớ và viết.",
    tone: "bg-sky-300/12 text-sky-100",
  },
  MASTERED: {
    label: "Thành thạo",
    description: "Duy trì với nghe viết và recall.",
    tone: "bg-emerald-300/12 text-emerald-100",
  },
};

const progressRank: Record<VocabularyProgressStatus, number> = {
  NEW: 0,
  LEARNING: 1,
  FAMILIAR: 2,
  MASTERED: 3,
};

function nextProgressStatus(
  current: VocabularyProgressStatus,
  correct: boolean,
): VocabularyProgressStatus {
  if (correct) {
    if (current === "NEW") return "LEARNING";
    if (current === "LEARNING") return "FAMILIAR";
    return "MASTERED";
  }

  if (current === "MASTERED") return "FAMILIAR";
  return "LEARNING";
}

const studyModeMeta: Record<
  StudyMode,
  {
    label: string;
    description: string;
    icon: typeof Sparkles;
    accent: string;
  }
> = {
  mixed: {
    label: "Learn tổng hợp",
    description: "Trộn nhiều dạng bài và lặp lại những từ bạn trả lời sai.",
    icon: Shuffle,
    accent: "from-cyan-300/22 to-blue-400/8",
  },
  match: {
    label: "Ghép thẻ",
    description: "Ghép từ tiếng Anh với nghĩa tiếng Việt tương ứng.",
    icon: Grid3X3,
    accent: "from-violet-300/22 to-fuchsia-400/8",
  },
  dictation: {
    label: "Nghe & viết",
    description: "Nghe phát âm rồi viết lại chính xác từ vừa nghe.",
    icon: Headphones,
    accent: "from-amber-300/22 to-orange-400/8",
  },
  "multiple-choice": {
    label: "Trắc nghiệm",
    description: "Chọn nghĩa đúng trong bốn phương án.",
    icon: ListChecks,
    accent: "from-emerald-300/22 to-teal-400/8",
  },
  write: {
    label: "Viết từ",
    description: "Nhìn nghĩa tiếng Việt và chủ động nhớ từ tiếng Anh.",
    icon: Keyboard,
    accent: "from-rose-300/22 to-pink-400/8",
  },
  "true-false": {
    label: "Đúng / Sai",
    description: "Xác định nhanh từ và nghĩa có khớp nhau hay không.",
    icon: CircleHelp,
    accent: "from-sky-300/22 to-indigo-400/8",
  },
};

const modeMeta: Record<
  QuestionMode,
  { label: string; instruction: string; icon: typeof ListChecks }
> = {
  "multiple-choice": {
    label: "Chọn đáp án",
    instruction: "Chọn nghĩa tiếng Việt phù hợp nhất.",
    icon: ListChecks,
  },
  write: {
    label: "Viết từ",
    instruction: "Nhập từ tiếng Anh tương ứng với nghĩa đã cho.",
    icon: Keyboard,
  },
  listen: {
    label: "Nghe hiểu",
    instruction: "Nghe từ và chọn nghĩa chính xác.",
    icon: Headphones,
  },
  dictation: {
    label: "Nghe & viết",
    instruction: "Nghe phát âm và viết lại chính xác từ tiếng Anh.",
    icon: Headphones,
  },
  "true-false": {
    label: "Đúng hay sai",
    instruction: "Xác định cặp từ và nghĩa có khớp nhau không.",
    icon: CheckCircle2,
  },
};

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [
      result[randomIndex]!,
      result[index]!,
    ];
  }
  return result;
}

function normalizeAnswer(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9\s'-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildMeaningOptions(terms: VocabularyTerm[], current: VocabularyTerm) {
  const distractors = shuffle(
    terms.filter(
      (term) => term.id !== current.id && term.meaningVi !== current.meaningVi,
    ),
  )
    .slice(0, 3)
    .map((term) => term.meaningVi);

  return shuffle([current.meaningVi, ...distractors]);
}

type MatchCard = {
  id: string;
  termId: string;
  label: string;
  kind: "term" | "meaning";
};

const MATCH_PAIR_COUNT = 6;

function formatMatchDuration(durationMs: number) {
  const totalTenths = Math.max(0, Math.floor(durationMs / 100));
  const minutes = Math.floor(totalTenths / 600);
  const seconds = Math.floor((totalTenths % 600) / 10);
  const tenths = totalTenths % 10;

  return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

function PersonalMatchLeaderboard({
  leaderboard,
  persistenceEnabled,
  highlightedResultId,
}: {
  leaderboard: VocabularyMatchLeaderboard | null;
  persistenceEnabled: boolean;
  highlightedResultId: string | null;
}) {
  if (!persistenceEnabled) {
    return (
      <section
        className="mt-6 rounded-2xl border border-white/9 bg-black/12 p-5 text-left"
        aria-labelledby="match-leaderboard-title"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-10 flex-none place-items-center rounded-xl bg-white/8 text-white/52">
            <Trophy className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="match-leaderboard-title"
              className="text-sm font-semibold text-white/82"
            >
              Thành tích Match cá nhân
            </h2>
            <p className="mt-1 text-xs leading-5 text-white/50">
              Đăng nhập để lưu thời gian và xem top thành tích của riêng bạn.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const results = leaderboard?.data ?? [];

  return (
    <section
      className="mt-6 rounded-2xl border border-white/9 bg-black/12 p-5 text-left"
      aria-labelledby="match-leaderboard-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Trophy className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="match-leaderboard-title"
              className="text-sm font-semibold text-white/82"
            >
              Thành tích Match cá nhân
            </h2>
            <p className="mt-0.5 text-xs text-white/44">
              {leaderboard?.summary.totalPlays ?? 0} lượt đã lưu
            </p>
          </div>
        </div>
        {leaderboard?.summary.bestDurationMs !== null &&
        leaderboard?.summary.bestDurationMs !== undefined ? (
          <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)]">
            Tốt nhất {formatMatchDuration(leaderboard.summary.bestDurationMs)}
          </span>
        ) : null}
      </div>

      {results.length ? (
        <ol className="mt-4 space-y-2" aria-label="Top thành tích cá nhân">
          {results.map((result) => {
            const highlighted = result.id === highlightedResultId;
            return (
              <li
                key={result.id}
                className={`grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-xl border px-3 py-2.5 ${
                  highlighted
                    ? "border-[var(--accent)]/45 bg-[var(--accent-soft)]"
                    : "border-white/7 bg-white/5"
                }`}
              >
                <span
                  className={`grid size-8 place-items-center rounded-lg text-xs font-semibold ${
                    result.rank === 1
                      ? "bg-amber-300/16 text-amber-100"
                      : "bg-white/7 text-white/48"
                  }`}
                >
                  {result.rank === 1 ? (
                    <Medal className="size-4" aria-label="Hạng nhất" />
                  ) : (
                    result.rank
                  )}
                </span>
                <span>
                  <strong className="block text-sm font-semibold text-white/88">
                    {formatMatchDuration(result.durationMs)}
                  </strong>
                  <span className="text-[0.7rem] text-white/44">
                    {result.moves} lượt · {result.mistakes} lỗi
                  </span>
                </span>
                <time
                  className="text-[0.68rem] text-white/38"
                  dateTime={result.createdAt}
                >
                  {new Intl.DateTimeFormat("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                  }).format(new Date(result.createdAt))}
                </time>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-4 rounded-xl bg-white/5 px-4 py-3 text-xs leading-5 text-white/48">
          Hoàn thành một vòng để ghi tên vào bảng thành tích cá nhân.
        </p>
      )}
    </section>
  );
}

function MatchingSession({
  terms,
  setSlug,
  saveState,
  progressPersistenceEnabled,
  initialMatchLeaderboard,
  onMatch,
  onExit,
}: {
  terms: VocabularyTerm[];
  setSlug: string;
  saveState: SaveState;
  progressPersistenceEnabled: boolean;
  initialMatchLeaderboard: VocabularyMatchLeaderboard | null;
  onMatch: (termId: string) => void;
  onExit: () => void;
}) {
  const [round, setRound] = useState(1);
  const [roundTermIds, setRoundTermIds] = useState(() =>
    shuffle(terms)
      .slice(0, Math.min(MATCH_PAIR_COUNT, terms.length))
      .map((term) => term.id),
  );
  const [usedTermIds, setUsedTermIds] = useState<Set<string>>(
    () => new Set(roundTermIds),
  );
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [matchedTermIds, setMatchedTermIds] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [message, setMessage] = useState(
    "Chọn một thẻ tiếng Anh và một thẻ nghĩa tiếng Việt.",
  );
  const [roundStartedAt, setRoundStartedAt] = useState(() => Date.now());
  const [elapsedMs, setElapsedMs] = useState(0);
  const [completedDurationMs, setCompletedDurationMs] = useState<number | null>(
    null,
  );
  const [leaderboard, setLeaderboard] =
    useState<VocabularyMatchLeaderboard | null>(initialMatchLeaderboard);
  const [resultSaveState, setResultSaveState] = useState<SaveState>("idle");
  const [savedResultId, setSavedResultId] = useState<string | null>(null);
  const savedRounds = useRef<Set<number>>(new Set());
  const activeTerms = useMemo(
    () => terms.filter((term) => roundTermIds.includes(term.id)),
    [roundTermIds, terms],
  );
  const cards = useMemo<MatchCard[]>(
    () =>
      shuffle(
        activeTerms.flatMap((term) => [
          {
            id: `${term.id}-term`,
            termId: term.id,
            label: term.term,
            kind: "term" as const,
          },
          {
            id: `${term.id}-meaning`,
            termId: term.id,
            label: term.meaningVi,
            kind: "meaning" as const,
          },
        ]),
      ),
    [activeTerms, round],
  );
  const selectedCard = cards.find((card) => card.id === selectedCardId);
  const completed = matchedTermIds.size === activeTerms.length;

  useEffect(() => {
    if (completed || completedDurationMs !== null) return;

    const updateElapsed = () => setElapsedMs(Date.now() - roundStartedAt);
    updateElapsed();
    const intervalId = window.setInterval(updateElapsed, 100);

    return () => window.clearInterval(intervalId);
  }, [completed, completedDurationMs, roundStartedAt]);

  useEffect(() => {
    if (!completed || savedRounds.current.has(round)) return;

    savedRounds.current.add(round);
    const durationMs = Math.max(1000, Date.now() - roundStartedAt);
    setElapsedMs(durationMs);
    setCompletedDurationMs(durationMs);

    if (!progressPersistenceEnabled) return;

    setResultSaveState("saving");
    void saveVocabularyMatchResult(setSlug, {
      durationMs,
      moves,
      mistakes,
      pairCount: activeTerms.length,
    })
      .then((result) => {
        setLeaderboard(result);
        setSavedResultId(result.latestResultId ?? null);
        setResultSaveState("saved");
      })
      .catch(() => {
        setResultSaveState("error");
      });
  }, [
    activeTerms.length,
    completed,
    mistakes,
    moves,
    progressPersistenceEnabled,
    round,
    roundStartedAt,
    setSlug,
  ]);

  const selectCard = (card: MatchCard) => {
    if (matchedTermIds.has(card.termId)) return;
    if (!selectedCard || selectedCard.id === card.id) {
      setSelectedCardId(selectedCard?.id === card.id ? null : card.id);
      setMessage(
        selectedCard?.id === card.id
          ? "Đã bỏ chọn thẻ."
          : `Đã chọn thẻ ${card.label}. Hãy tìm thẻ tương ứng.`,
      );
      return;
    }

    setMoves((current) => current + 1);
    if (
      selectedCard.termId === card.termId &&
      selectedCard.kind !== card.kind
    ) {
      setMatchedTermIds((current) => new Set(current).add(card.termId));
      setSelectedCardId(null);
      setMessage(`Chính xác! ${selectedCard.label} ghép với ${card.label}.`);
      onMatch(card.termId);
      return;
    }

    setMistakes((current) => current + 1);
    setSelectedCardId(card.id);
    setMessage("Chưa khớp. Thẻ thứ hai đã được giữ lại để bạn thử tiếp.");
  };

  const startNextRound = () => {
    const pairCount = Math.min(MATCH_PAIR_COUNT, terms.length);
    const currentRoundIds = new Set(roundTermIds);
    const unseenTerms = shuffle(
      terms.filter((term) => !usedTermIds.has(term.id)),
    );
    const nextTerms = unseenTerms.slice(0, pairCount);

    if (nextTerms.length < pairCount) {
      const previousRoundAlternatives = shuffle(
        terms.filter(
          (term) =>
            !currentRoundIds.has(term.id) &&
            !nextTerms.some((nextTerm) => nextTerm.id === term.id),
        ),
      );
      nextTerms.push(
        ...previousRoundAlternatives.slice(0, pairCount - nextTerms.length),
      );
    }

    if (nextTerms.length < pairCount) {
      const remainingTerms = shuffle(
        terms.filter(
          (term) => !nextTerms.some((nextTerm) => nextTerm.id === term.id),
        ),
      );
      nextTerms.push(...remainingTerms.slice(0, pairCount - nextTerms.length));
    }

    const nextTermIds = nextTerms.map((term) => term.id);
    setRound((current) => current + 1);
    setRoundTermIds(nextTermIds);
    setUsedTermIds(
      unseenTerms.length === 0
        ? new Set(nextTermIds)
        : new Set([...usedTermIds, ...nextTermIds]),
    );
    setSelectedCardId(null);
    setMatchedTermIds(new Set());
    setMoves(0);
    setMistakes(0);
    setRoundStartedAt(Date.now());
    setElapsedMs(0);
    setCompletedDurationMs(null);
    setResultSaveState("idle");
    setSavedResultId(null);
    setMessage("Vòng mới đã sẵn sàng với nhóm từ khác.");
  };

  if (completed) {
    return (
      <section
        className="glass-card mx-auto max-w-3xl p-7 text-center sm:p-10"
        aria-labelledby="match-result-title"
      >
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
          <CheckCircle2 className="size-8" aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Hoàn thành Ghép thẻ
        </p>
        <h1
          id="match-result-title"
          className="mt-2 text-3xl font-bold tracking-[-0.018em] sm:text-5xl"
        >
          Đã ghép đúng {activeTerms.length} cặp
        </h1>
        <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white/7 p-4">
            <Timer
              className="mx-auto size-4 text-[var(--accent)]"
              aria-hidden="true"
            />
            <strong className="mt-2 block text-xl font-semibold">
              {formatMatchDuration(completedDurationMs ?? elapsedMs)}
            </strong>
            <span className="text-[0.68rem] text-white/46">Thời gian</span>
          </div>
          <div className="rounded-2xl bg-white/7 p-4">
            <strong className="block text-xl font-semibold">{moves}</strong>
            <span className="mt-2 block text-[0.68rem] text-white/46">
              Lượt ghép
            </span>
          </div>
          <div className="rounded-2xl bg-white/7 p-4">
            <strong className="block text-xl font-semibold">{mistakes}</strong>
            <span className="mt-2 block text-[0.68rem] text-white/46">
              Lượt lỗi
            </span>
          </div>
        </div>
        <p
          className={`mt-4 text-xs ${
            resultSaveState === "error" ? "text-rose-200" : "text-white/48"
          }`}
          role="status"
        >
          {!progressPersistenceEnabled
            ? "Đăng nhập để lưu thành tích."
            : resultSaveState === "saving"
              ? "Đang lưu thành tích…"
              : resultSaveState === "saved"
                ? "Đã lưu vào bảng thành tích cá nhân."
                : resultSaveState === "error"
                  ? "Chưa thể lưu thành tích. Bạn có thể chơi vòng mới và thử lại."
                  : "Đang tổng hợp kết quả…"}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            className="min-h-12 rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--accent-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            onClick={startNextRound}
          >
            <RefreshCcw className="mr-2 inline size-4" aria-hidden="true" />
            Vòng tiếp theo
          </button>
          <button
            type="button"
            className="min-h-12 rounded-full bg-white/9 px-6 text-sm font-semibold text-white/78 hover:bg-white/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            onClick={onExit}
          >
            Chọn chế độ khác
          </button>
        </div>
        <PersonalMatchLeaderboard
          leaderboard={leaderboard}
          persistenceEnabled={progressPersistenceEnabled}
          highlightedResultId={savedResultId}
        />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl" aria-labelledby="match-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Chế độ riêng
          </p>
          <h1
            id="match-title"
            className="mt-2 text-2xl font-bold tracking-[-0.018em] sm:text-3xl"
          >
            Ghép thẻ · vòng {round} · {matchedTermIds.size}/{activeTerms.length}{" "}
            cặp
          </h1>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-3 py-2 text-[var(--accent)]">
            <Timer className="size-3.5" aria-hidden="true" />
            <time aria-label={`Thời gian ${formatMatchDuration(elapsedMs)}`}>
              {formatMatchDuration(elapsedMs)}
            </time>
          </span>
          <span className="rounded-full bg-white/7 px-3 py-2 text-white/58">
            {moves} lượt ghép
          </span>
          <span
            className="rounded-full bg-white/7 px-3 py-2 text-white/58"
            role="status"
          >
            {progressPersistenceEnabled
              ? saveState === "saving"
                ? "Đang lưu…"
                : saveState === "error"
                  ? "Chưa đồng bộ"
                  : "Tự động lưu"
              : "Chỉ lưu trong phiên"}
          </span>
        </div>
      </div>

      <p className="mt-3 text-sm text-white/52">
        Mỗi vòng có tối đa {MATCH_PAIR_COUNT} cặp. Vòng tiếp theo ưu tiên những
        từ chưa xuất hiện.
      </p>

      <div className="glass-card mt-6 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {cards.map((card) => {
            const matched = matchedTermIds.has(card.termId);
            const selected = selectedCardId === card.id;
            return (
              <button
                key={card.id}
                type="button"
                className={`min-h-24 rounded-2xl border px-3 py-4 text-sm font-semibold leading-5 transition motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] sm:min-h-28 sm:px-5 ${
                  matched
                    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100 opacity-35"
                    : selected
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] ring-2 ring-[var(--accent-glow)]"
                      : "border-white/10 bg-white/6 text-white/76 hover:border-white/25 hover:bg-white/11 hover:text-white"
                }`}
                disabled={matched}
                aria-pressed={selected}
                onClick={() => selectCard(card)}
              >
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/38">
                  {card.kind === "term" ? "English" : "Tiếng Việt"}
                </span>
                <span className="mt-2 block">{card.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <p
        className="mt-4 text-center text-sm font-medium text-white/62"
        aria-live="polite"
      >
        {message}
      </p>
      <button
        type="button"
        className="mx-auto mt-5 block min-h-11 rounded-full bg-white/8 px-5 text-xs font-semibold text-white/65 hover:bg-white/14 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        onClick={onExit}
      >
        Đổi chế độ học
      </button>
      <PersonalMatchLeaderboard
        leaderboard={leaderboard}
        persistenceEnabled={progressPersistenceEnabled}
        highlightedResultId={savedResultId}
      />
    </section>
  );
}

export function LearnPlayer({
  terms,
  setSlug,
  initialProgress,
  initialLearnSession,
  initialMatchLeaderboard,
  progressPersistenceEnabled,
}: LearnPlayerProps) {
  const orderedTerms = useMemo(
    () => [...terms].sort((first, second) => first.order - second.order),
    [terms],
  );
  const [progressByTerm, setProgressByTerm] = useState(
    () =>
      new Map<string, VocabularyProgressStatus>(
        initialProgress.map((item) => [item.termId, item.status]),
      ),
  );
  const [resumeCheckpoint, setResumeCheckpoint] =
    useState<VocabularyLearnSession | null>(() => {
      if (
        !initialLearnSession ||
        initialLearnSession.studyMode === "match" ||
        initialLearnSession.currentIndex >=
          initialLearnSession.queueTermIds.length
      ) {
        return null;
      }
      const availableTermIds = new Set(orderedTerms.map((term) => term.id));
      return initialLearnSession.queueTermIds.every((termId) =>
        availableTermIds.has(termId),
      )
        ? initialLearnSession
        : null;
    });
  const targetOptions = useMemo(
    () =>
      Array.from(new Set([10, 20, orderedTerms.length])).filter(
        (value) => value > 0 && value <= orderedTerms.length,
      ),
    [orderedTerms.length],
  );
  const [targetCount, setTargetCount] = useState(
    targetOptions[0] ?? orderedTerms.length,
  );
  const [studyMode, setStudyMode] = useState<StudyMode>("mixed");
  const [started, setStarted] = useState(false);
  const [queue, setQueue] = useState<VocabularyTerm[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [writtenAnswer, setWrittenAnswer] = useState("");
  const [correction, setCorrection] = useState("");
  const [correctionAccepted, setCorrectionAccepted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongTermIds, setWrongTermIds] = useState<Set<string>>(new Set());
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [checkpointState, setCheckpointState] = useState<SaveState>(() =>
    resumeCheckpoint ? "saved" : "idle",
  );
  const [announcement, setAnnouncement] = useState("");
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const pendingSaves = useRef(0);
  const saveFailed = useRef(false);
  const checkpointQueue = useRef<Promise<void>>(Promise.resolve());
  const pendingCheckpointSaves = useRef(0);
  const checkpointFailed = useRef(false);

  const currentTerm = queue[currentIndex];
  const completed = started && currentIndex >= queue.length;
  const combinedSaveState: SaveState =
    saveState === "error" || checkpointState === "error"
      ? "error"
      : saveState === "saving" || checkpointState === "saving"
        ? "saving"
        : saveState === "saved" || checkpointState === "saved"
          ? "saved"
          : "idle";
  const currentProgressStatus = currentTerm
    ? (progressByTerm.get(currentTerm.id) ?? "NEW")
    : "NEW";
  const questionModes =
    studyMode === "mixed"
      ? adaptiveModes[currentProgressStatus]
      : studyMode === "match"
        ? adaptiveModes.NEW
        : [studyMode as QuestionMode];
  const adaptiveQuestionMode =
    questionModes[currentIndex % questionModes.length] ?? "multiple-choice";
  const mode = feedback?.mode ?? adaptiveQuestionMode;
  const ModeIcon = modeMeta[mode].icon;
  const options = useMemo(
    () => (currentTerm ? buildMeaningOptions(orderedTerms, currentTerm) : []),
    [currentIndex, currentTerm, orderedTerms],
  );
  const statementTerm = useMemo(() => {
    if (!currentTerm || mode !== "true-false") return null;
    if (currentIndex % 2 === 0 || orderedTerms.length < 2) return currentTerm;
    const currentPosition = orderedTerms.findIndex(
      (term) => term.id === currentTerm.id,
    );
    return (
      orderedTerms[(currentPosition + 1) % orderedTerms.length] ?? currentTerm
    );
  }, [currentIndex, currentTerm, mode, orderedTerms]);
  const statementIsTrue = statementTerm?.id === currentTerm?.id;

  const enqueueProgressSave = useCallback(
    (
      termId: string,
      correct: boolean,
      statusAfter: VocabularyProgressStatus,
    ) => {
      setProgressByTerm((current) => {
        const next = new Map(current);
        next.set(termId, statusAfter);
        return next;
      });
      if (!progressPersistenceEnabled) return;
      if (pendingSaves.current === 0) saveFailed.current = false;
      pendingSaves.current += 1;
      setSaveState("saving");

      const task = saveQueue.current.then(() =>
        recordVocabularyTermAnswer(setSlug, termId, correct),
      );
      saveQueue.current = task.then(
        () => undefined,
        () => undefined,
      );

      void task
        .then((savedProgress) => {
          setProgressByTerm((current) => {
            const next = new Map(current);
            next.set(termId, savedProgress.status);
            return next;
          });
          if (!savedProgress.reviewAccepted) {
            setAnnouncement(
              "Từ này đã có lịch ôn. Kết quả vẫn tính trong phiên Learn nhưng không cộng thêm tiến độ SRS.",
            );
          }
        })
        .catch(() => {
          saveFailed.current = true;
          setAnnouncement(
            "Chưa thể đồng bộ kết quả. Bạn vẫn có thể tiếp tục phiên Learn.",
          );
        })
        .finally(() => {
          pendingSaves.current -= 1;
          if (pendingSaves.current === 0) {
            setSaveState(saveFailed.current ? "error" : "saved");
          }
        });
    },
    [progressPersistenceEnabled, setSlug],
  );

  const enqueueCheckpointOperation = useCallback(
    (operation: () => Promise<unknown>, failureMessage: string) => {
      if (pendingCheckpointSaves.current === 0) {
        checkpointFailed.current = false;
      }
      pendingCheckpointSaves.current += 1;
      setCheckpointState("saving");

      const task = checkpointQueue.current.then(operation);
      checkpointQueue.current = task.then(
        () => undefined,
        () => undefined,
      );

      void task
        .catch(() => {
          checkpointFailed.current = true;
          setAnnouncement(failureMessage);
        })
        .finally(() => {
          pendingCheckpointSaves.current -= 1;
          if (pendingCheckpointSaves.current === 0) {
            setCheckpointState(checkpointFailed.current ? "error" : "saved");
          }
        });
    },
    [],
  );

  useEffect(() => {
    if (
      !progressPersistenceEnabled ||
      !started ||
      studyMode === "match" ||
      queue.length === 0
    ) {
      return;
    }

    const checkpointMode = studyMode;
    const checkpointIndex =
      feedback && (feedback.correct || correctionAccepted)
        ? currentIndex + 1
        : currentIndex;
    const timeoutId = window.setTimeout(() => {
      if (checkpointIndex >= queue.length) {
        enqueueCheckpointOperation(
          () => clearVocabularyLearnSession(setSlug),
          "Chưa thể đóng checkpoint đã hoàn thành.",
        );
        return;
      }

      enqueueCheckpointOperation(
        () =>
          saveVocabularyLearnSession(setSlug, {
            studyMode: checkpointMode,
            targetCount,
            queueTermIds: queue.map((term) => term.id),
            currentIndex: checkpointIndex,
            correctCount,
            wrongCount,
            wrongTermIds: [...wrongTermIds],
          }),
        "Chưa thể lưu checkpoint Learn. Tiến độ trả lời vẫn được giữ.",
      );
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [
    correctCount,
    correctionAccepted,
    currentIndex,
    enqueueCheckpointOperation,
    feedback,
    progressPersistenceEnabled,
    queue,
    setSlug,
    started,
    studyMode,
    targetCount,
    wrongCount,
    wrongTermIds,
  ]);

  const resumeLearnCheckpoint = useCallback(() => {
    if (!resumeCheckpoint) return;
    const termsById = new Map(orderedTerms.map((term) => [term.id, term]));
    const restoredQueue = resumeCheckpoint.queueTermIds
      .map((termId) => termsById.get(termId))
      .filter((term): term is VocabularyTerm => Boolean(term));
    if (
      restoredQueue.length !== resumeCheckpoint.queueTermIds.length ||
      resumeCheckpoint.currentIndex >= restoredQueue.length
    ) {
      setResumeCheckpoint(null);
      setAnnouncement("Checkpoint cũ không còn hợp lệ và đã được bỏ qua.");
      return;
    }

    setStudyMode(resumeCheckpoint.studyMode);
    setTargetCount(resumeCheckpoint.targetCount);
    setQueue(restoredQueue);
    setCurrentIndex(resumeCheckpoint.currentIndex);
    setCorrectCount(resumeCheckpoint.correctCount);
    setWrongCount(resumeCheckpoint.wrongCount);
    setWrongTermIds(new Set(resumeCheckpoint.wrongTermIds));
    setFeedback(null);
    setWrittenAnswer("");
    setCorrection("");
    setCorrectionAccepted(false);
    setResumeCheckpoint(null);
    setStarted(true);
    setAnnouncement(
      `Đã tiếp tục từ câu ${resumeCheckpoint.currentIndex + 1} trên ${restoredQueue.length}.`,
    );
  }, [orderedTerms, resumeCheckpoint]);

  const discardLearnCheckpoint = useCallback(() => {
    setResumeCheckpoint(null);
    if (!progressPersistenceEnabled) return;
    enqueueCheckpointOperation(
      () => clearVocabularyLearnSession(setSlug),
      "Chưa thể xóa checkpoint Learn cũ.",
    );
  }, [enqueueCheckpointOperation, progressPersistenceEnabled, setSlug]);

  const startSession = useCallback(() => {
    const prioritizedTerms = shuffle(orderedTerms).sort(
      (first, second) =>
        progressRank[progressByTerm.get(first.id) ?? "NEW"] -
        progressRank[progressByTerm.get(second.id) ?? "NEW"],
    );
    setQueue(prioritizedTerms.slice(0, targetCount));
    setCurrentIndex(0);
    setFeedback(null);
    setWrittenAnswer("");
    setCorrection("");
    setCorrectionAccepted(false);
    setCorrectCount(0);
    setWrongCount(0);
    setWrongTermIds(new Set());
    setResumeCheckpoint(null);
    setStarted(true);
    setAnnouncement(
      `Đã bắt đầu chế độ ${studyModeMeta[studyMode].label} với ${targetCount} từ.`,
    );
  }, [orderedTerms, progressByTerm, studyMode, targetCount]);

  const finishAnswer = useCallback(
    (correct: boolean, answer: string) => {
      if (!currentTerm || feedback) return;
      const statusAfter = nextProgressStatus(currentProgressStatus, correct);
      setFeedback({ correct, answer, statusAfter, mode });
      setCorrection("");
      setCorrectionAccepted(false);

      if (correct) {
        setCorrectCount((count) => count + 1);
        enqueueProgressSave(currentTerm.id, true, statusAfter);
        setAnnouncement(
          `Chính xác. ${currentTerm.term}: ${currentTerm.meaningVi}`,
        );
        return;
      }

      setWrongCount((count) => count + 1);
      setWrongTermIds((current) => new Set(current).add(currentTerm.id));
      setQueue((currentQueue) => {
        const nextQueue = [...currentQueue];
        const repeatAt = Math.min(currentIndex + 3, nextQueue.length);
        nextQueue.splice(repeatAt, 0, currentTerm);
        return nextQueue;
      });
      enqueueProgressSave(currentTerm.id, false, statusAfter);
      setAnnouncement(
        `Chưa chính xác. Hãy gõ lại từ ${currentTerm.term} để tiếp tục.`,
      );
    },
    [
      currentIndex,
      currentProgressStatus,
      currentTerm,
      enqueueProgressSave,
      feedback,
      mode,
    ],
  );

  const submitWrittenAnswer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentTerm || !writtenAnswer.trim()) return;
    finishAnswer(
      normalizeAnswer(writtenAnswer) === normalizeAnswer(currentTerm.term),
      writtenAnswer,
    );
  };

  const submitCorrection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentTerm) return;
    const accepted =
      normalizeAnswer(correction) === normalizeAnswer(currentTerm.term);
    setCorrectionAccepted(accepted);
    setAnnouncement(
      accepted
        ? "Đã gõ đúng đáp án. Bạn có thể tiếp tục."
        : "Chưa khớp với đáp án. Hãy thử lại.",
    );
  };

  const nextQuestion = () => {
    if (!feedback || (!feedback.correct && !correctionAccepted)) return;
    setCurrentIndex((index) => index + 1);
    setFeedback(null);
    setWrittenAnswer("");
    setCorrection("");
    setCorrectionAccepted(false);
  };

  const speakCurrentTerm = useCallback(() => {
    if (!currentTerm) return;
    if (currentTerm.audioUrl) {
      void playVocabularyAudio(currentTerm.audioUrl).catch(() =>
        setAnnouncement("Chưa thể phát audio của từ này."),
      );
      return;
    }
    if (!("speechSynthesis" in window)) {
      setAnnouncement("Trình duyệt chưa hỗ trợ phát âm tự động.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentTerm.term);
    utterance.lang = "en-US";
    const preferences = getAudioPreferences();
    utterance.rate = preferences.playbackRate;
    utterance.volume = preferences.volume;
    window.speechSynthesis.speak(utterance);
  }, [currentTerm]);

  useEffect(() => {
    if (
      !started ||
      !currentTerm ||
      (mode !== "listen" && mode !== "dictation") ||
      !getAudioPreferences().autoplay
    ) {
      return;
    }
    speakCurrentTerm();
  }, [currentIndex, currentTerm, mode, speakCurrentTerm, started]);

  if (!orderedTerms.length) {
    return (
      <div className="glass-card p-8 text-center text-sm text-white/60">
        Bộ từ này chưa có nội dung để tạo phiên Learn.
      </div>
    );
  }

  if (!started) {
    return (
      <section
        className="glass-card mx-auto max-w-3xl p-6 sm:p-8"
        aria-labelledby="learn-setup-title"
      >
        <div className="flex items-start gap-4">
          <span className="grid size-12 flex-none place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Sparkles className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--accent)]">
              Trung tâm luyện tập
            </p>
            <h1
              id="learn-setup-title"
              className="mt-2 text-3xl font-black tracking-[-0.018em] sm:text-4xl"
            >
              Chọn cách bạn muốn luyện từ
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/60">
              Học tổng hợp hoặc tập trung riêng vào một kỹ năng như ghép thẻ,
              nghe rồi viết và chủ động nhớ từ.
            </p>
          </div>
        </div>

        {resumeCheckpoint ? (
          <section
            className="mt-7 rounded-2xl border border-[color-mix(in_srgb,var(--accent)_32%,transparent)] bg-[var(--accent-soft)] p-4 sm:p-5"
            aria-labelledby="resume-learn-title"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid size-10 flex-none place-items-center rounded-xl bg-white/10 text-[var(--accent)]">
                  <Clock3 className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-[var(--accent)]">
                    Checkpoint tự động
                  </p>
                  <h2
                    id="resume-learn-title"
                    className="mt-1 text-lg font-bold"
                  >
                    Tiếp tục phiên{" "}
                    {studyModeMeta[resumeCheckpoint.studyMode].label}
                  </h2>
                  <p className="mt-1.5 text-xs leading-5 text-white/52">
                    Câu {resumeCheckpoint.currentIndex + 1}/
                    {resumeCheckpoint.queueTermIds.length} ·{" "}
                    {resumeCheckpoint.correctCount} đúng ·{" "}
                    {resumeCheckpoint.wrongCount} sai
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  className="min-h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-ink)]"
                  onClick={resumeLearnCheckpoint}
                >
                  Tiếp tục phiên trước
                </button>
                <button
                  type="button"
                  className="min-h-11 rounded-full bg-white/8 px-5 text-sm font-semibold text-white/66 hover:bg-white/13 hover:text-white"
                  onClick={discardLearnCheckpoint}
                >
                  Bỏ phiên cũ
                </button>
              </div>
            </div>
          </section>
        ) : null}

        <fieldset className="mt-8">
          <legend className="text-sm font-black text-white/78">
            Chọn chế độ học
          </legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(
              Object.entries(studyModeMeta) as [
                StudyMode,
                (typeof studyModeMeta)[StudyMode],
              ][]
            ).map(([value, item]) => {
              const StudyModeIcon = item.icon;
              const selected = studyMode === value;
              return (
                <button
                  key={value}
                  type="button"
                  className={`group relative min-h-32 overflow-hidden rounded-2xl border p-4 text-left transition motion-reduce:transition-none ${
                    selected
                      ? "border-[var(--accent)] bg-white/12 ring-2 ring-[var(--accent-glow)]"
                      : "border-white/10 bg-white/6 hover:border-white/20 hover:bg-white/10"
                  }`}
                  aria-pressed={selected}
                  onClick={() => setStudyMode(value)}
                >
                  <span
                    className={`absolute inset-0 bg-gradient-to-br ${item.accent} opacity-70`}
                    aria-hidden="true"
                  />
                  <span className="relative flex items-start gap-3">
                    <span className="grid size-10 flex-none place-items-center rounded-xl bg-white/10 text-[var(--accent)]">
                      <StudyModeIcon className="size-5" aria-hidden="true" />
                    </span>
                    <span>
                      <strong className="block text-sm font-black text-white">
                        {item.label}
                      </strong>
                      <span className="mt-1.5 block text-xs font-semibold leading-5 text-white/52">
                        {item.description}
                      </span>
                    </span>
                  </span>
                  {selected ? (
                    <CheckCircle2
                      className="absolute right-3 top-3 size-4 text-[var(--accent)]"
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </fieldset>

        {studyMode === "mixed" ? (
          <div className="mt-5 rounded-2xl border border-white/9 bg-black/12 p-4">
            <p className="text-xs font-semibold text-white/56">
              Độ khó tự thay đổi theo mức ghi nhớ
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["NEW", "LEARNING", "FAMILIAR", "MASTERED"] as const).map(
                (status) => (
                  <div
                    key={status}
                    className="rounded-xl bg-white/5 px-3 py-2.5"
                  >
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-[0.68rem] font-semibold ${progressMeta[status].tone}`}
                    >
                      {progressMeta[status].label}
                    </span>
                    <p className="mt-2 text-[0.7rem] leading-5 text-white/42">
                      {progressMeta[status].description}
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
        ) : null}

        <fieldset className="mt-7">
          <legend className="text-sm font-black text-white/78">
            Mục tiêu phiên học
          </legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {targetOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={`min-h-14 rounded-2xl border px-4 text-sm font-black transition ${
                  targetCount === option
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-white/10 bg-white/6 text-white/65 hover:bg-white/10 hover:text-white"
                }`}
                aria-pressed={targetCount === option}
                onClick={() => setTargetCount(option)}
              >
                {option === orderedTerms.length
                  ? `Toàn bộ ${option} từ`
                  : `${option} từ`}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          className="mt-8 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-6 text-sm font-black text-[var(--accent-ink)] transition hover:bg-[var(--accent-hover)] sm:w-auto"
          onClick={startSession}
        >
          <Sparkles className="size-5" aria-hidden="true" />
          Bắt đầu {studyModeMeta[studyMode].label}
        </button>
      </section>
    );
  }

  if (studyMode === "match") {
    return (
      <MatchingSession
        terms={queue}
        setSlug={setSlug}
        saveState={saveState}
        progressPersistenceEnabled={progressPersistenceEnabled}
        initialMatchLeaderboard={initialMatchLeaderboard}
        onMatch={(termId) => {
          const currentStatus = progressByTerm.get(termId) ?? "NEW";
          enqueueProgressSave(
            termId,
            true,
            nextProgressStatus(currentStatus, true),
          );
        }}
        onExit={() => setStarted(false)}
      />
    );
  }

  if (completed) {
    const accuracy = Math.round(
      (correctCount / Math.max(correctCount + wrongCount, 1)) * 100,
    );
    return (
      <section
        className="glass-card mx-auto max-w-3xl p-7 text-center sm:p-10"
        aria-labelledby="learn-result-title"
      >
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
          <CheckCircle2 className="size-8" aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--accent)]">
          Hoàn thành {studyModeMeta[studyMode].label}
        </p>
        <h1
          id="learn-result-title"
          className="mt-2 text-3xl font-black tracking-[-0.018em] sm:text-5xl"
        >
          Độ chính xác {accuracy}%
        </h1>
        <div className="mx-auto mt-7 grid max-w-lg grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white/7 p-4">
            <strong className="block text-2xl">{correctCount}</strong>
            <span className="text-xs text-white/50">Lượt đúng</span>
          </div>
          <div className="rounded-2xl bg-white/7 p-4">
            <strong className="block text-2xl">{wrongCount}</strong>
            <span className="text-xs text-white/50">Lượt sai</span>
          </div>
          <div className="rounded-2xl bg-white/7 p-4">
            <strong className="block text-2xl">{wrongTermIds.size}</strong>
            <span className="text-xs text-white/50">Từ cần ôn</span>
          </div>
        </div>
        <button
          type="button"
          className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 text-sm font-black text-[var(--accent-ink)]"
          onClick={() => setStarted(false)}
        >
          <RefreshCcw className="size-4" aria-hidden="true" />
          Chọn chế độ khác
        </button>
      </section>
    );
  }

  if (!currentTerm) return null;
  const progress = ((currentIndex + 1) / queue.length) * 100;

  return (
    <section
      className="mx-auto max-w-4xl"
      aria-labelledby="learn-session-title"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--accent)]">
            {studyModeMeta[studyMode].label}
          </p>
          <h1
            id="learn-session-title"
            className="mt-2 text-2xl font-black tracking-[-0.018em] sm:text-3xl"
          >
            Câu {currentIndex + 1} / {queue.length}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <span
            className={`rounded-full px-3 py-2 ${progressMeta[currentProgressStatus].tone}`}
            title={progressMeta[currentProgressStatus].description}
          >
            {progressMeta[currentProgressStatus].label}
          </span>
          <span className="rounded-full bg-emerald-300/12 px-3 py-2 text-emerald-100">
            Đúng {correctCount}
          </span>
          <span className="rounded-full bg-amber-300/12 px-3 py-2 text-amber-100">
            Sai {wrongCount}
          </span>
          <span
            className={`rounded-full px-3 py-2 ${combinedSaveState === "error" ? "bg-red-300/12 text-red-100" : "bg-white/7 text-white/55"}`}
            role="status"
            aria-live="polite"
          >
            {progressPersistenceEnabled
              ? combinedSaveState === "saving"
                ? "Đang lưu…"
                : combinedSaveState === "error"
                  ? "Chưa đồng bộ"
                  : combinedSaveState === "saved"
                    ? "Đã đồng bộ"
                    : "Tự động lưu"
              : "Chỉ lưu trong phiên"}
          </span>
        </div>
      </div>

      <div
        className="mt-5 h-2 overflow-hidden rounded-full bg-white/8"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      <article className="glass-card mt-6 overflow-hidden p-6 sm:p-9">
        <div className="flex items-center gap-3 text-[var(--accent)]">
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--accent-soft)]">
            <ModeIcon className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em]">
              {modeMeta[mode].label}
            </p>
            <p className="mt-0.5 text-xs text-white/48">
              {modeMeta[mode].instruction}
            </p>
          </div>
        </div>

        <div className="mt-8 min-h-32">
          {mode === "dictation" ? (
            <div className="text-center">
              <button
                type="button"
                className="mx-auto grid size-20 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)] shadow-xl shadow-[var(--accent-glow)] transition hover:scale-105 motion-reduce:transform-none"
                onClick={speakCurrentTerm}
                aria-label="Nghe từ để viết lại"
              >
                <Volume2 className="size-8" aria-hidden="true" />
              </button>
              <p className="mt-4 text-sm font-bold text-white/50">
                Nhấn để nghe, sau đó viết lại từ tiếng Anh
              </p>
            </div>
          ) : mode === "write" ? (
            <div>
              <p className="text-sm font-bold text-white/45">
                Nghĩa tiếng Việt
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.018em] sm:text-5xl">
                {currentTerm.meaningVi}
              </h2>
              {currentTerm.partOfSpeech ? (
                <p className="mt-3 text-xs font-bold uppercase tracking-wider text-white/35">
                  {currentTerm.partOfSpeech}
                </p>
              ) : null}
            </div>
          ) : mode === "listen" ? (
            <div className="text-center">
              <button
                type="button"
                className="mx-auto grid size-20 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)] shadow-xl shadow-[var(--accent-glow)] transition hover:scale-105 motion-reduce:transform-none"
                onClick={speakCurrentTerm}
                aria-label="Nghe từ cần trả lời"
              >
                <Volume2 className="size-8" aria-hidden="true" />
              </button>
              <p className="mt-4 text-sm font-bold text-white/50">
                Nhấn để nghe lại
              </p>
            </div>
          ) : mode === "true-false" ? (
            <div>
              <h2 className="text-4xl font-black tracking-[-0.02em] text-[var(--accent)] sm:text-5xl">
                {currentTerm.term}
              </h2>
              <p className="mt-5 text-xl font-bold leading-8 text-white/78">
                {statementTerm?.meaningVi}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold text-white/45">Từ tiếng Anh</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.02em] text-[var(--accent)] sm:text-6xl">
                {currentTerm.term}
              </h2>
              {currentTerm.ipa ? (
                <p className="mt-3 text-base font-semibold text-white/42">
                  {currentTerm.ipa}
                </p>
              ) : null}
            </div>
          )}
        </div>

        {!feedback ? (
          mode === "write" || mode === "dictation" ? (
            <form className="mt-8" onSubmit={submitWrittenAnswer}>
              <label
                htmlFor="learn-answer"
                className="text-sm font-black text-white/72"
              >
                {mode === "dictation" ? "Từ bạn vừa nghe" : "Nhập đáp án"}
              </label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <input
                  id="learn-answer"
                  value={writtenAnswer}
                  onChange={(event) => setWrittenAnswer(event.target.value)}
                  autoComplete="off"
                  autoFocus
                  className="min-h-13 flex-1 rounded-2xl border border-white/12 bg-black/20 px-4 text-base font-bold text-white focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)]"
                />
                <button
                  type="submit"
                  disabled={!writtenAnswer.trim()}
                  className="min-h-13 rounded-2xl bg-[var(--accent)] px-6 text-sm font-black text-[var(--accent-ink)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Kiểm tra
                </button>
              </div>
            </form>
          ) : mode === "true-false" ? (
            <div className="mt-8 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="min-h-14 rounded-2xl bg-emerald-300/14 text-sm font-black text-emerald-100 hover:bg-emerald-300/22"
                onClick={() => finishAnswer(statementIsTrue, "Đúng")}
              >
                <Check className="mr-2 inline size-5" aria-hidden="true" />
                Đúng
              </button>
              <button
                type="button"
                className="min-h-14 rounded-2xl bg-red-300/12 text-sm font-black text-red-100 hover:bg-red-300/20"
                onClick={() => finishAnswer(!statementIsTrue, "Sai")}
              >
                <X className="mr-2 inline size-5" aria-hidden="true" />
                Sai
              </button>
            </div>
          ) : (
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {options.map((option, index) => (
                <button
                  key={option}
                  type="button"
                  className="min-h-16 rounded-2xl border border-white/10 bg-white/6 px-5 text-left text-sm font-bold leading-6 text-white/76 transition hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:bg-white/11 hover:text-white"
                  onClick={() =>
                    finishAnswer(option === currentTerm.meaningVi, option)
                  }
                >
                  <span className="mr-3 text-xs text-white/35">
                    {index + 1}
                  </span>
                  {option}
                </button>
              ))}
            </div>
          )
        ) : (
          <div
            className={`mt-8 rounded-2xl border p-5 ${feedback.correct ? "border-emerald-300/20 bg-emerald-300/10" : "border-amber-300/20 bg-amber-300/10"}`}
            role={feedback.correct ? "status" : "alert"}
          >
            <div className="flex items-start gap-3">
              {feedback.correct ? (
                <CheckCircle2
                  className="mt-0.5 size-6 flex-none text-emerald-200"
                  aria-hidden="true"
                />
              ) : (
                <X
                  className="mt-0.5 size-6 flex-none text-amber-100"
                  aria-hidden="true"
                />
              )}
              <div>
                <h3 className="font-black">
                  {feedback.correct ? "Chính xác!" : "Chưa chính xác"}
                </h3>
                <p className="mt-1 text-sm leading-6 text-white/70">
                  <strong>{currentTerm.term}</strong> — {currentTerm.meaningVi}
                </p>
                <p className="mt-2 flex items-center gap-2 text-xs text-white/48">
                  Trạng thái mới
                  <span
                    className={`rounded-full px-2 py-1 font-semibold ${progressMeta[feedback.statusAfter].tone}`}
                  >
                    {progressMeta[feedback.statusAfter].label}
                  </span>
                </p>
                {currentTerm.exampleEn ? (
                  <p className="mt-2 text-xs leading-5 text-white/48">
                    {currentTerm.exampleEn}
                  </p>
                ) : null}
              </div>
            </div>

            {!feedback.correct && !correctionAccepted ? (
              <form className="mt-5" onSubmit={submitCorrection}>
                <label
                  htmlFor="learn-correction"
                  className="text-xs font-black uppercase tracking-wider text-white/58"
                >
                  Gõ lại “{currentTerm.term}” để ghi nhớ
                </label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    id="learn-correction"
                    value={correction}
                    onChange={(event) => setCorrection(event.target.value)}
                    autoComplete="off"
                    autoFocus
                    aria-invalid={
                      Boolean(correction) &&
                      normalizeAnswer(correction) !==
                        normalizeAnswer(currentTerm.term)
                    }
                    className="min-h-12 flex-1 rounded-xl border border-white/12 bg-black/20 px-4 font-bold text-white focus:border-[var(--accent)] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="min-h-12 rounded-xl bg-white/12 px-5 text-sm font-black text-white hover:bg-white/18"
                  >
                    Kiểm tra lại
                  </button>
                </div>
              </form>
            ) : null}

            {correctionAccepted ? (
              <p className="mt-4 text-sm font-bold text-emerald-100">
                Đã gõ đúng. Từ này sẽ xuất hiện lại trong vài câu tới.
              </p>
            ) : null}
            {feedback.correct || correctionAccepted ? (
              <button
                type="button"
                className="mt-5 min-h-12 rounded-xl bg-[var(--accent)] px-6 text-sm font-black text-[var(--accent-ink)] hover:bg-[var(--accent-hover)]"
                onClick={nextQuestion}
                autoFocus={feedback.correct}
              >
                Câu tiếp theo
              </button>
            ) : null}
          </div>
        )}
      </article>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </section>
  );
}
