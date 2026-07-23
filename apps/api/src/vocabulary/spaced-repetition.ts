import { VocabularyReviewRating } from "@prisma/client";

export const DEFAULT_EASE_FACTOR = 2.5;
export const MIN_EASE_FACTOR = 1.3;
export const MAX_EASE_FACTOR = 3;
export const AGAIN_DELAY_MINUTES = 10;
export const MAX_INTERVAL_DAYS = 3650;

export type SpacedRepetitionState = {
  easeFactor: number;
  intervalDays: number;
  repetitionCount: number;
  lapseCount: number;
};

export type SpacedRepetitionResult = SpacedRepetitionState & {
  nextReviewAt: Date;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MINUTE_IN_MS = 60 * 1000;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function normalizeInteger(value: number) {
  return Number.isFinite(value) ? Math.max(Math.round(value), 0) : 0;
}

function normalizeEaseFactor(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_EASE_FACTOR;
  return clamp(value, MIN_EASE_FACTOR, MAX_EASE_FACTOR);
}

function roundEaseFactor(value: number) {
  return Math.round(value * 100) / 100;
}

function clampInterval(value: number) {
  return clamp(normalizeInteger(value), 0, MAX_INTERVAL_DAYS);
}

export function calculateRetentionRate(
  totalReviews: number,
  totalLapses: number,
) {
  const reviews = normalizeInteger(totalReviews);
  if (reviews === 0) return null;

  const lapses = clamp(normalizeInteger(totalLapses), 0, reviews);
  return Math.round(((reviews - lapses) / reviews) * 100);
}

export function calculateSpacedRepetition(
  current: SpacedRepetitionState,
  rating: VocabularyReviewRating,
  reviewedAt: Date,
): SpacedRepetitionResult {
  const easeFactor = normalizeEaseFactor(current.easeFactor);
  const intervalDays = clampInterval(current.intervalDays);
  const repetitionCount = normalizeInteger(current.repetitionCount);
  const lapseCount = normalizeInteger(current.lapseCount);

  if (rating === VocabularyReviewRating.AGAIN) {
    return {
      easeFactor: roundEaseFactor(
        clamp(easeFactor - 0.2, MIN_EASE_FACTOR, MAX_EASE_FACTOR),
      ),
      intervalDays: 0,
      repetitionCount: 0,
      lapseCount: lapseCount + 1,
      nextReviewAt: new Date(
        reviewedAt.getTime() + AGAIN_DELAY_MINUTES * MINUTE_IN_MS,
      ),
    };
  }

  if (rating === VocabularyReviewRating.HARD) {
    const nextInterval =
      intervalDays === 0
        ? 1
        : Math.max(intervalDays + 1, Math.ceil(intervalDays * 1.2));

    return {
      easeFactor: roundEaseFactor(
        clamp(easeFactor - 0.15, MIN_EASE_FACTOR, MAX_EASE_FACTOR),
      ),
      intervalDays: clampInterval(nextInterval),
      repetitionCount: repetitionCount + 1,
      lapseCount,
      nextReviewAt: new Date(
        reviewedAt.getTime() + clampInterval(nextInterval) * DAY_IN_MS,
      ),
    };
  }

  if (rating === VocabularyReviewRating.GOOD) {
    const nextInterval =
      repetitionCount === 0
        ? 3
        : repetitionCount === 1
          ? 6
          : Math.max(intervalDays + 1, Math.round(intervalDays * easeFactor));

    return {
      easeFactor: roundEaseFactor(easeFactor),
      intervalDays: clampInterval(nextInterval),
      repetitionCount: repetitionCount + 1,
      lapseCount,
      nextReviewAt: new Date(
        reviewedAt.getTime() + clampInterval(nextInterval) * DAY_IN_MS,
      ),
    };
  }

  const nextEaseFactor = roundEaseFactor(
    clamp(easeFactor + 0.15, MIN_EASE_FACTOR, MAX_EASE_FACTOR),
  );
  const nextInterval =
    repetitionCount === 0
      ? 7
      : Math.max(
          intervalDays + 1,
          Math.round(Math.max(intervalDays, 1) * nextEaseFactor * 1.3),
        );

  return {
    easeFactor: nextEaseFactor,
    intervalDays: clampInterval(nextInterval),
    repetitionCount: repetitionCount + 1,
    lapseCount,
    nextReviewAt: new Date(
      reviewedAt.getTime() + clampInterval(nextInterval) * DAY_IN_MS,
    ),
  };
}
