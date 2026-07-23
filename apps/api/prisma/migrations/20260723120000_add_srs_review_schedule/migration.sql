ALTER TABLE "UserTermProgress"
ADD COLUMN "nextReviewAt" TIMESTAMP(3);

UPDATE "UserTermProgress"
SET "nextReviewAt" = COALESCE("lastReviewedAt", "updatedAt")
WHERE "reviewCount" > 0;

CREATE INDEX "UserTermProgress_userId_nextReviewAt_idx"
ON "UserTermProgress"("userId", "nextReviewAt");
