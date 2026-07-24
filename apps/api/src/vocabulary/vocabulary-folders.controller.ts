import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/auth.types";
import { CurrentUser } from "../auth/current-user.decorator";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { VocabularyManagementService } from "./vocabulary-management.service";

@Controller("vocabulary-folders")
@UseGuards(SupabaseAuthGuard)
export class VocabularyFoldersController {
  constructor(
    private readonly vocabularyManagement: VocabularyManagementService,
  ) {}

  @Post()
  create(
    @Body() body: { name?: unknown },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vocabularyManagement.createFolder(body.name, user);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() body: { name?: unknown },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vocabularyManagement.updateFolder(id, body.name, user.id);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.vocabularyManagement.deleteFolder(id, user.id);
  }
}
