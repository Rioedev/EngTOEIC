"use client";

import { Check, CheckCircle2, RefreshCcw, Volume2, X } from "lucide-react";
import type { FormEvent } from "react";
import type {
  VocabularyProgressStatus,
  VocabularyTerm,
} from "@/lib/vocabulary";
import {
  normalizeAnswer,
  progressMeta,
  questionModeMeta,
  studyModeMeta,
  type LearnFeedback,
  type QuestionMode,
  type SaveState,
  type StudyMode,
} from "./learn-player-model";

type LearnSessionViewProps = {
  studyMode: StudyMode;
  currentIndex: number;
  queueLength: number;
  currentTerm: VocabularyTerm;
  currentProgressStatus: VocabularyProgressStatus;
  correctCount: number;
  wrongCount: number;
  combinedSaveState: SaveState;
  progressPersistenceEnabled: boolean;
  mode: QuestionMode;
  statementTerm: VocabularyTerm | null;
  statementIsTrue: boolean;
  options: string[];
  feedback: LearnFeedback | null;
  writtenAnswer: string;
  correction: string;
  correctionAccepted: boolean;
  announcement: string;
  onSpeak: () => void;
  onWrittenAnswerChange: (value: string) => void;
  onSubmitWrittenAnswer: (event: FormEvent<HTMLFormElement>) => void;
  onAnswer: (correct: boolean, answer: string) => void;
  onCorrectionChange: (value: string) => void;
  onSubmitCorrection: (event: FormEvent<HTMLFormElement>) => void;
  onNext: () => void;
};

export function LearnSessionView({
  studyMode,
  currentIndex,
  queueLength,
  currentTerm,
  currentProgressStatus,
  correctCount,
  wrongCount,
  combinedSaveState,
  progressPersistenceEnabled,
  mode,
  statementTerm,
  statementIsTrue,
  options,
  feedback,
  writtenAnswer,
  correction,
  correctionAccepted,
  announcement,
  onSpeak,
  onWrittenAnswerChange,
  onSubmitWrittenAnswer,
  onAnswer,
  onCorrectionChange,
  onSubmitCorrection,
  onNext,
}: LearnSessionViewProps) {
  const progress = ((currentIndex + 1) / queueLength) * 100;
  const ModeIcon = questionModeMeta[mode].icon;

  return (
    <section
      className="mx-auto max-w-4xl"
      aria-labelledby="learn-session-title"
    >
      <SessionHeader
        studyMode={studyMode}
        currentIndex={currentIndex}
        queueLength={queueLength}
        currentProgressStatus={currentProgressStatus}
        correctCount={correctCount}
        wrongCount={wrongCount}
        saveState={combinedSaveState}
        progressPersistenceEnabled={progressPersistenceEnabled}
      />

      <div
        className="mt-5 h-2 overflow-hidden rounded-full bg-white/8"
        role="progressbar"
        aria-label="Tiến độ phiên học"
        aria-valuemin={0}
        aria-valuemax={queueLength}
        aria-valuenow={Math.min(currentIndex + 1, queueLength)}
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
              {questionModeMeta[mode].label}
            </p>
            <p className="mt-0.5 text-xs text-white/48">
              {questionModeMeta[mode].instruction}
            </p>
          </div>
        </div>

        <QuestionPrompt
          mode={mode}
          currentTerm={currentTerm}
          statementTerm={statementTerm}
          onSpeak={onSpeak}
        />

        {!feedback ? (
          <QuestionAnswerControls
            mode={mode}
            currentTerm={currentTerm}
            statementIsTrue={statementIsTrue}
            options={options}
            writtenAnswer={writtenAnswer}
            onWrittenAnswerChange={onWrittenAnswerChange}
            onSubmitWrittenAnswer={onSubmitWrittenAnswer}
            onAnswer={onAnswer}
          />
        ) : (
          <AnswerFeedback
            feedback={feedback}
            currentTerm={currentTerm}
            correction={correction}
            correctionAccepted={correctionAccepted}
            onCorrectionChange={onCorrectionChange}
            onSubmitCorrection={onSubmitCorrection}
            onNext={onNext}
          />
        )}
      </article>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </section>
  );
}

type SessionHeaderProps = {
  studyMode: StudyMode;
  currentIndex: number;
  queueLength: number;
  currentProgressStatus: VocabularyProgressStatus;
  correctCount: number;
  wrongCount: number;
  saveState: SaveState;
  progressPersistenceEnabled: boolean;
};

function SessionHeader({
  studyMode,
  currentIndex,
  queueLength,
  currentProgressStatus,
  correctCount,
  wrongCount,
  saveState,
  progressPersistenceEnabled,
}: SessionHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--accent)]">
          {studyModeMeta[studyMode].label}
        </p>
        <h1
          id="learn-session-title"
          className="mt-2 text-2xl font-black tracking-[-0.018em] sm:text-3xl"
        >
          Câu {currentIndex + 1} / {queueLength}
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
          className={`rounded-full px-3 py-2 ${
            saveState === "error"
              ? "bg-red-300/12 text-red-100"
              : "bg-white/7 text-white/55"
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
    </div>
  );
}

type QuestionPromptProps = {
  mode: QuestionMode;
  currentTerm: VocabularyTerm;
  statementTerm: VocabularyTerm | null;
  onSpeak: () => void;
};

function QuestionPrompt({
  mode,
  currentTerm,
  statementTerm,
  onSpeak,
}: QuestionPromptProps) {
  return (
    <div className="mt-8 min-h-32">
      {mode === "dictation" ? (
        <AudioPrompt
          label="Nghe từ để viết lại"
          hint="Nhấn để nghe, sau đó viết lại từ tiếng Anh"
          onSpeak={onSpeak}
        />
      ) : mode === "write" ? (
        <div>
          <p className="text-sm font-bold text-white/45">Nghĩa tiếng Việt</p>
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
        <AudioPrompt
          label="Nghe từ cần trả lời"
          hint="Nhấn để nghe lại"
          onSpeak={onSpeak}
        />
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
  );
}

function AudioPrompt({
  label,
  hint,
  onSpeak,
}: {
  label: string;
  hint: string;
  onSpeak: () => void;
}) {
  return (
    <div className="text-center">
      <button
        type="button"
        className="mx-auto grid size-20 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)] shadow-xl shadow-[var(--accent-glow)] transition hover:scale-105 motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        onClick={onSpeak}
        aria-label={label}
      >
        <Volume2 className="size-8" aria-hidden="true" />
      </button>
      <p className="mt-4 text-sm font-bold text-white/50">{hint}</p>
    </div>
  );
}

type QuestionAnswerControlsProps = {
  mode: QuestionMode;
  currentTerm: VocabularyTerm;
  statementIsTrue: boolean;
  options: string[];
  writtenAnswer: string;
  onWrittenAnswerChange: (value: string) => void;
  onSubmitWrittenAnswer: (event: FormEvent<HTMLFormElement>) => void;
  onAnswer: (correct: boolean, answer: string) => void;
};

function QuestionAnswerControls({
  mode,
  currentTerm,
  statementIsTrue,
  options,
  writtenAnswer,
  onWrittenAnswerChange,
  onSubmitWrittenAnswer,
  onAnswer,
}: QuestionAnswerControlsProps) {
  if (mode === "write" || mode === "dictation") {
    return (
      <form className="mt-8" onSubmit={onSubmitWrittenAnswer}>
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
            onChange={(event) => onWrittenAnswerChange(event.target.value)}
            autoComplete="off"
            autoFocus
            className="min-h-13 flex-1 rounded-2xl border border-white/12 bg-black/20 px-4 text-base font-bold text-white focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)]"
          />
          <button
            type="submit"
            disabled={!writtenAnswer.trim()}
            className="min-h-13 rounded-2xl bg-[var(--accent)] px-6 text-sm font-black text-[var(--accent-ink)] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Kiểm tra
          </button>
        </div>
      </form>
    );
  }

  if (mode === "true-false") {
    return (
      <div className="mt-8 grid grid-cols-2 gap-3">
        <button
          type="button"
          className="min-h-14 rounded-2xl bg-emerald-300/14 text-sm font-black text-emerald-100 hover:bg-emerald-300/22 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
          onClick={() => onAnswer(statementIsTrue, "Đúng")}
        >
          <Check className="mr-2 inline size-5" aria-hidden="true" />
          Đúng
        </button>
        <button
          type="button"
          className="min-h-14 rounded-2xl bg-red-300/12 text-sm font-black text-red-100 hover:bg-red-300/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
          onClick={() => onAnswer(!statementIsTrue, "Sai")}
        >
          <X className="mr-2 inline size-5" aria-hidden="true" />
          Sai
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2">
      {options.map((option, index) => (
        <button
          key={option}
          type="button"
          className="min-h-16 rounded-2xl border border-white/10 bg-white/6 px-5 text-left text-sm font-bold leading-6 text-white/76 transition hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:bg-white/11 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          onClick={() => onAnswer(option === currentTerm.meaningVi, option)}
        >
          <span className="mr-3 text-xs text-white/35">{index + 1}</span>
          {option}
        </button>
      ))}
    </div>
  );
}

type AnswerFeedbackProps = {
  feedback: LearnFeedback;
  currentTerm: VocabularyTerm;
  correction: string;
  correctionAccepted: boolean;
  onCorrectionChange: (value: string) => void;
  onSubmitCorrection: (event: FormEvent<HTMLFormElement>) => void;
  onNext: () => void;
};

function AnswerFeedback({
  feedback,
  currentTerm,
  correction,
  correctionAccepted,
  onCorrectionChange,
  onSubmitCorrection,
  onNext,
}: AnswerFeedbackProps) {
  return (
    <div
      className={`mt-8 rounded-2xl border p-5 ${
        feedback.correct
          ? "border-emerald-300/20 bg-emerald-300/10"
          : "border-amber-300/20 bg-amber-300/10"
      }`}
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
        <form className="mt-5" onSubmit={onSubmitCorrection}>
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
              onChange={(event) => onCorrectionChange(event.target.value)}
              autoComplete="off"
              autoFocus
              aria-invalid={
                Boolean(correction) &&
                normalizeAnswer(correction) !==
                  normalizeAnswer(currentTerm.term)
              }
              className="min-h-12 flex-1 rounded-xl border border-white/12 bg-black/20 px-4 font-bold text-white focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)]"
            />
            <button
              type="submit"
              className="min-h-12 rounded-xl bg-white/12 px-5 text-sm font-black text-white hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
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
          className="mt-5 min-h-12 rounded-xl bg-[var(--accent)] px-6 text-sm font-black text-[var(--accent-ink)] hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          onClick={onNext}
          autoFocus={feedback.correct}
        >
          Câu tiếp theo
        </button>
      ) : null}
    </div>
  );
}

type LearnResultProps = {
  studyMode: StudyMode;
  correctCount: number;
  wrongCount: number;
  wrongTermCount: number;
  onRestart: () => void;
};

export function LearnResult({
  studyMode,
  correctCount,
  wrongCount,
  wrongTermCount,
  onRestart,
}: LearnResultProps) {
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
        <ResultMetric value={correctCount} label="Lượt đúng" />
        <ResultMetric value={wrongCount} label="Lượt sai" />
        <ResultMetric value={wrongTermCount} label="Từ cần ôn" />
      </div>
      <button
        type="button"
        className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 text-sm font-black text-[var(--accent-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        onClick={onRestart}
      >
        <RefreshCcw className="size-4" aria-hidden="true" />
        Chọn chế độ khác
      </button>
    </section>
  );
}

function ResultMetric({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white/7 p-4">
      <strong className="block text-2xl">{value}</strong>
      <span className="text-xs text-white/50">{label}</span>
    </div>
  );
}
