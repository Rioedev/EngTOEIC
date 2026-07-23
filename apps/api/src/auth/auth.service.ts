import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthenticatedUser } from "./auth.types";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  syncUser(authUser: AuthenticatedUser) {
    return this.prisma.user.upsert({
      where: { id: authUser.id },
      update: {
        email: authUser.email,
        displayName: authUser.displayName,
        avatarUrl: authUser.avatarUrl
      },
      create: {
        id: authUser.id,
        email: authUser.email,
        displayName: authUser.displayName,
        avatarUrl: authUser.avatarUrl
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }
}
