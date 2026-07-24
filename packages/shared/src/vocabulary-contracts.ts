export type VocabularySetVisibility = "PUBLIC" | "PRIVATE" | "UNLISTED";

export type VocabularyProgressStatus =
  "NEW" | "LEARNING" | "FAMILIAR" | "MASTERED";

export type VocabularyReviewRating = "AGAIN" | "HARD" | "GOOD" | "EASY";

export type VocabularyLearnStudyMode =
  "mixed" | "match" | "dictation" | "multiple-choice" | "write" | "true-false";

export type VocabularyTerm = {
  id: string;
  term: string;
  meaningVi: string;
  ipa: string | null;
  partOfSpeech: string | null;
  audioUrl: string | null;
  exampleEn: string | null;
  exampleVi: string | null;
  imageUrl: string | null;
  collocations: string[];
  synonyms: string[];
  antonyms: string[];
  sourceName: string | null;
  sourceUrl: string | null;
  sourceLicense: string | null;
  sourceExternalId: string | null;
  order: number;
};

export type VocabularySet = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  topic: string | null;
  part: string | null;
  difficulty: string | null;
  imageUrl: string | null;
  isPublished: boolean;
  visibility: VocabularySetVisibility;
  ownerId: string | null;
  folderId: string | null;
  copiedFromId: string | null;
  folder?: {
    id: string;
    name: string;
  } | null;
  order: number;
  termCount: number;
  createdAt: string;
  updatedAt: string;
  terms?: VocabularyTerm[];
};

export type VocabularyFolder = {
  id: string;
  name: string;
  order: number;
  setCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PersonalVocabularyLibrary = {
  folders: VocabularyFolder[];
  sets: VocabularySet[];
};

export type PersonalVocabularyTerm = {
  id: string;
  term: string;
  meaningVi: string;
  ipa: string | null;
  partOfSpeech: string | null;
  exampleEn: string | null;
  exampleVi: string | null;
  order: number;
};

export type PersonalVocabularySet = Omit<VocabularySet, "terms"> & {
  terms: PersonalVocabularyTerm[];
};

export type VocabularyTermMutationInput = {
  id?: string;
  term: string;
  meaningVi: string;
  ipa: string;
  partOfSpeech: string;
  exampleEn: string;
  exampleVi: string;
};

export type VocabularySetMutationInput = {
  title: string;
  description: string;
  topic: string;
  part: string;
  difficulty: string;
  visibility: VocabularySetVisibility;
  folderId: string;
  terms: VocabularyTermMutationInput[];
};

export type VocabularyTermProgress = {
  termId: string;
  status: VocabularyProgressStatus;
  lastRating: VocabularyReviewRating | null;
  easeFactor: number;
  intervalDays: number;
  repetitionCount: number;
  lapseCount: number;
  reviewCount: number;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  updatedAt: string;
  reviewAccepted?: boolean;
  nextEligibleAt?: string | null;
};

export type VocabularyTermProgressInput = {
  status?: VocabularyProgressStatus;
  correct?: boolean;
  rating?: VocabularyReviewRating;
};

export type VocabularyReviewScheduleItem = {
  termId: string;
  term: string;
  meaningVi: string;
  status: VocabularyProgressStatus;
  nextReviewAt: string;
  setSlug: string;
  setTitle: string;
};

export type VocabularyReviewScheduleResponse = {
  summary: {
    scheduled: number;
    dueNow: number;
    dueNext7Days: number;
    nextReviewAt: string | null;
    retentionRate: number | null;
    reviewedTerms: number;
    totalReviews: number;
    totalLapses: number;
  };
  items: VocabularyReviewScheduleItem[];
};

export type VocabularyReviewQueueItem = {
  term: VocabularyTerm;
  set: {
    slug: string;
    title: string;
  };
  progress: {
    status: VocabularyProgressStatus;
    lastRating: VocabularyReviewRating | null;
    easeFactor: number;
    intervalDays: number;
    repetitionCount: number;
    lapseCount: number;
    reviewCount: number;
    lastReviewedAt: string | null;
    nextReviewAt: string;
  };
};

export type VocabularyReviewQueueResponse = {
  data: VocabularyReviewQueueItem[];
  meta: {
    total: number;
    limit: number;
    generatedAt: string;
  };
};

export type VocabularyStudySession = {
  currentTermId: string | null;
  currentIndex: number;
  lastStudiedAt: string;
  updatedAt: string;
};

export type VocabularyStudySessionInput = {
  currentTermId: string;
  currentIndex: number;
};

export type VocabularyLearnSession = {
  studyMode: VocabularyLearnStudyMode;
  targetCount: number;
  queueTermIds: string[];
  currentIndex: number;
  correctCount: number;
  wrongCount: number;
  wrongTermIds: string[];
  lastStudiedAt: string;
  updatedAt: string;
};

export type VocabularyLearnSessionInput = {
  studyMode: Exclude<VocabularyLearnStudyMode, "match">;
  targetCount: number;
  queueTermIds: string[];
  currentIndex: number;
  correctCount: number;
  wrongCount: number;
  wrongTermIds: string[];
};

export type VocabularyProgressResponse = {
  data: VocabularyTermProgress[];
  session: VocabularyStudySession | null;
  learnSession: VocabularyLearnSession | null;
  summary: {
    new: number;
    known: number;
    learning: number;
    familiar: number;
    mastered: number;
    total: number;
  };
};

export type VocabularyMatchResult = {
  id: string;
  rank: number;
  durationMs: number;
  moves: number;
  mistakes: number;
  pairCount: number;
  createdAt: string;
};

export type VocabularyMatchResultInput = {
  durationMs: number;
  moves: number;
  mistakes: number;
  pairCount: number;
};

export type VocabularyMatchLeaderboard = {
  data: VocabularyMatchResult[];
  summary: {
    totalPlays: number;
    bestDurationMs: number | null;
    bestMoves: number | null;
    lastPlayedAt: string | null;
  };
  latestResultId?: string;
};

export type VocabularyListResponse = {
  data: VocabularySet[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type DeletedResourceResponse = {
  deleted: boolean;
  id: string;
};
