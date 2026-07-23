import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
};

type UpdateStudySessionBody = {
  currentTermId?: unknown;
  currentIndex?: unknown;
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
      user,
    );
  }
}
