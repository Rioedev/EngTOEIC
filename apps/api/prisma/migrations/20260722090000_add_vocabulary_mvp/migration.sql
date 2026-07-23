-- CreateEnum
CREATE TYPE "VocabularyProgressStatus" AS ENUM ('NEW', 'LEARNING', 'KNOWN');

-- CreateTable
CREATE TABLE "VocabularySet" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "topic" TEXT,
    "part" "ToeicPart",
    "difficulty" TEXT,
    "imageUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VocabularySet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabularyTerm" (
    "id" TEXT NOT NULL,
    "vocabularySetId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "meaningVi" TEXT NOT NULL,
    "ipa" TEXT,
    "partOfSpeech" TEXT,
    "audioUrl" TEXT,
    "exampleEn" TEXT,
    "exampleVi" TEXT,
    "imageUrl" TEXT,
    "collocations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "synonyms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "antonyms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "sourceLicense" TEXT,
    "sourceExternalId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VocabularyTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedVocabularySet" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "vocabularySetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedVocabularySet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTermProgress" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "termId" TEXT NOT NULL,
    "status" "VocabularyProgressStatus" NOT NULL DEFAULT 'NEW',
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTermProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VocabularySet_slug_key" ON "VocabularySet"("slug");

-- CreateIndex
CREATE INDEX "VocabularySet_isPublished_order_idx" ON "VocabularySet"("isPublished", "order");

-- CreateIndex
CREATE INDEX "VocabularySet_part_idx" ON "VocabularySet"("part");

-- CreateIndex
CREATE UNIQUE INDEX "VocabularyTerm_vocabularySetId_term_key" ON "VocabularyTerm"("vocabularySetId", "term");

-- CreateIndex
CREATE INDEX "VocabularyTerm_vocabularySetId_order_idx" ON "VocabularyTerm"("vocabularySetId", "order");

-- CreateIndex
CREATE INDEX "VocabularyTerm_term_idx" ON "VocabularyTerm"("term");

-- CreateIndex
CREATE UNIQUE INDEX "SavedVocabularySet_userId_vocabularySetId_key" ON "SavedVocabularySet"("userId", "vocabularySetId");

-- CreateIndex
CREATE INDEX "SavedVocabularySet_vocabularySetId_idx" ON "SavedVocabularySet"("vocabularySetId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTermProgress_userId_termId_key" ON "UserTermProgress"("userId", "termId");

-- CreateIndex
CREATE INDEX "UserTermProgress_termId_idx" ON "UserTermProgress"("termId");

-- CreateIndex
CREATE INDEX "UserTermProgress_userId_status_idx" ON "UserTermProgress"("userId", "status");

-- AddForeignKey
ALTER TABLE "VocabularyTerm" ADD CONSTRAINT "VocabularyTerm_vocabularySetId_fkey" FOREIGN KEY ("vocabularySetId") REFERENCES "VocabularySet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedVocabularySet" ADD CONSTRAINT "SavedVocabularySet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedVocabularySet" ADD CONSTRAINT "SavedVocabularySet_vocabularySetId_fkey" FOREIGN KEY ("vocabularySetId") REFERENCES "VocabularySet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTermProgress" ADD CONSTRAINT "UserTermProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTermProgress" ADD CONSTRAINT "UserTermProgress_termId_fkey" FOREIGN KEY ("termId") REFERENCES "VocabularyTerm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
