ALTER TABLE "UserTermProgress"
ADD COLUMN "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
ADD COLUMN "intervalDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "repetitionCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lapseCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "UserTermProgress"
SET
  "intervalDays" = CASE
    WHEN "lastReviewedAt" IS NULL OR "nextReviewAt" IS NULL THEN 0
    ELSE GREATEST(
      ROUND(
        EXTRACT(EPOCH FROM ("nextReviewAt" - "lastReviewedAt")) / 86400.0
      )::INTEGER,
      0
    )
  END,
  "repetitionCount" = CASE "status"
    WHEN 'NEW' THEN 0
    WHEN 'LEARNING' THEN 1
    WHEN 'FAMILIAR' THEN 2
    WHEN 'MASTERED' THEN 3
    ELSE 0
  END;
