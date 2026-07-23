-- CreateTable
CREATE TABLE "VocabularyMatchResult" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "vocabularySetId" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "moves" INTEGER NOT NULL,
    "mistakes" INTEGER NOT NULL,
    "pairCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VocabularyMatchResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VocabularyMatchResult_userId_vocabularySetId_durationMs_idx"
ON "VocabularyMatchResult"("userId", "vocabularySetId", "durationMs");

-- CreateIndex
CREATE INDEX "VocabularyMatchResult_userId_vocabularySetId_createdAt_idx"
ON "VocabularyMatchResult"("userId", "vocabularySetId", "createdAt");

-- CreateIndex
CREATE INDEX "VocabularyMatchResult_vocabularySetId_idx"
ON "VocabularyMatchResult"("vocabularySetId");

-- AddForeignKey
ALTER TABLE "VocabularyMatchResult"
ADD CONSTRAINT "VocabularyMatchResult_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyMatchResult"
ADD CONSTRAINT "VocabularyMatchResult_vocabularySetId_fkey"
FOREIGN KEY ("vocabularySetId") REFERENCES "VocabularySet"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
