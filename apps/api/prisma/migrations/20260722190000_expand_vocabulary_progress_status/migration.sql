-- Preserve existing learner progress while expanding the mastery scale.
ALTER TYPE "VocabularyProgressStatus" RENAME VALUE 'KNOWN' TO 'FAMILIAR';
ALTER TYPE "VocabularyProgressStatus" ADD VALUE 'MASTERED' AFTER 'FAMILIAR';
