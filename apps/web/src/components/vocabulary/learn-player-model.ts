import {
  CheckCircle2,
  CircleHelp,
  Grid3X3,
  Headphones,
  Keyboard,
  ListChecks,
  Shuffle,
  Sparkles,
} from "lucide-react";
import type {
  VocabularyLearnStudyMode,
  VocabularyProgressStatus,
  VocabularyTerm,
} from "@/lib/vocabulary";

export type QuestionMode =
  "multiple-choice" | "write" | "listen" | "dictation" | "true-false";
export type StudyMode = VocabularyLearnStudyMode;
export type SaveState = "idle" | "saving" | "saved" | "error";
export type LearnFeedback = {
  correct: boolean;
  answer: string;
  statusAfter: VocabularyProgressStatus;
  mode: QuestionMode;
};

export const adaptiveModes: Record<VocabularyProgressStatus, QuestionMode[]> = {
  NEW: ["multiple-choice", "true-false"],
  LEARNING: ["listen", "multiple-choice", "true-false"],
  FAMILIAR: ["write", "listen", "dictation"],
  MASTERED: ["dictation", "write"],
};

export const progressMeta: Record<
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

export const progressRank: Record<VocabularyProgressStatus, number> = {
  NEW: 0,
  LEARNING: 1,
  FAMILIAR: 2,
  MASTERED: 3,
};

export const studyModeMeta: Record<
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

export const questionModeMeta: Record<
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

export function nextProgressStatus(
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

export function shuffle<T>(items: T[]) {
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

export function normalizeAnswer(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9\s'-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildMeaningOptions(
  terms: VocabularyTerm[],
  current: VocabularyTerm,
) {
  const distractors = shuffle(
    terms.filter(
      (term) => term.id !== current.id && term.meaningVi !== current.meaningVi,
    ),
  )
    .slice(0, 3)
    .map((term) => term.meaningVi);

  return shuffle([current.meaningVi, ...distractors]);
}
