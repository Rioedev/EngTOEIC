import { vocabularyDemo } from "@engtoeic/shared";

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
  order: number;
  termCount: number;
  createdAt: string;
  updatedAt: string;
  terms?: VocabularyTerm[];
};

export type VocabularyProgressStatus =
  "NEW" | "LEARNING" | "FAMILIAR" | "MASTERED";

export type VocabularyReviewRating = "AGAIN" | "HARD" | "GOOD" | "EASY";

export type VocabularyTermProgress = {
  termId: string;
  status: VocabularyProgressStatus;
  lastRating: VocabularyReviewRating | null;
  reviewCount: number;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  updatedAt: string;
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
    nextReviewAt: string | null;
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

export type VocabularyLearnStudyMode =
  "mixed" | "match" | "dictation" | "multiple-choice" | "write" | "true-false";

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

type VocabularyListResponse = {
  data: VocabularySet[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type VocabularyDataSource = "api" | "demo";

const demoTimestamp = "2026-07-22T00:00:00.000Z";

const demoTerms: VocabularyTerm[] = vocabularyDemo.terms.map((term, index) => ({
  id: `demo-term-${index + 1}`,
  ...term,
  audioUrl: null,
  imageUrl: null,
  synonyms: [],
  antonyms: [],
  sourceName: "EngTOEIC editorial seed",
  sourceUrl: null,
  sourceLicense: "Original educational content",
  sourceExternalId: null,
  order: index + 1,
}));

const demoSet: VocabularySet = {
  id: "demo-toeic-office-basics",
  ...vocabularyDemo.set,
  imageUrl: null,
  termCount: demoTerms.length,
  createdAt: demoTimestamp,
  updatedAt: demoTimestamp,
  terms: demoTerms,
};

function getApiBaseUrl() {
  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:4000"
  ).replace(/\/$/, "");
}

async function requestApi<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(3500),
  });

  if (!response.ok) {
    throw new Error(`Vocabulary API returned ${response.status}.`);
  }

  return (await response.json()) as T;
}

function matchesDemoSet(search?: string, part?: string) {
  const normalizedSearch = search?.trim().toLocaleLowerCase("vi");
  const matchesSearch =
    !normalizedSearch ||
    [demoSet.title, demoSet.description, demoSet.topic]
      .filter(Boolean)
      .some((value) =>
        value?.toLocaleLowerCase("vi").includes(normalizedSearch),
      );
  const matchesPart = !part || demoSet.part === part;

  return matchesSearch && matchesPart;
}

export async function getVocabularySets(params?: {
  search?: string;
  part?: string;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.part) query.set("part", params.part);
  const suffix = query.size ? `?${query.toString()}` : "";

  try {
    return {
      response: await requestApi<VocabularyListResponse>(
        `/vocabulary-sets${suffix}`,
      ),
      source: "api" as const,
    };
  } catch {
    const data = matchesDemoSet(params?.search, params?.part)
      ? [{ ...demoSet, terms: undefined }]
      : [];

    return {
      response: {
        data,
        meta: {
          page: 1,
          limit: 20,
          total: data.length,
          totalPages: data.length ? 1 : 0,
        },
      },
      source: "demo" as const,
    };
  }
}

export async function getVocabularySet(slug: string) {
  try {
    return {
      vocabularySet: await requestApi<VocabularySet>(
        `/vocabulary-sets/${encodeURIComponent(slug)}`,
      ),
      source: "api" as const,
    };
  } catch {
    return {
      vocabularySet: slug === demoSet.slug ? demoSet : null,
      source: "demo" as const,
    };
  }
}

export async function getVocabularyProgress(slug: string, accessToken: string) {
  try {
    const response = await fetch(
      `${getApiBaseUrl()}/vocabulary-sets/${encodeURIComponent(slug)}/progress`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(3500),
      },
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as VocabularyProgressResponse;
  } catch {
    return null;
  }
}

export async function getVocabularyReviewSchedule(accessToken: string) {
  try {
    const response = await fetch(
      `${getApiBaseUrl()}/vocabulary-sets/review-schedule`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(3500),
      },
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as VocabularyReviewScheduleResponse;
  } catch {
    return null;
  }
}

export async function getVocabularyReviewQueue(
  accessToken: string,
  limit = 20,
) {
  try {
    const response = await fetch(
      `${getApiBaseUrl()}/vocabulary/review-queue?limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(3500),
      },
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as VocabularyReviewQueueResponse;
  } catch {
    return null;
  }
}
