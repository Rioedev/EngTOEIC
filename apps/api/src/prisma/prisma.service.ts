import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

  async onModuleInit() {
    if (!this.hasDatabaseUrl) {
      this.logger.warn(
        "DATABASE_URL is not set. Prisma connection is skipped until a real database is configured."
      );
      return;
    }

    await this.$connect();
  }

  async onModuleDestroy() {
    if (!this.hasDatabaseUrl) {
      return;
    }

    await this.$disconnect();
  }
}
