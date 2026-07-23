"use client";

import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  FileText,
  Keyboard,
  ListChecks,
  RefreshCcw,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import type { VocabularyTerm } from "@/lib/vocabulary";

type TestMode = "multiple-choice" | "write" | "true-false";
type TestPhase = "setup" | "testing" | "results";

type TestQuestion = {
  id: string;
  term: VocabularyTerm;
  mode: TestMode;
  options: string[];
  statementMeaning: string | null;
  correctAnswer: string;
};

type VocabularyTestPlayerProps = {
  terms: VocabularyTerm[];
  setSlug: string;
};

const modeMeta: Record<
  TestMode,
  {
    label: string;
    description: string;
    icon: typeof ListChecks;
  }
> = {
  "multiple-choice": {
    label: "Trắc nghiệm",
    description: "Chọn nghĩa đúng của từ.",
    icon: ListChecks,
  },
  write: {
    label: "Viết từ",
    description: "Nhìn nghĩa và nhập từ tiếng Anh.",
    icon: Keyboard,
  },
  "true-false": {
    label: "Đúng / Sai",
    description: "Xác định từ và nghĩa có khớp nhau.",
    icon: CircleHelp,
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
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ");
}

function createQuestions(
  terms: VocabularyTerm[],
  count: number,
  modes: TestMode[],
) {
  const selectedTerms = shuffle(terms).slice(0, count);
  const modeSequence = shuffle(modes);

  return selectedTerms.map<TestQuestion>((term, index) => {
    const mode = modeSequence[index % modeSequence.length]!;
    const distractors = shuffle(
      terms.filter(
        (candidate) =>
          candidate.id !== term.id && candidate.meaningVi !== term.meaningVi,
      ),
    );

    if (mode === "multiple-choice") {
      const options = shuffle([
        term.meaningVi,
        ...distractors.slice(0, 3).map((candidate) => candidate.meaningVi),
      ]);

      return {
        id: `${term.id}-${index}-${mode}`,
        term,
        mode,
        options,
        statementMeaning: null,
        correctAnswer: term.meaningVi,
      };
    }

    if (mode === "true-false") {
      const canCreateFalseStatement = distractors.length > 0;
      const isCorrectPair = !canCreateFalseStatement || Math.random() >= 0.5;
      const statementMeaning = isCorrectPair
        ? term.meaningVi
        : distractors[0]!.meaningVi;

      return {
        id: `${term.id}-${index}-${mode}`,
        term,
        mode,
        options: [],
        statementMeaning,
        correctAnswer: String(isCorrectPair),
      };
    }

    return {
      id: `${term.id}-${index}-${mode}`,
      term,
      mode,
      options: [],
      statementMeaning: null,
      correctAnswer: term.term,
    };
  });
}

function isCorrect(question: TestQuestion, answer: string | undefined) {
  if (!answer) return false;

  if (question.mode === "write") {
    return normalizeAnswer(answer) === normalizeAnswer(question.correctAnswer);
  }

  return answer === question.correctAnswer;
}

function answerLabel(question: TestQuestion, answer: string | undefined) {
  if (!answer) return "Chưa trả lời";
  if (question.mode !== "true-false") return answer;
  return answer === "true" ? "Đúng" : "Sai";
}

function correctAnswerLabel(question: TestQuestion) {
  if (question.mode !== "true-false") return question.correctAnswer;
  return question.correctAnswer === "true" ? "Đúng" : "Sai";
}

export function VocabularyTestPlayer({
  terms,
  setSlug,
}: VocabularyTestPlayerProps) {
  const orderedTerms = useMemo(
    () => [...terms].sort((first, second) => first.order - second.order),
    [terms],
  );
  const targetOptions = useMemo(
    () =>
      Array.from(new Set([10, 20, orderedTerms.length])).filter(
        (value) => value > 0 && value <= orderedTerms.length,
      ),
    [orderedTerms.length],
  );
  const [phase, setPhase] = useState<TestPhase>("setup");
  const [targetCount, setTargetCount] = useState(
    targetOptions[0] ?? orderedTerms.length,
  );
  const [selectedModes, setSelectedModes] = useState<Set<TestMode>>(
    new Set(["multiple-choice", "write", "true-false"]),
  );
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [announcement, setAnnouncement] = useState("");

  const currentQuestion = questions[currentIndex];
  const answeredCount = questions.filter((question) =>
    Boolean(answers[question.id]?.trim()),
  ).length;
  const correctCount = questions.filter((question) =>
    isCorrect(question, answers[question.id]),
  ).length;
  const score = questions.length
    ? Math.round((correctCount / questions.length) * 100)
    : 0;
  const modeResults = (Object.keys(modeMeta) as TestMode[]).map((mode) => {
    const modeQuestions = questions.filter(
      (question) => question.mode === mode,
    );
    return {
      mode,
      total: modeQuestions.length,
      correct: modeQuestions.filter((question) =>
        isCorrect(question, answers[question.id]),
      ).length,
    };
  });

  function toggleMode(mode: TestMode) {
    setSelectedModes((current) => {
      const next = new Set(current);
      if (next.has(mode)) {
        if (next.size === 1) {
          setAnnouncement("Bài kiểm tra cần ít nhất một dạng câu hỏi.");
          return current;
        }
        next.delete(mode);
      } else {
        next.add(mode);
      }
      setAnnouncement("");
      return next;
    });
  }

  function startTest() {
    const modes = Array.from(selectedModes);
    if (!modes.length || !targetCount) return;

    setQuestions(createQuestions(orderedTerms, targetCount, modes));
    setAnswers({});
    setCurrentIndex(0);
    setAnnouncement(`Đã tạo bài kiểm tra gồm ${targetCount} câu.`);
    setPhase("testing");
  }

  function updateAnswer(value: string) {
    if (!currentQuestion) return;
    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: value,
    }));
  }

  function goToQuestion(index: number) {
    setCurrentIndex(index);
    setAnnouncement(`Câu ${index + 1} trên ${questions.length}.`);
  }

  function submitTest(event?: FormEvent) {
    event?.preventDefault();
    if (answeredCount < questions.length) {
      setAnnouncement(
        `Bạn còn ${questions.length - answeredCount} câu chưa trả lời.`,
      );
      return;
    }
    setPhase("results");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetTest() {
    setPhase("setup");
    setQuestions([]);
    setAnswers({});
    setCurrentIndex(0);
    setAnnouncement("Đã tạo lại phần thiết lập bài kiểm tra.");
  }

  if (!orderedTerms.length) {
    return (
      <div className="glass-card p-8 text-center text-sm text-white/65">
        Bộ từ này chưa có nội dung để tạo bài kiểm tra.
      </div>
    );
  }

  if (phase === "setup") {
    return (
      <section
        className="glass-card mx-auto max-w-3xl p-6 sm:p-8"
        aria-labelledby="test-setup-title"
      >
        <div className="flex items-start gap-4">
          <span className="grid size-12 flex-none place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <ClipboardCheck className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
              Bài kiểm tra từ vựng
            </p>
            <h1
              id="test-setup-title"
              className="mt-2 text-3xl font-bold tracking-[-0.018em] sm:text-4xl"
            >
              Tạo một bài test theo cách của bạn
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/64">
              Chọn số câu và dạng bài. Đáp án chỉ được chấm sau khi bạn hoàn
              thành toàn bộ bài kiểm tra.
            </p>
          </div>
        </div>

        <fieldset className="mt-8">
          <legend className="text-sm font-semibold text-white/82">
            Dạng câu hỏi
          </legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {(
              Object.entries(modeMeta) as [
                TestMode,
                (typeof modeMeta)[TestMode],
              ][]
            ).map(([mode, item]) => {
              const ModeIcon = item.icon;
              const selected = selectedModes.has(mode);
              return (
                <button
                  key={mode}
                  type="button"
                  className={`relative min-h-32 rounded-2xl border p-4 text-left transition motion-reduce:transition-none ${
                    selected
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-2 ring-[var(--accent-glow)]"
                      : "border-white/10 bg-white/6 hover:border-white/20 hover:bg-white/10"
                  }`}
                  aria-pressed={selected}
                  onClick={() => toggleMode(mode)}
                >
                  <span className="grid size-9 place-items-center rounded-xl bg-white/10 text-[var(--accent)]">
                    <ModeIcon className="size-4.5" aria-hidden="true" />
                  </span>
                  <strong className="mt-3 block text-sm font-semibold text-white">
                    {item.label}
                  </strong>
                  <span className="mt-1 block text-xs leading-5 text-white/54">
                    {item.description}
                  </span>
                  <span
                    className={`absolute right-3 top-3 grid size-5 place-items-center rounded-full ${
                      selected
                        ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                        : "border border-white/18 text-transparent"
                    }`}
                    aria-hidden="true"
                  >
                    <Check className="size-3.5" />
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="mt-7">
          <legend className="text-sm font-semibold text-white/82">
            Số câu
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {targetOptions.map((value) => (
              <button
                key={value}
                type="button"
                className={`min-h-11 rounded-full border px-5 text-sm font-semibold transition ${
                  targetCount === value
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]"
                    : "border-white/10 bg-white/7 text-white/68 hover:bg-white/12"
                }`}
                style={
                  targetCount === value
                    ? { color: "var(--accent-ink)" }
                    : undefined
                }
                aria-pressed={targetCount === value}
                onClick={() => setTargetCount(value)}
              >
                {value === orderedTerms.length ? `Tất cả ${value}` : value}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-6 min-h-6 text-sm text-amber-100" aria-live="polite">
          {announcement}
        </div>

        <button
          type="button"
          className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--accent-ink)] shadow-lg shadow-[var(--accent-glow)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transform-none"
          style={{ color: "var(--accent-ink)" }}
          onClick={startTest}
        >
          <FileText className="size-4.5" aria-hidden="true" />
          Bắt đầu bài kiểm tra
        </button>
      </section>
    );
  }

  if (phase === "results") {
    return (
      <section
        className="mx-auto max-w-4xl"
        aria-labelledby="test-result-title"
      >
        <div className="glass-card overflow-hidden p-6 sm:p-8">
          <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
            <div
              className={`grid size-32 place-items-center rounded-full border-[10px] ${
                score >= 80
                  ? "border-emerald-300/35 bg-emerald-300/12"
                  : score >= 60
                    ? "border-amber-300/35 bg-amber-300/12"
                    : "border-rose-300/35 bg-rose-300/12"
              }`}
            >
              <div className="text-center">
                <strong className="block text-3xl font-bold">{score}%</strong>
                <span className="text-xs text-white/56">điểm số</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                Kết quả bài kiểm tra
              </p>
              <h1
                id="test-result-title"
                className="mt-2 text-3xl font-bold tracking-[-0.018em] sm:text-4xl"
              >
                {score >= 80
                  ? "Bạn nắm bộ từ khá chắc."
                  : score >= 60
                    ? "Sắp đạt rồi, ôn thêm một lượt nhé."
                    : "Mình cùng luyện lại những từ chưa chắc."}
              </h1>
              <p className="mt-3 text-sm leading-7 text-white/64">
                Bạn trả lời đúng {correctCount}/{questions.length} câu. Bài test
                này không cộng tiến độ SRS để kết quả học không bị tăng sai.
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {modeResults
              .filter((result) => result.total > 0)
              .map((result) => {
                const ModeIcon = modeMeta[result.mode].icon;
                return (
                  <div
                    key={result.mode}
                    className="rounded-2xl border border-white/9 bg-white/6 p-4"
                  >
                    <div className="flex items-center gap-2 text-white/58">
                      <ModeIcon className="size-4" aria-hidden="true" />
                      <span className="text-xs">
                        {modeMeta[result.mode].label}
                      </span>
                    </div>
                    <strong className="mt-3 block text-2xl font-semibold">
                      {result.correct}/{result.total}
                    </strong>
                  </div>
                );
              })}
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--accent-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{ color: "var(--accent-ink)" }}
              onClick={resetTest}
            >
              <RefreshCcw className="size-4" aria-hidden="true" />
              Tạo bài test mới
            </button>
            <Link
              href={`/vocabulary/${setSlug}/learn`}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/7 px-6 text-sm font-semibold text-white/76 transition hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              Luyện lại trong Learn
            </Link>
          </div>
        </div>

        <section
          className="mt-7 space-y-3"
          aria-labelledby="answer-review-title"
        >
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                Xem lại đáp án
              </p>
              <h2 id="answer-review-title" className="mt-2 text-2xl font-bold">
                Chi tiết từng câu
              </h2>
            </div>
            <span className="text-sm text-white/54">
              {questions.length - correctCount} câu cần xem lại
            </span>
          </div>

          {questions.map((question, index) => {
            const correct = isCorrect(question, answers[question.id]);
            return (
              <article
                key={question.id}
                className={`glass-card border p-5 ${
                  correct ? "border-emerald-300/18" : "border-rose-300/22"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 grid size-8 flex-none place-items-center rounded-full ${
                      correct
                        ? "bg-emerald-300/14 text-emerald-200"
                        : "bg-rose-300/14 text-rose-200"
                    }`}
                  >
                    {correct ? (
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                    ) : (
                      <XCircle className="size-4" aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-white/44">
                        Câu {index + 1}
                      </span>
                      <span className="rounded-full bg-white/7 px-2.5 py-1 text-[0.68rem] text-white/58">
                        {modeMeta[question.mode].label}
                      </span>
                    </div>
                    <p className="mt-3 text-base font-semibold text-white">
                      {question.mode === "write"
                        ? question.term.meaningVi
                        : question.mode === "true-false"
                          ? `${question.term.term} — ${question.statementMeaning}`
                          : question.term.term}
                    </p>
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <p
                        className={correct ? "text-white/62" : "text-rose-100"}
                      >
                        <span className="text-white/42">Bạn chọn: </span>
                        {answerLabel(question, answers[question.id])}
                      </p>
                      {!correct ? (
                        <p className="text-emerald-100">
                          <span className="text-white/42">Đáp án: </span>
                          {correctAnswerLabel(question)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </section>
    );
  }

  if (!currentQuestion) return null;

  const currentAnswer = answers[currentQuestion.id] ?? "";
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <section
      className="mx-auto max-w-6xl"
      aria-labelledby="test-question-title"
    >
      <div className="glass-card overflow-hidden">
        <div className="h-1.5 bg-white/7">
          <div
            className="h-full bg-[var(--accent)] transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid lg:grid-cols-[1fr_16rem]">
          <form
            className="min-w-0 p-6 sm:p-8"
            onSubmit={(event) => {
              event.preventDefault();
              if (currentIndex < questions.length - 1) {
                goToQuestion(currentIndex + 1);
              } else {
                submitTest(event);
              }
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
                  {modeMeta[currentQuestion.mode].label}
                </p>
                <h1
                  id="test-question-title"
                  className="mt-1 text-xl font-semibold text-white"
                >
                  Câu {currentIndex + 1} trên {questions.length}
                </h1>
              </div>
              <span className="rounded-full bg-white/7 px-3 py-1.5 text-xs text-white/56">
                Đã trả lời {answeredCount}/{questions.length}
              </span>
            </div>

            <div className="mt-8 min-h-64">
              {currentQuestion.mode === "multiple-choice" ? (
                <fieldset>
                  <legend className="text-2xl font-semibold leading-snug sm:text-3xl">
                    “{currentQuestion.term.term}” có nghĩa là gì?
                  </legend>
                  {currentQuestion.term.ipa ? (
                    <p className="mt-2 text-sm text-white/48">
                      {currentQuestion.term.ipa}
                    </p>
                  ) : null}
                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    {currentQuestion.options.map((option, index) => {
                      const selected = currentAnswer === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          className={`min-h-20 rounded-2xl border p-4 text-left text-sm leading-6 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                            selected
                              ? "border-[var(--accent)] bg-[var(--accent-soft)] text-white"
                              : "border-white/10 bg-white/6 text-white/72 hover:bg-white/10"
                          }`}
                          aria-pressed={selected}
                          onClick={() => updateAnswer(option)}
                        >
                          <span className="mr-2 text-xs text-white/38">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ) : currentQuestion.mode === "write" ? (
                <div>
                  <label
                    htmlFor="test-written-answer"
                    className="block text-2xl font-semibold leading-snug sm:text-3xl"
                  >
                    Viết từ tiếng Anh có nghĩa:
                    <span className="mt-3 block text-[var(--accent)]">
                      “{currentQuestion.term.meaningVi}”
                    </span>
                  </label>
                  <input
                    id="test-written-answer"
                    className="mt-8 min-h-14 w-full rounded-2xl border border-white/12 bg-black/20 px-5 text-base text-white outline-none placeholder:text-white/30 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)]"
                    value={currentAnswer}
                    onChange={(event) => updateAnswer(event.target.value)}
                    placeholder="Nhập từ tiếng Anh..."
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
              ) : (
                <fieldset>
                  <legend className="text-sm text-white/58">
                    Từ và nghĩa sau có khớp nhau không?
                  </legend>
                  <div className="mt-5 rounded-3xl border border-white/10 bg-black/18 p-6 text-center sm:p-8">
                    <p className="text-3xl font-semibold text-white sm:text-4xl">
                      {currentQuestion.term.term}
                    </p>
                    {currentQuestion.term.ipa ? (
                      <p className="mt-2 text-sm text-white/44">
                        {currentQuestion.term.ipa}
                      </p>
                    ) : null}
                    <div className="mx-auto my-5 h-px max-w-xs bg-white/10" />
                    <p className="text-lg leading-8 text-white/72">
                      {currentQuestion.statementMeaning}
                    </p>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {[
                      { value: "true", label: "Đúng", icon: Check },
                      { value: "false", label: "Sai", icon: X },
                    ].map((option) => {
                      const OptionIcon = option.icon;
                      const selected = currentAnswer === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                            selected
                              ? "border-[var(--accent)] bg-[var(--accent-soft)] text-white"
                              : "border-white/10 bg-white/6 text-white/68 hover:bg-white/10"
                          }`}
                          aria-pressed={selected}
                          onClick={() => updateAnswer(option.value)}
                        >
                          <OptionIcon className="size-4" aria-hidden="true" />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}
            </div>

            <div
              className="mt-6 min-h-6 text-sm text-amber-100"
              aria-live="polite"
            >
              {announcement}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/8 pt-5">
              <button
                type="button"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/7 px-4 text-sm text-white/66 transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-35"
                disabled={currentIndex === 0}
                onClick={() => goToQuestion(currentIndex - 1)}
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                Trước
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  style={{ color: "var(--accent-ink)" }}
                >
                  Tiếp theo
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-ink)] disabled:cursor-not-allowed disabled:opacity-45"
                  style={{ color: "var(--accent-ink)" }}
                  disabled={answeredCount < questions.length}
                >
                  <ClipboardCheck className="size-4" aria-hidden="true" />
                  Nộp bài
                </button>
              )}
            </div>
          </form>

          <aside className="border-t border-white/8 bg-black/12 p-5 lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-white/76">
                Danh sách câu
              </h2>
              <span className="text-xs text-white/42">
                {answeredCount} xong
              </span>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2 lg:grid-cols-4">
              {questions.map((question, index) => {
                const answered = Boolean(answers[question.id]?.trim());
                const active = index === currentIndex;
                return (
                  <button
                    key={question.id}
                    type="button"
                    className={`grid aspect-square min-h-10 place-items-center rounded-xl border text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                      active
                        ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]"
                        : answered
                          ? "border-[var(--accent)]/35 bg-[var(--accent-soft)] text-white/82"
                          : "border-white/9 bg-white/5 text-white/45 hover:bg-white/9"
                    }`}
                    style={active ? { color: "var(--accent-ink)" } : undefined}
                    aria-label={`Đi tới câu ${index + 1}${answered ? ", đã trả lời" : ", chưa trả lời"}`}
                    aria-current={active ? "step" : undefined}
                    onClick={() => goToQuestion(index)}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 text-sm text-white/64 transition hover:bg-white/11"
              onClick={resetTest}
            >
              <RefreshCcw className="size-4" aria-hidden="true" />
              Tạo lại bài
            </button>
          </aside>
        </div>
      </div>
    </section>
  );
}
