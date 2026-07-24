import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthenticatedUser } from "./auth.types";

const profileSelect = {
  id: true,
  email: true,
  displayName: true,
  avatarUrl: true,
  targetScore: true,
  examDate: true,
  dailyStudyMinutes: true,
  language: true,
  audioAutoplay: true,
  audioVolume: true,
  audioPlaybackRate: true,
  reduceMotion: true,
  highContrast: true,
  largeText: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

type ProfileValues = {
  displayName?: unknown;
  avatarUrl?: unknown;
  targetScore?: unknown;
  examDate?: unknown;
  dailyStudyMinutes?: unknown;
  language?: unknown;
  audioAutoplay?: unknown;
  audioVolume?: unknown;
  audioPlaybackRate?: unknown;
  reduceMotion?: unknown;
  highContrast?: unknown;
  largeText?: unknown;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  syncUser(authUser: AuthenticatedUser) {
    return this.prisma.user.upsert({
      where: { id: authUser.id },
      update: {
        email: authUser.email,
      },
      create: {
        id: authUser.id,
        email: authUser.email,
        displayName: authUser.displayName,
        avatarUrl: authUser.avatarUrl,
      },
      select: profileSelect,
    });
  }

  async getProfile(authUser: AuthenticatedUser) {
    return this.syncUser(authUser);
  }

  async updateProfile(values: ProfileValues, authUser: AuthenticatedUser) {
    await this.syncUser(authUser);

    return this.prisma.user.update({
      where: { id: authUser.id },
      data: {
        displayName: this.parseDisplayName(values.displayName),
        avatarUrl: this.parseAvatarUrl(values.avatarUrl),
        targetScore: this.parseNullableInteger(
          values.targetScore,
          "targetScore",
          10,
          990,
        ),
        examDate: this.parseExamDate(values.examDate),
        dailyStudyMinutes: this.parseInteger(
          values.dailyStudyMinutes,
          "dailyStudyMinutes",
          5,
          480,
        ),
        language: this.parseLanguage(values.language),
        audioAutoplay: this.parseBoolean(values.audioAutoplay, "audioAutoplay"),
        audioVolume: this.parseInteger(
          values.audioVolume,
          "audioVolume",
          0,
          100,
        ),
        audioPlaybackRate: this.parsePlaybackRate(values.audioPlaybackRate),
        reduceMotion: this.parseBoolean(values.reduceMotion, "reduceMotion"),
        highContrast: this.parseBoolean(values.highContrast, "highContrast"),
        largeText: this.parseBoolean(values.largeText, "largeText"),
      },
      select: profileSelect,
    });
  }

  private parseDisplayName(value: unknown) {
    if (typeof value !== "string") {
      throw new BadRequestException("displayName must be a string.");
    }
    const normalized = value.trim().replace(/\s+/g, " ");
    if (normalized.length < 2 || normalized.length > 80) {
      throw new BadRequestException(
        "displayName must contain between 2 and 80 characters.",
      );
    }
    return normalized;
  }

  private parseAvatarUrl(value: unknown) {
    if (value === null || value === "") return null;
    if (typeof value !== "string" || value.length > 1_500_000) {
      throw new BadRequestException("avatarUrl is invalid or too large.");
    }
    if (/^data:image\/(png|jpeg|webp);base64,/i.test(value)) {
      return value;
    }
    try {
      const url = new URL(value);
      if (url.protocol !== "https:") throw new Error("Invalid protocol");
      return url.toString();
    } catch {
      throw new BadRequestException(
        "avatarUrl must be an HTTPS URL or a supported image.",
      );
    }
  }

  private parseNullableInteger(
    value: unknown,
    field: string,
    minimum: number,
    maximum: number,
  ) {
    if (value === null || value === "") return null;
    return this.parseInteger(value, field, minimum, maximum);
  }

  private parseInteger(
    value: unknown,
    field: string,
    minimum: number,
    maximum: number,
  ) {
    if (
      !Number.isInteger(value) ||
      (value as number) < minimum ||
      (value as number) > maximum
    ) {
      throw new BadRequestException(
        `${field} must be an integer between ${minimum} and ${maximum}.`,
      );
    }
    return value as number;
  }

  private parseExamDate(value: unknown) {
    if (value === null || value === "") return null;
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException("examDate must use YYYY-MM-DD format.");
    }
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException("examDate is invalid.");
    }
    return date;
  }

  private parseLanguage(value: unknown) {
    if (value !== "vi" && value !== "en") {
      throw new BadRequestException("language must be vi or en.");
    }
    return value;
  }

  private parseBoolean(value: unknown, field: string) {
    if (typeof value !== "boolean") {
      throw new BadRequestException(`${field} must be a boolean.`);
    }
    return value;
  }

  private parsePlaybackRate(value: unknown) {
    if (typeof value !== "number" || ![0.75, 1, 1.25].includes(value)) {
      throw new BadRequestException(
        "audioPlaybackRate must be 0.75, 1, or 1.25.",
      );
    }
    return value;
  }
}
