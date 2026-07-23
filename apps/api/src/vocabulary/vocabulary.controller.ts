import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/current-user.decorator";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { VocabularyService } from "./vocabulary.service";

type UpdateTermProgressBody = {
  status?: unknown;
  correct?: unknown;
  rating?: unknown;
};

type UpdateStudySessionBody = {
  currentTermId?: unknown;
  currentIndex?: unknown;
};

type UpdateLearnSessionBody = {
  studyMode?: unknown;
  targetCount?: unknown;
  queueTermIds?: unknown;
  currentIndex?: unknown;
  correctCount?: unknown;
  wrongCount?: unknown;
  wrongTermIds?: unknown;
};

type CreateMatchResultBody = {
  durationMs?: unknown;
  moves?: unknown;
  mistakes?: unknown;
  pairCount?: unknown;
};

@Controller("vocabulary-sets")
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Get()
  findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("part") part?: string,
  ) {
    return this.vocabularyService.findAll({ page, limit, search, part });
  }

  @Get("review-schedule")
  @UseGuards(SupabaseAuthGuard)
  findReviewSchedule(@CurrentUser() user: AuthenticatedUser) {
    return this.vocabularyService.findReviewSchedule(user.id);
  }

  @Get(":slug")
  findOne(@Param("slug") slug: string) {
    return this.vocabularyService.findOne(slug);
  }

  @Get(":slug/progress")
  @UseGuards(SupabaseAuthGuard)
  findProgress(
    @Param("slug") slug: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vocabularyService.findProgress(slug, user.id);
  }

  @Get(":slug/match-results")
  @UseGuards(SupabaseAuthGuard)
  findMatchResults(
    @Param("slug") slug: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vocabularyService.findMatchResults(slug, user.id);
  }

  @Post(":slug/match-results")
  @UseGuards(SupabaseAuthGuard)
  createMatchResult(
    @Param("slug") slug: string,
    @Body() body: CreateMatchResultBody,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vocabularyService.createMatchResult(slug, body, user);
  }

  @Patch(":slug/session")
  @UseGuards(SupabaseAuthGuard)
  updateStudySession(
    @Param("slug") slug: string,
    @Body() body: UpdateStudySessionBody,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vocabularyService.updateStudySession(
      slug,
      body.currentTermId,
      body.currentIndex,
      user,
    );
  }

  @Patch(":slug/learn-session")
  @UseGuards(SupabaseAuthGuard)
  updateLearnSession(
    @Param("slug") slug: string,
    @Body() body: UpdateLearnSessionBody,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vocabularyService.updateLearnSession(slug, body, user);
  }

  @Delete(":slug/learn-session")
  @UseGuards(SupabaseAuthGuard)
  clearLearnSession(
    @Param("slug") slug: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vocabularyService.clearLearnSession(slug, user);
  }

  @Patch(":slug/terms/:termId/progress")
  @UseGuards(SupabaseAuthGuard)
  updateTermProgress(
    @Param("slug") slug: string,
    @Param("termId") termId: string,
    @Body() body: UpdateTermProgressBody,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vocabularyService.updateTermProgress(
      slug,
      termId,
      body.status,
      body.correct,
      body.rating,
      user,
    );
  }
}
