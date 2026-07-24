import {
  vocabularyDemo,
  type PersonalVocabularyLibrary,
  type VocabularyListResponse,
  type VocabularyMatchLeaderboard,
  type VocabularyProgressResponse,
  type VocabularyReviewQueueResponse,
  type VocabularyReviewScheduleResponse,
  type VocabularySet,
  type VocabularyTerm,
} from "@engtoeic/shared";
import { serverApiRequest } from "@/lib/api/server-client";

export type {
  PersonalVocabularyLibrary,
  VocabularyFolder,
  VocabularyLearnSession,
  VocabularyLearnStudyMode,
  VocabularyListResponse,
  VocabularyMatchLeaderboard,
  VocabularyMatchResult,
  VocabularyProgressResponse,
  VocabularyProgressStatus,
  VocabularyReviewQueueItem,
  VocabularyReviewQueueResponse,
  VocabularyReviewRating,
  VocabularyReviewScheduleItem,
  VocabularyReviewScheduleResponse,
  VocabularySet,
  VocabularySetVisibility,
  VocabularyStudySession,
  VocabularyTerm,
  VocabularyTermProgress,
} from "@engtoeic/shared";

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
  visibility: "PUBLIC",
  ownerId: null,
  folderId: null,
  copiedFromId: null,
  termCount: demoTerms.length,
  createdAt: demoTimestamp,
  updatedAt: demoTimestamp,
  terms: demoTerms,
};

async function requestApi<T>(path: string, accessToken?: string): Promise<T> {
  return serverApiRequest<T>(path, {
    accessToken,
    ...(accessToken
      ? { cache: "no-store" as const }
      : { next: { revalidate: 60 } }),
    fallbackMessage: "Không thể tải dữ liệu từ vựng",
    timeoutMs: 3500,
  });
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

export async function getVocabularySet(slug: string, accessToken?: string) {
  try {
    return {
      vocabularySet: await requestApi<VocabularySet>(
        `/vocabulary-sets/${encodeURIComponent(slug)}`,
        accessToken,
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

export async function getPersonalVocabularyLibrary(accessToken: string) {
  try {
    return await serverApiRequest<PersonalVocabularyLibrary>(
      "/vocabulary-sets/mine",
      {
        accessToken,
        fallbackMessage: "Không thể tải thư viện cá nhân",
        timeoutMs: 5000,
        cache: "no-store",
      },
    );
  } catch {
    return null;
  }
}

export async function getVocabularyProgress(slug: string, accessToken: string) {
  try {
    return await requestApi<VocabularyProgressResponse>(
      `/vocabulary-sets/${encodeURIComponent(slug)}/progress`,
      accessToken,
    );
  } catch {
    return null;
  }
}

export async function getVocabularyMatchResults(
  slug: string,
  accessToken: string,
) {
  try {
    return await requestApi<VocabularyMatchLeaderboard>(
      `/vocabulary-sets/${encodeURIComponent(slug)}/match-results`,
      accessToken,
    );
  } catch {
    return null;
  }
}

export async function getVocabularyReviewSchedule(accessToken: string) {
  try {
    return await requestApi<VocabularyReviewScheduleResponse>(
      "/vocabulary-sets/review-schedule",
      accessToken,
    );
  } catch {
    return null;
  }
}

export async function getVocabularyReviewQueue(
  accessToken: string,
  limit = 20,
) {
  try {
    return await requestApi<VocabularyReviewQueueResponse>(
      `/vocabulary/review-queue?limit=${limit}`,
      accessToken,
    );
  } catch {
    return null;
  }
}
