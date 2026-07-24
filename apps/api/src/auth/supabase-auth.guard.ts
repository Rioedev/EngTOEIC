import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import type { AuthenticatedUser, SupabaseJwtPayload } from "./auth.types";

type AuthenticatedRequest = {
  headers: { authorization?: string };
  authUser?: AuthenticatedUser;
};

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private jwks: JWTVerifyGetKey | undefined;

  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.readBearerToken(request.headers.authorization);
    const supabaseUrl = this.config
      .get<string>("SUPABASE_URL")
      ?.replace(/\/$/, "");
    const jwksUrl = this.config.get<string>("SUPABASE_JWKS_URL");

    if (!supabaseUrl || !jwksUrl) {
      throw new ServiceUnavailableException("Supabase Auth chưa được cấu hình");
    }

    try {
      this.jwks ??= createRemoteJWKSet(new URL(jwksUrl));
      const { payload } = await jwtVerify(token, this.jwks, {
        audience: "authenticated",
        issuer: `${supabaseUrl}/auth/v1`,
      });
      const claims = payload as SupabaseJwtPayload;

      if (!claims.sub || !claims.email) {
        throw new UnauthorizedException(
          "Token không chứa thông tin người dùng hợp lệ",
        );
      }

      request.authUser = {
        id: claims.sub,
        email: claims.email,
        displayName:
          claims.user_metadata?.full_name ?? claims.user_metadata?.name ?? null,
        avatarUrl: claims.user_metadata?.avatar_url ?? null,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException(
        "Access token không hợp lệ hoặc đã hết hạn",
      );
    }
  }

  private readBearerToken(authorization?: string): string {
    const [scheme, token] = authorization?.split(" ") ?? [];

    if (scheme?.toLowerCase() !== "bearer" || !token) {
      throw new UnauthorizedException("Thiếu Bearer access token");
    }

    return token;
  }
}
