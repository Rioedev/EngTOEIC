import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { LessonsModule } from "./lessons/lessons.module";
import { PrismaModule } from "./prisma/prisma.module";
import { VocabularyModule } from "./vocabulary/vocabulary.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
    LessonsModule,
    VocabularyModule,
  ],
})
export class AppModule {}
