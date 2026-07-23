import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  Prisma,
  ToeicPart,
  VocabularyProgressStatus,
  VocabularyReviewRating,
} from "@prisma/client";
import { AuthService } from "../auth/auth.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";
import {
  calculateRetentionRate,
  calculateSpacedRepetition,
  DEFAULT_EASE_FACTOR,
  isReviewEligible,
} from "./spaced-repetition";

type VocabularyListQuery = {
  page?: string;
  limit?: string;
  search?: string;
  part?: string;
};

const learnStudyModes = new Set([
  "mixed",
  "match",
  "dictation",
  "multiple-choice",
  "write",
  "true-false",
]);

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

  async findReviewSchedule(userId: string) {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const scheduledWhere: Prisma.UserTermProgressWhereInput = {
      userId,
      nextReviewAt: { not: null },
      term: { vocabularySet: { isPublished: true } },
    };
    const [
      scheduledCount,
      dueNowCount,
      dueNextSevenDaysCount,
      progressStats,
      scheduledItems,
    ] = await this.prisma.$transaction([
      this.prisma.userTermProgress.count({ where: scheduledWhere }),
      this.prisma.userTermProgress.count({
        where: {
          ...scheduledWhere,
          nextReviewAt: { lte: now },
        },
      }),
      this.prisma.userTermProgress.count({
        where: {
          ...scheduledWhere,
          nextReviewAt: {
            gt: now,
            lte: sevenDaysFromNow,
          },
        },
      }),
      this.prisma.userTermProgress.aggregate({
        where: {
          userId,
          reviewCount: { gt: 0 },
          term: { vocabularySet: { isPublished: true } },
        },
        _count: { _all: true },
        _sum: {
          reviewCount: true,
          lapseCount: true,
        },
      }),
      this.prisma.userTermProgress.findMany({
        where: scheduledWhere,
        orderBy: [{ nextReviewAt: "asc" }, { updatedAt: "asc" }],
        take: 4,
        select: {
          termId: true,
          status: true,
          nextReviewAt: true,
          term: {
            select: {
              term: true,
              meaningVi: true,
              vocabularySet: {
                select: {
                  slug: true,
                  title: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const totalReviews = progressStats._sum.reviewCount ?? 0;
    const totalLapses = progressStats._sum.lapseCount ?? 0;

    return {
      summary: {
        scheduled: scheduledCount,
        dueNow: dueNowCount,
        dueNext7Days: dueNextSevenDaysCount,
        nextReviewAt: scheduledItems[0]?.nextReviewAt ?? null,
        retentionRate: calculateRetentionRate(totalReviews, totalLapses),
        reviewedTerms: progressStats._count._all,
        totalReviews,
        totalLapses,
      },
      items: scheduledItems.map((item) => ({
        termId: item.termId,
        term: item.term.term,
        meaningVi: item.term.meaningVi,
        status: item.status,
        nextReviewAt: item.nextReviewAt,
        setSlug: item.term.vocabularySet.slug,
        setTitle: item.term.vocabularySet.title,
      })),
    };
  }

  async findReviewQueue(userId: string, limitValue?: string) {
    const limit = Math.min(
      this.parsePositiveInteger(limitValue, 20, "limit"),
      50,
    );
    const now = new Date();
    const dueWhere: Prisma.UserTermProgressWhereInput = {
      userId,
      nextReviewAt: { lte: now },
      term: { vocabularySet: { isPublished: true } },
    };
    const [progressItems, total] = await this.prisma.$transaction([
      this.prisma.userTermProgress.findMany({
        where: dueWhere,
        orderBy: [{ nextReviewAt: "asc" }, { lastReviewedAt: "asc" }],
        take: limit,
        select: {
          status: true,
          lastRating: true,
          easeFactor: true,
          intervalDays: true,
          repetitionCount: true,
          lapseCount: true,
          reviewCount: true,
          lastReviewedAt: true,
          nextReviewAt: true,
          term: {
            select: {
              id: true,
              term: true,
              meaningVi: true,
              ipa: true,
              partOfSpeech: true,
              audioUrl: true,
              exampleEn: true,
              exampleVi: true,
              imageUrl: true,
              collocations: true,
              synonyms: true,
              antonyms: true,
              sourceName: true,
              sourceUrl: true,
              sourceLicense: true,
              sourceExternalId: true,
              order: true,
              vocabularySet: {
                select: {
                  slug: true,
                  title: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.userTermProgress.count({ where: dueWhere }),
    ]);

    return {
      data: progressItems.map((item) => {
        const { vocabularySet, ...term } = item.term;
        return {
          term,
          set: vocabularySet,
          progress: {
            status: item.status,
            lastRating: item.lastRating,
            easeFactor: item.easeFactor,
            intervalDays: item.intervalDays,
            repetitionCount: item.repetitionCount,
            lapseCount: item.lapseCount,
            reviewCount: item.reviewCount,
            lastReviewedAt: item.lastReviewedAt,
            nextReviewAt: item.nextReviewAt,
          },
        };
      }),
      meta: {
        total,
        limit,
        generatedAt: now,
      },
    };
  }

  async findProgress(slug: string, userId: string) {
    const vocabularySet = await this.findPublishedSet(slug);
    const checkpointCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [progress, session, learnSession] = await this.prisma.$transaction([
      this.prisma.userTermProgress.findMany({
        where: {
          userId,
          term: { vocabularySetId: vocabularySet.id },
        },
        orderBy: [{ term: { order: "asc" } }, { updatedAt: "desc" }],
        select: {
          termId: true,
          status: true,
          lastRating: true,
          easeFactor: true,
          intervalDays: true,
          repetitionCount: true,
          lapseCount: true,
          reviewCount: true,
          lastReviewedAt: true,
          nextReviewAt: true,
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
      this.prisma.vocabularyLearnSession.findFirst({
        where: {
          userId,
          vocabularySetId: vocabularySet.id,
          lastStudiedAt: { gte: checkpointCutoff },
        },
        select: {
          studyMode: true,
          targetCount: true,
          queueTermIds: true,
          currentIndex: true,
          correctCount: true,
          wrongCount: true,
          wrongTermIds: true,
          lastStudiedAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      data: progress,
      session,
      learnSession,
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
    ratingValue: unknown,
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

    const submittedResultCount = [
      statusValue,
      correctValue,
      ratingValue,
    ].filter((value) => value !== undefined).length;
    if (submittedResultCount !== 1) {
      throw new BadRequestException(
        "Provide exactly one of status, correct, or rating.",
      );
    }

    const rating =
      ratingValue === undefined
        ? undefined
        : this.parseReviewRating(ratingValue);
    const correct =
      correctValue === undefined
        ? undefined
        : this.parseCorrectResult(correctValue);
    const requestedStatus =
      rating === undefined && correct === undefined
        ? this.parseProgressStatus(statusValue)
        : undefined;

    await this.authService.syncUser(user);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (transaction) => {
            const now = new Date();
            const currentProgress =
              await transaction.userTermProgress.findUnique({
                where: {
                  userId_termId: {
                    userId: user.id,
                    termId: term.id,
                  },
                },
                select: {
                  termId: true,
                  status: true,
                  lastRating: true,
                  easeFactor: true,
                  intervalDays: true,
                  repetitionCount: true,
                  lapseCount: true,
                  reviewCount: true,
                  lastReviewedAt: true,
                  nextReviewAt: true,
                  updatedAt: true,
                },
              });

            if (
              currentProgress &&
              !isReviewEligible(currentProgress.nextReviewAt, now)
            ) {
              return {
                ...currentProgress,
                reviewAccepted: false,
                nextEligibleAt: currentProgress.nextReviewAt,
              };
            }

            const currentStatus =
              currentProgress?.status ?? VocabularyProgressStatus.NEW;
            const status =
              rating !== undefined
                ? this.nextProgressStatusForRating(currentStatus, rating)
                : correct !== undefined
                  ? this.nextProgressStatus(currentStatus, correct)
                  : requestedStatus!;
            const schedulingRating =
              rating ??
              (correct !== undefined
                ? correct
                  ? VocabularyReviewRating.GOOD
                  : VocabularyReviewRating.AGAIN
                : this.reviewRatingForStatus(status));
            const schedule = calculateSpacedRepetition(
              {
                easeFactor: currentProgress?.easeFactor ?? DEFAULT_EASE_FACTOR,
                intervalDays: currentProgress?.intervalDays ?? 0,
                repetitionCount: currentProgress?.repetitionCount ?? 0,
                lapseCount: currentProgress?.lapseCount ?? 0,
              },
              schedulingRating,
              now,
            );

            const savedProgress = await transaction.userTermProgress.upsert({
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
                lastRating: rating,
                easeFactor: schedule.easeFactor,
                intervalDays: schedule.intervalDays,
                repetitionCount: schedule.repetitionCount,
                lapseCount: schedule.lapseCount,
                reviewCount: 1,
                lastReviewedAt: now,
                nextReviewAt: schedule.nextReviewAt,
              },
              update: {
                status,
                ...(rating ? { lastRating: rating } : {}),
                easeFactor: schedule.easeFactor,
                intervalDays: schedule.intervalDays,
                repetitionCount: schedule.repetitionCount,
                lapseCount: schedule.lapseCount,
                reviewCount: { increment: 1 },
                lastReviewedAt: now,
                nextReviewAt: schedule.nextReviewAt,
              },
              select: {
                termId: true,
                status: true,
                lastRating: true,
                easeFactor: true,
                intervalDays: true,
                repetitionCount: true,
                lapseCount: true,
                reviewCount: true,
                lastReviewedAt: true,
                nextReviewAt: true,
                updatedAt: true,
              },
            });

            return {
              ...savedProgress,
              reviewAccepted: true,
              nextEligibleAt: savedProgress.nextReviewAt,
            };
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error) {
        const transactionConflict =
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P2034";
        if (!transactionConflict || attempt === 2) throw error;
      }
    }

    throw new Error("Could not update vocabulary progress.");
  }

  async updateLearnSession(
    slug: string,
    values: {
      studyMode?: unknown;
      targetCount?: unknown;
      queueTermIds?: unknown;
      currentIndex?: unknown;
      correctCount?: unknown;
      wrongCount?: unknown;
      wrongTermIds?: unknown;
    },
    user: AuthenticatedUser,
  ) {
    const vocabularySet = await this.findPublishedSet(slug);
    const studyMode = this.parseLearnStudyMode(values.studyMode);
    const targetCount = this.parsePositiveNumber(
      values.targetCount,
      "targetCount",
    );
    const queueTermIds = this.parseStringArray(
      values.queueTermIds,
      "queueTermIds",
      false,
    );
    const currentIndex = this.parseNonNegativeInteger(
      values.currentIndex,
      "currentIndex",
    );
    const correctCount = this.parseNonNegativeInteger(
      values.correctCount,
      "correctCount",
    );
    const wrongCount = this.parseNonNegativeInteger(
      values.wrongCount,
      "wrongCount",
    );
    const wrongTermIds = this.parseStringArray(
      values.wrongTermIds,
      "wrongTermIds",
      true,
    );

    if (studyMode === "match") {
      throw new BadRequestException(
        "Match sessions are round-based and do not support checkpoints.",
      );
    }
    if (targetCount > vocabularySet._count.terms) {
      throw new BadRequestException(
        `targetCount must not exceed ${vocabularySet._count.terms}.`,
      );
    }
    if (queueTermIds.length > 500) {
      throw new BadRequestException(
        "queueTermIds must contain at most 500 items.",
      );
    }
    if (currentIndex >= queueTermIds.length) {
      throw new BadRequestException(
        "currentIndex must point to an item inside queueTermIds.",
      );
    }

    const uniqueQueueTermIds = [...new Set(queueTermIds)];
    const validTermCount = await this.prisma.vocabularyTerm.count({
      where: {
        id: { in: uniqueQueueTermIds },
        vocabularySetId: vocabularySet.id,
      },
    });
    if (validTermCount !== uniqueQueueTermIds.length) {
      throw new BadRequestException(
        "Every queueTermId must belong to the selected vocabulary set.",
      );
    }

    const queueTermIdSet = new Set(uniqueQueueTermIds);
    if (wrongTermIds.some((termId) => !queueTermIdSet.has(termId))) {
      throw new BadRequestException(
        "Every wrongTermId must also exist in queueTermIds.",
      );
    }

    await this.authService.syncUser(user);
    const now = new Date();
    return this.prisma.vocabularyLearnSession.upsert({
      where: {
        userId_vocabularySetId: {
          userId: user.id,
          vocabularySetId: vocabularySet.id,
        },
      },
      create: {
        userId: user.id,
        vocabularySetId: vocabularySet.id,
        studyMode,
        targetCount,
        queueTermIds,
        currentIndex,
        correctCount,
        wrongCount,
        wrongTermIds: [...new Set(wrongTermIds)],
        lastStudiedAt: now,
      },
      update: {
        studyMode,
        targetCount,
        queueTermIds,
        currentIndex,
        correctCount,
        wrongCount,
        wrongTermIds: [...new Set(wrongTermIds)],
        lastStudiedAt: now,
      },
      select: {
        studyMode: true,
        targetCount: true,
        queueTermIds: true,
        currentIndex: true,
        correctCount: true,
        wrongCount: true,
        wrongTermIds: true,
        lastStudiedAt: true,
        updatedAt: true,
      },
    });
  }

  async clearLearnSession(slug: string, user: AuthenticatedUser) {
    const vocabularySet = await this.findPublishedSet(slug);
    const result = await this.prisma.vocabularyLearnSession.deleteMany({
      where: {
        userId: user.id,
        vocabularySetId: vocabularySet.id,
      },
    });

    return { cleared: result.count > 0 };
  }

  async findMatchResults(slug: string, userId: string) {
    const vocabularySet = await this.findPublishedSet(slug);
    const where = {
      userId,
      vocabularySetId: vocabularySet.id,
    };
    const [results, totalPlays, latestResult] = await this.prisma.$transaction([
      this.prisma.vocabularyMatchResult.findMany({
        where,
        orderBy: [
          { durationMs: "asc" },
          { mistakes: "asc" },
          { moves: "asc" },
          { createdAt: "desc" },
        ],
        take: 10,
        select: {
          id: true,
          durationMs: true,
          moves: true,
          mistakes: true,
          pairCount: true,
          createdAt: true,
        },
      }),
      this.prisma.vocabularyMatchResult.count({ where }),
      this.prisma.vocabularyMatchResult.findFirst({
        where,
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    return {
      data: results.map((result, index) => ({
        ...result,
        rank: index + 1,
      })),
      summary: {
        totalPlays,
        bestDurationMs: results[0]?.durationMs ?? null,
        bestMoves: results[0]?.moves ?? null,
        lastPlayedAt: latestResult?.createdAt ?? null,
      },
    };
  }

  async createMatchResult(
    slug: string,
    values: {
      durationMs?: unknown;
      moves?: unknown;
      mistakes?: unknown;
      pairCount?: unknown;
    },
    user: AuthenticatedUser,
  ) {
    const vocabularySet = await this.findPublishedSet(slug);
    const durationMs = this.parsePositiveNumber(
      values.durationMs,
      "durationMs",
    );
    const moves = this.parsePositiveNumber(values.moves, "moves");
    const mistakes = this.parseNonNegativeInteger(values.mistakes, "mistakes");
    const pairCount = this.parsePositiveNumber(values.pairCount, "pairCount");

    if (durationMs > 60 * 60 * 1000) {
      throw new BadRequestException("durationMs must not exceed one hour.");
    }
    if (pairCount > 6 || pairCount > vocabularySet._count.terms) {
      throw new BadRequestException(
        `pairCount must not exceed ${Math.min(6, vocabularySet._count.terms)}.`,
      );
    }
    if (moves < pairCount) {
      throw new BadRequestException(
        "moves must be greater than or equal to pairCount.",
      );
    }
    if (mistakes > moves - pairCount) {
      throw new BadRequestException(
        "mistakes cannot exceed the number of unsuccessful moves.",
      );
    }

    await this.authService.syncUser(user);
    const result = await this.prisma.vocabularyMatchResult.create({
      data: {
        userId: user.id,
        vocabularySetId: vocabularySet.id,
        durationMs,
        moves,
        mistakes,
        pairCount,
      },
      select: { id: true },
    });
    const leaderboard = await this.findMatchResults(slug, user.id);

    return {
      ...leaderboard,
      latestResultId: result.id,
    };
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

  private parseReviewRating(value: unknown) {
    if (!Object.values(VocabularyReviewRating).includes(value as never)) {
      throw new BadRequestException(
        `rating must be one of: ${Object.values(VocabularyReviewRating).join(", ")}.`,
      );
    }

    return value as VocabularyReviewRating;
  }

  private parseLearnStudyMode(value: unknown) {
    if (typeof value !== "string" || !learnStudyModes.has(value)) {
      throw new BadRequestException(
        `studyMode must be one of: ${[...learnStudyModes].join(", ")}.`,
      );
    }
    return value;
  }

  private parseStringArray(value: unknown, field: string, allowEmpty: boolean) {
    if (
      !Array.isArray(value) ||
      (!allowEmpty && value.length === 0) ||
      value.some((item) => typeof item !== "string" || !item.trim())
    ) {
      throw new BadRequestException(
        `${field} must be ${allowEmpty ? "an" : "a non-empty"} array of strings.`,
      );
    }
    return value.map((item) => (item as string).trim());
  }

  private parsePositiveNumber(value: unknown, field: string) {
    if (!Number.isInteger(value) || (value as number) < 1) {
      throw new BadRequestException(`${field} must be a positive integer.`);
    }
    return value as number;
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

  private nextProgressStatusForRating(
    current: VocabularyProgressStatus,
    rating: VocabularyReviewRating,
  ) {
    if (rating === VocabularyReviewRating.AGAIN) {
      return this.nextProgressStatus(current, false);
    }
    if (rating === VocabularyReviewRating.HARD) {
      return current === VocabularyProgressStatus.NEW
        ? VocabularyProgressStatus.LEARNING
        : current;
    }
    if (rating === VocabularyReviewRating.EASY) {
      return VocabularyProgressStatus.MASTERED;
    }
    return this.nextProgressStatus(current, true);
  }

  private reviewRatingForStatus(status: VocabularyProgressStatus) {
    if (status === VocabularyProgressStatus.NEW) {
      return VocabularyReviewRating.AGAIN;
    }
    if (status === VocabularyProgressStatus.LEARNING) {
      return VocabularyReviewRating.HARD;
    }
    if (status === VocabularyProgressStatus.FAMILIAR) {
      return VocabularyReviewRating.GOOD;
    }
    return VocabularyReviewRating.EASY;
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
