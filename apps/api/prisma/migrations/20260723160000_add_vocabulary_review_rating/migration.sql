CREATE TYPE "VocabularyReviewRating" AS ENUM ('AGAIN', 'HARD', 'GOOD', 'EASY');

ALTER TABLE "UserTermProgress"
ADD COLUMN "lastRating" "VocabularyReviewRating";
