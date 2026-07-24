import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const fallbackLessons = [
  {
    id: "listening-part-2-demo",
    title: "Part 2: Question Response",
    slug: "part-2-question-response",
    description: "Demo listening lesson with audioUrl-ready questions.",
    skill: "LISTENING",
    part: "PART_2",
  },
  {
    id: "reading-part-5-demo",
    title: "Part 5: Incomplete Sentences",
    slug: "part-5-incomplete-sentences",
    description: "Demo reading lesson for grammar and vocabulary practice.",
    skill: "READING",
    part: "PART_5",
  },
];

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    try {
      return await this.prisma.lesson.findMany({
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        include: {
          _count: {
            select: {
              questions: true,
            },
          },
        },
      });
    } catch {
      return fallbackLessons;
    }
  }

  async findOne(slug: string) {
    try {
      return await this.prisma.lesson.findUnique({
        where: { slug },
        include: {
          questions: true,
        },
      });
    } catch {
      return fallbackLessons.find((lesson) => lesson.slug === slug) ?? null;
    }
  }
}
