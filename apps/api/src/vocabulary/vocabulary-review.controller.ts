import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/current-user.decorator";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { VocabularyService } from "./vocabulary.service";

@Controller("vocabulary")
export class VocabularyReviewController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Get("review-queue")
  @UseGuards(SupabaseAuthGuard)
  findReviewQueue(
    @Query("limit") limit: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vocabularyService.findReviewQueue(user.id, limit);
  }
}
