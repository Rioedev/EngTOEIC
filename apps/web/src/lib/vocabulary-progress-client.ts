import type {
  VocabularyLearnSession,
  VocabularyLearnSessionInput,
  VocabularyMatchLeaderboard,
  VocabularyMatchResultInput,
  VocabularyProgressResponse,
  VocabularyProgressStatus,
  VocabularyReviewRating,
  VocabularyStudySession,
  VocabularyTermProgress,
} from "@engtoeic/shared";
import { authenticatedApiRequest } from "@/lib/api/browser-client";

function vocabularySetPath(setSlug: string, suffix: string) {
  return `/vocabulary-sets/${encodeURIComponent(setSlug)}${suffix}`;
}

function termProgressPath(setSlug: string, termId: string) {
  return vocabularySetPath(
    setSlug,
    `/terms/${encodeURIComponent(termId)}/progress`,
  );
}

export function loadVocabularyProgress(setSlug: string) {
  return authenticatedApiRequest<VocabularyProgressResponse>(
    vocabularySetPath(setSlug, "/progress"),
    { fallbackMessage: "Không thể tải tiến độ" },
  );
}

export function saveVocabularyTermProgress(
  setSlug: string,
  termId: string,
  status: VocabularyProgressStatus,
) {
  return authenticatedApiRequest<VocabularyTermProgress>(
    termProgressPath(setSlug, termId),
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
      fallbackMessage: "Không thể lưu tiến độ",
    },
  );
}

export function recordVocabularyTermAnswer(
  setSlug: string,
  termId: string,
  correct: boolean,
) {
  return authenticatedApiRequest<VocabularyTermProgress>(
    termProgressPath(setSlug, termId),
    {
      method: "PATCH",
      body: JSON.stringify({ correct }),
      fallbackMessage: "Không thể lưu kết quả học",
    },
  );
}

export function rateVocabularyTerm(
  setSlug: string,
  termId: string,
  rating: VocabularyReviewRating,
) {
  return authenticatedApiRequest<VocabularyTermProgress>(
    termProgressPath(setSlug, termId),
    {
      method: "PATCH",
      body: JSON.stringify({ rating }),
      fallbackMessage: "Không thể lưu mức độ ghi nhớ",
    },
  );
}

export function saveVocabularyStudySession(
  setSlug: string,
  currentTermId: string,
  currentIndex: number,
) {
  return authenticatedApiRequest<VocabularyStudySession>(
    vocabularySetPath(setSlug, "/session"),
    {
      method: "PATCH",
      body: JSON.stringify({ currentTermId, currentIndex }),
      fallbackMessage: "Không thể lưu vị trí thẻ",
    },
  );
}

export function saveVocabularyLearnSession(
  setSlug: string,
  checkpoint: VocabularyLearnSessionInput,
) {
  return authenticatedApiRequest<VocabularyLearnSession>(
    vocabularySetPath(setSlug, "/learn-session"),
    {
      method: "PATCH",
      body: JSON.stringify(checkpoint),
      fallbackMessage: "Không thể lưu checkpoint Learn",
    },
  );
}

export function clearVocabularyLearnSession(setSlug: string) {
  return authenticatedApiRequest<{ cleared: boolean }>(
    vocabularySetPath(setSlug, "/learn-session"),
    {
      method: "DELETE",
      fallbackMessage: "Không thể xóa checkpoint Learn",
    },
  );
}

export function saveVocabularyMatchResult(
  setSlug: string,
  result: VocabularyMatchResultInput,
) {
  return authenticatedApiRequest<VocabularyMatchLeaderboard>(
    vocabularySetPath(setSlug, "/match-results"),
    {
      method: "POST",
      body: JSON.stringify(result),
      fallbackMessage: "Không thể lưu thành tích Match",
    },
  );
}
