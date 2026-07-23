-- User IDs are owned by Supabase Auth. Existing CUID users cannot be mapped to
-- auth.users safely, so stop instead of silently dropping or rewriting them.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "User") THEN
    RAISE EXCEPTION 'Cannot migrate legacy User IDs automatically. Map or remove legacy users before applying this migration.';
  END IF;
END $$;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('LEARNER', 'EDITOR', 'ADMIN');

-- DropForeignKey
ALTER TABLE "TestAttempt" DROP CONSTRAINT "TestAttempt_userId_fkey";

-- AlterTable
ALTER TABLE "User"
  ALTER COLUMN "id" SET DATA TYPE UUID USING "id"::uuid,
  ADD COLUMN "avatarUrl" TEXT,
  ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'LEARNER';

-- AlterTable
ALTER TABLE "TestAttempt"
  ALTER COLUMN "userId" SET DATA TYPE UUID USING "userId"::uuid;

-- AddForeignKey
ALTER TABLE "TestAttempt"
  ADD CONSTRAINT "TestAttempt_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
