"use client";

import { CheckCircle2, Medal, RefreshCcw, Timer, Trophy } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  VocabularyMatchLeaderboard,
  VocabularyTerm,
} from "@/lib/vocabulary";
import { saveVocabularyMatchResult } from "@/lib/vocabulary-progress-client";
import { type SaveState, shuffle } from "./learn-player-model";

const MATCH_PAIR_COUNT = 6;

type MatchCard = {
  id: string;
  termId: string;
  label: string;
  kind: "term" | "meaning";
};

type MatchingSessionProps = {
  terms: VocabularyTerm[];
  setSlug: string;
  saveState: SaveState;
  progressPersistenceEnabled: boolean;
  initialMatchLeaderboard: VocabularyMatchLeaderboard | null;
  onMatch: (termId: string) => void;
  onExit: () => void;
};

export function MatchingSession({
  terms,
  setSlug,
  saveState,
  progressPersistenceEnabled,
  initialMatchLeaderboard,
  onMatch,
  onExit,
}: MatchingSessionProps) {
  const [round, setRound] = useState(1);
  const [roundTermIds, setRoundTermIds] = useState(() =>
    createRoundTermIds(terms),
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
  const cards = useMemo(
    () => createMatchCards(activeTerms, round),
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

  function selectCard(card: MatchCard) {
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
  }

  function startNextRound() {
    const nextTermIds = chooseNextRoundTerms(terms, roundTermIds, usedTermIds);
    const hasUnseenTerms = terms.some((term) => !usedTermIds.has(term.id));

    setRound((current) => current + 1);
    setRoundTermIds(nextTermIds);
    setUsedTermIds(
      hasUnseenTerms
        ? new Set([...usedTermIds, ...nextTermIds])
        : new Set(nextTermIds),
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
  }

  if (completed) {
    return (
      <MatchResult
        pairCount={activeTerms.length}
        durationMs={completedDurationMs ?? elapsedMs}
        moves={moves}
        mistakes={mistakes}
        resultSaveState={resultSaveState}
        progressPersistenceEnabled={progressPersistenceEnabled}
        leaderboard={leaderboard}
        savedResultId={savedResultId}
        onNextRound={startNextRound}
        onExit={onExit}
      />
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
        <MatchSessionStats
          elapsedMs={elapsedMs}
          moves={moves}
          saveState={saveState}
          progressPersistenceEnabled={progressPersistenceEnabled}
        />
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

function createRoundTermIds(terms: VocabularyTerm[]) {
  return shuffle(terms)
    .slice(0, Math.min(MATCH_PAIR_COUNT, terms.length))
    .map((term) => term.id);
}

function createMatchCards(terms: VocabularyTerm[], round: number): MatchCard[] {
  return shuffle(
    terms.flatMap((term) => [
      {
        id: `${round}-${term.id}-term`,
        termId: term.id,
        label: term.term,
        kind: "term" as const,
      },
      {
        id: `${round}-${term.id}-meaning`,
        termId: term.id,
        label: term.meaningVi,
        kind: "meaning" as const,
      },
    ]),
  );
}

function chooseNextRoundTerms(
  terms: VocabularyTerm[],
  currentTermIds: string[],
  usedTermIds: Set<string>,
) {
  const pairCount = Math.min(MATCH_PAIR_COUNT, terms.length);
  const currentRoundIds = new Set(currentTermIds);
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

  return nextTerms.map((term) => term.id);
}

function formatMatchDuration(durationMs: number) {
  const totalTenths = Math.max(0, Math.floor(durationMs / 100));
  const minutes = Math.floor(totalTenths / 600);
  const seconds = Math.floor((totalTenths % 600) / 10);
  const tenths = totalTenths % 10;

  return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

type MatchSessionStatsProps = {
  elapsedMs: number;
  moves: number;
  saveState: SaveState;
  progressPersistenceEnabled: boolean;
};

function MatchSessionStats({
  elapsedMs,
  moves,
  saveState,
  progressPersistenceEnabled,
}: MatchSessionStatsProps) {
  return (
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
  );
}

type MatchResultProps = {
  pairCount: number;
  durationMs: number;
  moves: number;
  mistakes: number;
  resultSaveState: SaveState;
  progressPersistenceEnabled: boolean;
  leaderboard: VocabularyMatchLeaderboard | null;
  savedResultId: string | null;
  onNextRound: () => void;
  onExit: () => void;
};

function MatchResult({
  pairCount,
  durationMs,
  moves,
  mistakes,
  resultSaveState,
  progressPersistenceEnabled,
  leaderboard,
  savedResultId,
  onNextRound,
  onExit,
}: MatchResultProps) {
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
        Đã ghép đúng {pairCount} cặp
      </h1>
      <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white/7 p-4">
          <Timer
            className="mx-auto size-4 text-[var(--accent)]"
            aria-hidden="true"
          />
          <strong className="mt-2 block text-xl font-semibold">
            {formatMatchDuration(durationMs)}
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
          onClick={onNextRound}
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

type PersonalMatchLeaderboardProps = {
  leaderboard: VocabularyMatchLeaderboard | null;
  persistenceEnabled: boolean;
  highlightedResultId: string | null;
};

function PersonalMatchLeaderboard({
  leaderboard,
  persistenceEnabled,
  highlightedResultId,
}: PersonalMatchLeaderboardProps) {
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
