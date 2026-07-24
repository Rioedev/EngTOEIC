import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { OptionalSupabaseAuthGuard } from "./optional-supabase-auth.guard";
import { SupabaseAuthGuard } from "./supabase-auth.guard";

@Module({
  controllers: [AuthController],
  providers: [AuthService, SupabaseAuthGuard, OptionalSupabaseAuthGuard],
  exports: [AuthService, SupabaseAuthGuard, OptionalSupabaseAuthGuard],
})
export class AuthModule {}
