import { Controller, Post, UseGuards } from "@nestjs/common";
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
}
