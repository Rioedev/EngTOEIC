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
import type {
  VocabularyLearnSessionInput,
  VocabularyMatchResultInput,
  VocabularySetMutationInput,
  VocabularyStudySessionInput,
  VocabularyTermProgressInput,
} from "@engtoeic/shared";
import type { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/current-user.decorator";
import { OptionalSupabaseAuthGuard } from "../auth/optional-supabase-auth.guard";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { VocabularyManagementService } from "./vocabulary-management.service";
import { VocabularyService } from "./vocabulary.service";

@Controller("vocabulary-sets")
export class VocabularyController {
  constructor(
    private readonly vocabularyService: VocabularyService,
    private readonly vocabularyManagement: VocabularyManagementService,
  ) {}

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

  @Get("mine")
  @UseGuards(SupabaseAuthGuard)
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.vocabularyManagement.findMine(user);
  }

  @Get("mine/:id")
  @UseGuards(SupabaseAuthGuard)
  findMineById(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vocabularyManagement.findMineById(id, user.id);
  }

  @Post()
  @UseGuards(SupabaseAuthGuard)
  createSet(
    @Body() body: VocabularySetMutationInput,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vocabularyManagement.createSet(body, user);
  }

  @Patch(":id")
  @UseGuards(SupabaseAuthGuard)
  updateSet(
    @Param("id") id: string,
    @Body() body: VocabularySetMutationInput,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vocabularyManagement.updateSet(id, body, user);
  }

  @Delete(":id")
  @UseGuards(SupabaseAuthGuard)
  deleteSet(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.vocabularyManagement.deleteSet(id, user.id);
  }

  @Post(":slug/copy")
  @UseGuards(SupabaseAuthGuard)
  copySet(@Param("slug") slug: string, @CurrentUser() user: AuthenticatedUser) {
    return this.vocabularyManagement.copyPublicSet(slug, user);
  }

  @Get(":slug")
  @UseGuards(OptionalSupabaseAuthGuard)
  findOne(
    @Param("slug") slug: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.vocabularyService.findOne(slug, user?.id);
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
    @Body() body: VocabularyMatchResultInput,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vocabularyService.createMatchResult(slug, body, user);
  }

  @Patch(":slug/session")
  @UseGuards(SupabaseAuthGuard)
  updateStudySession(
    @Param("slug") slug: string,
    @Body() body: VocabularyStudySessionInput,
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
    @Body() body: VocabularyLearnSessionInput,
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
    @Body() body: VocabularyTermProgressInput,
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
