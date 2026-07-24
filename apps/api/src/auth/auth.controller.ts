import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import type { UpdateUserProfileInput } from "@engtoeic/shared";
import { AuthService } from "./auth.service";
import type { AuthenticatedUser } from "./auth.types";
import { CurrentUser } from "./current-user.decorator";
import { SupabaseAuthGuard } from "./supabase-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("sync")
  @UseGuards(SupabaseAuthGuard)
  sync(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.syncUser(user);
  }

  @Get("profile")
  @UseGuards(SupabaseAuthGuard)
  profile(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user);
  }

  @Patch("profile")
  @UseGuards(SupabaseAuthGuard)
  updateProfile(
    @Body() body: UpdateUserProfileInput,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.authService.updateProfile(body, user);
  }
}
