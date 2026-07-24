export type ToeicSkill = "listening" | "reading";

export type ToeicPart =
  "part-1" | "part-2" | "part-3" | "part-4" | "part-5" | "part-6" | "part-7";

export type QuestionChoice = "A" | "B" | "C" | "D";

export { default as vocabularyDemo } from "./vocabulary-demo.json";

export type PracticeQuestion = {
  id: string;
  part: ToeicPart;
  skill: ToeicSkill;
  prompt: string;
  choices: Record<QuestionChoice, string>;
  correctChoice: QuestionChoice;
  explanation: string;
  transcript?: string;
  audioUrl?: string;
  imageUrl?: string;
};

export type {
  DeletedResourceResponse,
  PersonalVocabularyLibrary,
  PersonalVocabularySet,
  PersonalVocabularyTerm,
  VocabularyFolder,
  VocabularyLearnSession,
  VocabularyLearnSessionInput,
  VocabularyLearnStudyMode,
  VocabularyListResponse,
  VocabularyMatchLeaderboard,
  VocabularyMatchResult,
  VocabularyMatchResultInput,
  VocabularyProgressResponse,
  VocabularyProgressStatus,
  VocabularyReviewQueueItem,
  VocabularyReviewQueueResponse,
  VocabularyReviewRating,
  VocabularyReviewScheduleItem,
  VocabularyReviewScheduleResponse,
  VocabularySet,
  VocabularySetMutationInput,
  VocabularySetVisibility,
  VocabularyStudySession,
  VocabularyStudySessionInput,
  VocabularyTerm,
  VocabularyTermMutationInput,
  VocabularyTermProgress,
  VocabularyTermProgressInput,
} from "./vocabulary-contracts";

export type {
  AudioPlaybackRate,
  UpdateUserProfileInput,
  UserLanguage,
  UserProfile,
  UserRole,
} from "./profile-contracts";

export const toeicParts: Array<{
  id: ToeicPart;
  title: string;
  skill: ToeicSkill;
  description: string;
}> = [
  {
    id: "part-1",
    title: "Part 1",
    skill: "listening",
    description: "Photographs",
  },
  {
    id: "part-2",
    title: "Part 2",
    skill: "listening",
    description: "Question response",
  },
  {
    id: "part-3",
    title: "Part 3",
    skill: "listening",
    description: "Conversations",
  },
  {
    id: "part-4",
    title: "Part 4",
    skill: "listening",
    description: "Short talks",
  },
  {
    id: "part-5",
    title: "Part 5",
    skill: "reading",
    description: "Incomplete sentences",
  },
  {
    id: "part-6",
    title: "Part 6",
    skill: "reading",
    description: "Text completion",
  },
  {
    id: "part-7",
    title: "Part 7",
    skill: "reading",
    description: "Reading comprehension",
  },
];
