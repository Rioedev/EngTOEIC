import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { VocabularyController } from "./vocabulary.controller";
import { VocabularyFoldersController } from "./vocabulary-folders.controller";
import { VocabularyManagementService } from "./vocabulary-management.service";
import { VocabularyReviewController } from "./vocabulary-review.controller";
import { VocabularyService } from "./vocabulary.service";

@Module({
  imports: [AuthModule],
  controllers: [
    VocabularyController,
    VocabularyFoldersController,
    VocabularyReviewController,
  ],
  providers: [VocabularyService, VocabularyManagementService],
})
export class VocabularyModule {}
