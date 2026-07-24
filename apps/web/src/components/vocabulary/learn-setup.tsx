"use client";

import { CheckCircle2, Clock3, Sparkles } from "lucide-react";
import type { VocabularyLearnSession } from "@/lib/vocabulary";
import {
  progressMeta,
  studyModeMeta,
  type StudyMode,
} from "./learn-player-model";

type LearnSetupProps = {
  termCount: number;
  resumeCheckpoint: VocabularyLearnSession | null;
  studyMode: StudyMode;
  targetCount: number;
  targetOptions: number[];
  onStudyModeChange: (mode: StudyMode) => void;
  onTargetCountChange: (count: number) => void;
  onResume: () => void;
  onDiscardCheckpoint: () => void;
  onStart: () => void;
};

export function LearnSetup({
  termCount,
  resumeCheckpoint,
  studyMode,
  targetCount,
  targetOptions,
  onStudyModeChange,
  onTargetCountChange,
  onResume,
  onDiscardCheckpoint,
  onStart,
}: LearnSetupProps) {
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
            Học tổng hợp hoặc tập trung riêng vào một kỹ năng như ghép thẻ, nghe
            rồi viết và chủ động nhớ từ.
          </p>
        </div>
      </div>

      {resumeCheckpoint ? (
        <ResumeCheckpoint
          checkpoint={resumeCheckpoint}
          onResume={onResume}
          onDiscard={onDiscardCheckpoint}
        />
      ) : null}

      <StudyModePicker value={studyMode} onChange={onStudyModeChange} />

      {studyMode === "mixed" ? <AdaptiveDifficultyLegend /> : null}

      <fieldset className="mt-7">
        <legend className="text-sm font-black text-white/78">
          Mục tiêu phiên học
        </legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {targetOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={`min-h-14 rounded-2xl border px-4 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                targetCount === option
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-white/10 bg-white/6 text-white/65 hover:bg-white/10 hover:text-white"
              }`}
              aria-pressed={targetCount === option}
              onClick={() => onTargetCountChange(option)}
            >
              {option === termCount ? `Toàn bộ ${option} từ` : `${option} từ`}
            </button>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        className="mt-8 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-6 text-sm font-black text-[var(--accent-ink)] transition hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-auto"
        onClick={onStart}
      >
        <Sparkles className="size-5" aria-hidden="true" />
        Bắt đầu {studyModeMeta[studyMode].label}
      </button>
    </section>
  );
}

type ResumeCheckpointProps = {
  checkpoint: VocabularyLearnSession;
  onResume: () => void;
  onDiscard: () => void;
};

function ResumeCheckpoint({
  checkpoint,
  onResume,
  onDiscard,
}: ResumeCheckpointProps) {
  return (
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
            <h2 id="resume-learn-title" className="mt-1 text-lg font-bold">
              Tiếp tục phiên {studyModeMeta[checkpoint.studyMode].label}
            </h2>
            <p className="mt-1.5 text-xs leading-5 text-white/52">
              Câu {checkpoint.currentIndex + 1}/{checkpoint.queueTermIds.length}{" "}
              · {checkpoint.correctCount} đúng · {checkpoint.wrongCount} sai
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className="min-h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            onClick={onResume}
          >
            Tiếp tục phiên trước
          </button>
          <button
            type="button"
            className="min-h-11 rounded-full bg-white/8 px-5 text-sm font-semibold text-white/66 hover:bg-white/13 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            onClick={onDiscard}
          >
            Bỏ phiên cũ
          </button>
        </div>
      </div>
    </section>
  );
}

type StudyModePickerProps = {
  value: StudyMode;
  onChange: (mode: StudyMode) => void;
};

function StudyModePicker({ value, onChange }: StudyModePickerProps) {
  return (
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
        ).map(([mode, item]) => {
          const StudyModeIcon = item.icon;
          const selected = value === mode;
          return (
            <button
              key={mode}
              type="button"
              className={`group relative min-h-32 overflow-hidden rounded-2xl border p-4 text-left transition motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                selected
                  ? "border-[var(--accent)] bg-white/12 ring-2 ring-[var(--accent-glow)]"
                  : "border-white/10 bg-white/6 hover:border-white/20 hover:bg-white/10"
              }`}
              aria-pressed={selected}
              onClick={() => onChange(mode)}
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
  );
}

function AdaptiveDifficultyLegend() {
  return (
    <div className="mt-5 rounded-2xl border border-white/9 bg-black/12 p-4">
      <p className="text-xs font-semibold text-white/56">
        Độ khó tự thay đổi theo mức ghi nhớ
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(["NEW", "LEARNING", "FAMILIAR", "MASTERED"] as const).map(
          (status) => (
            <div key={status} className="rounded-xl bg-white/5 px-3 py-2.5">
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
  );
}
