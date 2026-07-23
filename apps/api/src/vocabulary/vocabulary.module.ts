import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { VocabularyController } from "./vocabulary.controller";
import { VocabularyReviewController } from "./vocabulary-review.controller";
import { VocabularyService } from "./vocabulary.service";

@Module({
  imports: [AuthModule],
  controllers: [VocabularyController, VocabularyReviewController],
  providers: [VocabularyService],
})
export class VocabularyModule {}
