import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, ToeicPart, VocabularyProgressStatus } from "@prisma/client";
import { AuthService } from "../auth/auth.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";

type VocabularyListQuery = {
  page?: string;
  limit?: string;
  search?: string;
  part?: string;
};

@Injectable()
export class VocabularyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async findAll(query: VocabularyListQuery) {
    const page = this.parsePositiveInteger(query.page, 1, "page");
    const limit = Math.min(
      this.parsePositiveInteger(query.limit, 20, "limit"),
      50,
    );
    const search = query.search?.trim();
    const part = this.parsePart(query.part);

    const where: Prisma.VocabularySetWhereInput = {
      isPublished: true,
      ...(part ? { part } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { topic: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [sets, total] = await this.prisma.$transaction([
      this.prisma.vocabularySet.findMany({
        where,
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { terms: true },
          },
        },
      }),
      this.prisma.vocabularySet.count({ where }),
    ]);

    return {
      data: sets.map(({ _count, ...set }) => ({
        ...set,
        termCount: _count.terms,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(slug: string) {
    const vocabularySet = await this.prisma.vocabularySet.findFirst({
      where: {
        slug,
        isPublished: true,
      },
      include: {
        terms: {
          orderBy: [{ order: "asc" }, { term: "asc" }],
        },
      },
    });

    if (!vocabularySet) {
      throw new NotFoundException(`Vocabulary set "${slug}" was not found.`);
    }

    return {
      ...vocabularySet,
      termCount: vocabularySet.terms.length,
    };
  }

  async findProgress(slug: string, userId: string) {
    const vocabularySet = await this.findPublishedSet(slug);
    const [progress, session] = await this.prisma.$transaction([
      this.prisma.userTermProgress.findMany({
        where: {
          userId,
          term: { vocabularySetId: vocabularySet.id },
        },
        orderBy: [{ term: { order: "asc" } }, { updatedAt: "desc" }],
        select: {
          termId: true,
          status: true,
          reviewCount: true,
          lastReviewedAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.vocabularyStudySession.findUnique({
        where: {
          userId_vocabularySetId: {
            userId,
            vocabularySetId: vocabularySet.id,
          },
        },
        select: {
          currentTermId: true,
          currentIndex: true,
          lastStudiedAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      data: progress,
      session,
      summary: {
        new:
          vocabularySet._count.terms -
          progress.length +
          progress.filter(
            (item) => item.status === VocabularyProgressStatus.NEW,
          ).length,
        learning: progress.filter(
          (item) => item.status === VocabularyProgressStatus.LEARNING,
        ).length,
        familiar: progress.filter(
          (item) => item.status === VocabularyProgressStatus.FAMILIAR,
        ).length,
        mastered: progress.filter(
          (item) => item.status === VocabularyProgressStatus.MASTERED,
        ).length,
        known: progress.filter(
          (item) =>
            item.status === VocabularyProgressStatus.FAMILIAR ||
            item.status === VocabularyProgressStatus.MASTERED,
        ).length,
        total: vocabularySet._count.terms,
      },
    };
  }

  async updateStudySession(
    slug: string,
    currentTermIdValue: unknown,
    currentIndexValue: unknown,
    user: AuthenticatedUser,
  ) {
    const currentTermId = this.parseRequiredString(
      currentTermIdValue,
      "currentTermId",
    );
    const currentIndex = this.parseNonNegativeInteger(
      currentIndexValue,
      "currentIndex",
    );
    const term = await this.prisma.vocabularyTerm.findFirst({
      where: {
        id: currentTermId,
        vocabularySet: { slug, isPublished: true },
      },
      select: {
        id: true,
        vocabularySetId: true,
        vocabularySet: { select: { _count: { select: { terms: true } } } },
      },
    });

    if (!term) {
      throw new NotFoundException(
        `Vocabulary term "${currentTermId}" was not found in set "${slug}".`,
      );
    }

    if (currentIndex >= term.vocabularySet._count.terms) {
      throw new BadRequestException(
        `currentIndex must be between 0 and ${Math.max(term.vocabularySet._count.terms - 1, 0)}.`,
      );
    }

    await this.authService.syncUser(user);
    const now = new Date();

    return this.prisma.vocabularyStudySession.upsert({
      where: {
        userId_vocabularySetId: {
          userId: user.id,
          vocabularySetId: term.vocabularySetId,
        },
      },
      create: {
        userId: user.id,
        vocabularySetId: term.vocabularySetId,
        currentTermId: term.id,
        currentIndex,
        lastStudiedAt: now,
      },
      update: {
        currentTermId: term.id,
        currentIndex,
        lastStudiedAt: now,
      },
      select: {
        currentTermId: true,
        currentIndex: true,
        lastStudiedAt: true,
        updatedAt: true,
      },
    });
  }

  async updateTermProgress(
    slug: string,
    termId: string,
    statusValue: unknown,
    correctValue: unknown,
    user: AuthenticatedUser,
  ) {
    const term = await this.prisma.vocabularyTerm.findFirst({
      where: {
        id: termId,
        vocabularySet: {
          slug,
          isPublished: true,
        },
      },
      select: { id: true },
    });

    if (!term) {
      throw new NotFoundException(
        `Vocabulary term "${termId}" was not found in set "${slug}".`,
      );
    }

    await this.authService.syncUser(user);
    const currentProgress = await this.prisma.userTermProgress.findUnique({
      where: {
        userId_termId: {
          userId: user.id,
          termId: term.id,
        },
      },
      select: { status: true },
    });
    const status =
      correctValue === undefined
        ? this.parseProgressStatus(statusValue)
        : this.nextProgressStatus(
            currentProgress?.status ?? VocabularyProgressStatus.NEW,
            this.parseCorrectResult(correctValue),
          );
    const now = new Date();

    return this.prisma.userTermProgress.upsert({
      where: {
        userId_termId: {
          userId: user.id,
          termId: term.id,
        },
      },
      create: {
        userId: user.id,
        termId: term.id,
        status,
        reviewCount: 1,
        lastReviewedAt: now,
      },
      update: {
        status,
        reviewCount: { increment: 1 },
        lastReviewedAt: now,
      },
      select: {
        termId: true,
        status: true,
        reviewCount: true,
        lastReviewedAt: true,
        updatedAt: true,
      },
    });
  }

  private async findPublishedSet(slug: string) {
    const vocabularySet = await this.prisma.vocabularySet.findFirst({
      where: { slug, isPublished: true },
      select: {
        id: true,
        _count: { select: { terms: true } },
      },
    });

    if (!vocabularySet) {
      throw new NotFoundException(`Vocabulary set "${slug}" was not found.`);
    }

    return vocabularySet;
  }

  private parseProgressStatus(value: unknown) {
    if (!Object.values(VocabularyProgressStatus).includes(value as never)) {
      throw new BadRequestException(
        `status must be one of: ${Object.values(VocabularyProgressStatus).join(", ")}.`,
      );
    }

    return value as VocabularyProgressStatus;
  }

  private parseCorrectResult(value: unknown) {
    if (typeof value !== "boolean") {
      throw new BadRequestException("correct must be a boolean.");
    }

    return value;
  }

  private nextProgressStatus(
    current: VocabularyProgressStatus,
    correct: boolean,
  ) {
    if (correct) {
      if (current === VocabularyProgressStatus.NEW) {
        return VocabularyProgressStatus.LEARNING;
      }
      if (current === VocabularyProgressStatus.LEARNING) {
        return VocabularyProgressStatus.FAMILIAR;
      }
      return VocabularyProgressStatus.MASTERED;
    }

    if (current === VocabularyProgressStatus.MASTERED) {
      return VocabularyProgressStatus.FAMILIAR;
    }
    if (current === VocabularyProgressStatus.FAMILIAR) {
      return VocabularyProgressStatus.LEARNING;
    }
    return VocabularyProgressStatus.LEARNING;
  }

  private parseRequiredString(value: unknown, field: string) {
    if (typeof value !== "string" || !value.trim()) {
      throw new BadRequestException(`${field} must be a non-empty string.`);
    }

    return value.trim();
  }

  private parseNonNegativeInteger(value: unknown, field: string) {
    if (!Number.isInteger(value) || (value as number) < 0) {
      throw new BadRequestException(`${field} must be a non-negative integer.`);
    }

    return value as number;
  }

  private parsePositiveInteger(
    value: string | undefined,
    fallback: number,
    field: string,
  ) {
    if (value === undefined) {
      return fallback;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new BadRequestException(`${field} must be a positive integer.`);
    }

    return parsed;
  }

  private parsePart(value: string | undefined) {
    if (!value) {
      return undefined;
    }

    if (!Object.values(ToeicPart).includes(value as ToeicPart)) {
      throw new BadRequestException(
        `part must be one of: ${Object.values(ToeicPart).join(", ")}.`,
      );
    }

    return value as ToeicPart;
  }
}
