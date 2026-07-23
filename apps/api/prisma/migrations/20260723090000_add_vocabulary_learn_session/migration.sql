CREATE TABLE "VocabularyLearnSession" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "vocabularySetId" TEXT NOT NULL,
    "studyMode" TEXT NOT NULL,
    "targetCount" INTEGER NOT NULL,
    "queueTermIds" TEXT[] NOT NULL,
    "currentIndex" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "wrongTermIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastStudiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VocabularyLearnSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VocabularyLearnSession_userId_vocabularySetId_key"
ON "VocabularyLearnSession"("userId", "vocabularySetId");

CREATE INDEX "VocabularyLearnSession_vocabularySetId_idx"
ON "VocabularyLearnSession"("vocabularySetId");

CREATE INDEX "VocabularyLearnSession_userId_lastStudiedAt_idx"
ON "VocabularyLearnSession"("userId", "lastStudiedAt");

ALTER TABLE "VocabularyLearnSession"
ADD CONSTRAINT "VocabularyLearnSession_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VocabularyLearnSession"
ADD CONSTRAINT "VocabularyLearnSession_vocabularySetId_fkey"
FOREIGN KEY ("vocabularySetId") REFERENCES "VocabularySet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
