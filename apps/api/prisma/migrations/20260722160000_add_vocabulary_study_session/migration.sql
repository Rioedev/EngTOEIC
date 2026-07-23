-- CreateTable
CREATE TABLE "VocabularyStudySession" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "vocabularySetId" TEXT NOT NULL,
    "currentTermId" TEXT,
    "currentIndex" INTEGER NOT NULL DEFAULT 0,
    "lastStudiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VocabularyStudySession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VocabularyStudySession_userId_vocabularySetId_key" ON "VocabularyStudySession"("userId", "vocabularySetId");

-- CreateIndex
CREATE INDEX "VocabularyStudySession_vocabularySetId_idx" ON "VocabularyStudySession"("vocabularySetId");

-- CreateIndex
CREATE INDEX "VocabularyStudySession_currentTermId_idx" ON "VocabularyStudySession"("currentTermId");

-- CreateIndex
CREATE INDEX "VocabularyStudySession_userId_lastStudiedAt_idx" ON "VocabularyStudySession"("userId", "lastStudiedAt");

-- AddForeignKey
ALTER TABLE "VocabularyStudySession" ADD CONSTRAINT "VocabularyStudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyStudySession" ADD CONSTRAINT "VocabularyStudySession_vocabularySetId_fkey" FOREIGN KEY ("vocabularySetId") REFERENCES "VocabularySet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyStudySession" ADD CONSTRAINT "VocabularyStudySession_currentTermId_fkey" FOREIGN KEY ("currentTermId") REFERENCES "VocabularyTerm"("id") ON DELETE SET NULL ON UPDATE CASCADE;
