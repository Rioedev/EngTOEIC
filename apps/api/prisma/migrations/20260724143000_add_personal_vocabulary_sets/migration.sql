CREATE TYPE "VocabularySetVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED');

ALTER TABLE "VocabularySet"
ADD COLUMN "visibility" "VocabularySetVisibility" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN "ownerId" UUID,
ADD COLUMN "folderId" TEXT,
ADD COLUMN "copiedFromId" TEXT;

CREATE TABLE "VocabularyFolder" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VocabularyFolder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VocabularyFolder_userId_name_key"
ON "VocabularyFolder"("userId", "name");

CREATE INDEX "VocabularyFolder_userId_order_idx"
ON "VocabularyFolder"("userId", "order");

CREATE INDEX "VocabularySet_visibility_isPublished_order_idx"
ON "VocabularySet"("visibility", "isPublished", "order");

CREATE INDEX "VocabularySet_ownerId_updatedAt_idx"
ON "VocabularySet"("ownerId", "updatedAt");

CREATE INDEX "VocabularySet_folderId_idx"
ON "VocabularySet"("folderId");

CREATE INDEX "VocabularySet_copiedFromId_idx"
ON "VocabularySet"("copiedFromId");

ALTER TABLE "VocabularySet"
ADD CONSTRAINT "VocabularySet_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VocabularySet"
ADD CONSTRAINT "VocabularySet_folderId_fkey"
FOREIGN KEY ("folderId") REFERENCES "VocabularyFolder"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VocabularySet"
ADD CONSTRAINT "VocabularySet_copiedFromId_fkey"
FOREIGN KEY ("copiedFromId") REFERENCES "VocabularySet"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VocabularyFolder"
ADD CONSTRAINT "VocabularyFolder_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
