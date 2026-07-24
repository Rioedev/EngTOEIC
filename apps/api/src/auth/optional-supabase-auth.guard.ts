import { ExecutionContext, Injectable } from "@nestjs/common";
import { SupabaseAuthGuard } from "./supabase-auth.guard";

@Injectable()
export class OptionalSupabaseAuthGuard extends SupabaseAuthGuard {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return await super.canActivate(context);
    } catch {
      return true;
    }
  }
}
