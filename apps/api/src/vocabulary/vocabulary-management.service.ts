import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  VocabularySetMutationInput,
  VocabularyTermMutationInput,
} from "@engtoeic/shared";
import { Prisma, ToeicPart, VocabularySetVisibility } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { AuthService } from "../auth/auth.service";
import type { AuthenticatedUser } from "../auth/auth.types";
import { PrismaService } from "../prisma/prisma.service";

const editableTermSelect = {
  id: true,
  term: true,
  meaningVi: true,
  ipa: true,
  partOfSpeech: true,
  exampleEn: true,
  exampleVi: true,
  order: true,
} satisfies Prisma.VocabularyTermSelect;

@Injectable()
export class VocabularyManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async findMine(user: AuthenticatedUser) {
    await this.authService.syncUser(user);
    const [folders, sets] = await this.prisma.$transaction([
      this.prisma.vocabularyFolder.findMany({
        where: { userId: user.id },
        orderBy: [{ order: "asc" }, { name: "asc" }],
        include: { _count: { select: { sets: true } } },
      }),
      this.prisma.vocabularySet.findMany({
        where: { ownerId: user.id },
        orderBy: { updatedAt: "desc" },
        include: {
          folder: { select: { id: true, name: true } },
          _count: { select: { terms: true } },
        },
      }),
    ]);

    return {
      folders: folders.map(({ _count, ...folder }) => ({
        ...folder,
        setCount: _count.sets,
      })),
      sets: sets.map(({ _count, ...set }) => ({
        ...set,
        termCount: _count.terms,
      })),
    };
  }

  async findMineById(id: string, userId: string) {
    const vocabularySet = await this.prisma.vocabularySet.findFirst({
      where: { id, ownerId: userId },
      include: {
        folder: { select: { id: true, name: true } },
        terms: {
          orderBy: [{ order: "asc" }, { term: "asc" }],
          select: editableTermSelect,
        },
      },
    });

    if (!vocabularySet) {
      throw new NotFoundException("Không tìm thấy bộ từ cá nhân.");
    }

    return { ...vocabularySet, termCount: vocabularySet.terms.length };
  }

  async createSet(values: VocabularySetMutationInput, user: AuthenticatedUser) {
    await this.authService.syncUser(user);
    const input = this.parseSetInput(values);
    await this.assertFolderOwnership(input.folderId, user.id);
    const slug = await this.createUniqueSlug(input.title);

    const vocabularySet = await this.prisma.vocabularySet.create({
      data: {
        title: input.title,
        slug,
        description: input.description,
        topic: input.topic,
        part: input.part,
        difficulty: input.difficulty,
        visibility: input.visibility,
        folderId: input.folderId,
        ownerId: user.id,
        isPublished: true,
        terms: {
          create: input.terms.map(({ id: _id, ...term }, index) => ({
            ...term,
            order: index + 1,
          })),
        },
      },
      select: { id: true },
    });

    return this.findMineById(vocabularySet.id, user.id);
  }

  async updateSet(
    id: string,
    values: VocabularySetMutationInput,
    user: AuthenticatedUser,
  ) {
    const currentSet = await this.findOwnedSet(id, user.id);
    const input = this.parseSetInput(values);
    await this.assertFolderOwnership(input.folderId, user.id);

    const requestedIds = input.terms
      .map((term) => term.id)
      .filter((termId): termId is string => Boolean(termId));
    const ownedTermCount = requestedIds.length
      ? await this.prisma.vocabularyTerm.count({
          where: { id: { in: requestedIds }, vocabularySetId: currentSet.id },
        })
      : 0;

    if (ownedTermCount !== requestedIds.length) {
      throw new BadRequestException(
        "Danh sách chứa từ không thuộc bộ từ đang chỉnh sửa.",
      );
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.vocabularySet.update({
        where: { id: currentSet.id },
        data: {
          title: input.title,
          description: input.description,
          topic: input.topic,
          part: input.part,
          difficulty: input.difficulty,
          visibility: input.visibility,
          folderId: input.folderId,
        },
      });

      await transaction.vocabularyTerm.deleteMany({
        where: {
          vocabularySetId: currentSet.id,
          ...(requestedIds.length ? { id: { notIn: requestedIds } } : {}),
        },
      });

      for (const [index, term] of input.terms.entries()) {
        const { id: termId, ...termData } = term;
        if (termId) {
          await transaction.vocabularyTerm.update({
            where: { id: termId },
            data: { ...termData, order: index + 1 },
          });
        } else {
          await transaction.vocabularyTerm.create({
            data: {
              vocabularySetId: currentSet.id,
              ...termData,
              order: index + 1,
            },
          });
        }
      }
    });

    return this.findMineById(currentSet.id, user.id);
  }

  async deleteSet(id: string, userId: string) {
    const vocabularySet = await this.findOwnedSet(id, userId);
    await this.prisma.vocabularySet.delete({ where: { id: vocabularySet.id } });
    return { deleted: true, id: vocabularySet.id };
  }

  async copyPublicSet(slug: string, user: AuthenticatedUser) {
    const source = await this.prisma.vocabularySet.findFirst({
      where: {
        slug,
        isPublished: true,
        visibility: VocabularySetVisibility.PUBLIC,
      },
      include: {
        terms: { orderBy: [{ order: "asc" }, { term: "asc" }] },
      },
    });

    if (!source) {
      throw new NotFoundException(
        "Không tìm thấy bộ từ công khai để sao chép.",
      );
    }

    await this.authService.syncUser(user);
    const title = `${source.title} — Bản sao`;
    const slugCopy = await this.createUniqueSlug(title);
    const copiedSet = await this.prisma.vocabularySet.create({
      data: {
        title,
        slug: slugCopy,
        description: source.description,
        topic: source.topic,
        part: source.part,
        difficulty: source.difficulty,
        imageUrl: source.imageUrl,
        isPublished: true,
        visibility: VocabularySetVisibility.PRIVATE,
        ownerId: user.id,
        copiedFromId: source.id,
        terms: {
          create: source.terms.map(
            ({
              id: _id,
              vocabularySetId: _vocabularySetId,
              createdAt: _createdAt,
              updatedAt: _updatedAt,
              ...term
            }) => term,
          ),
        },
      },
      select: { id: true },
    });

    return this.findMineById(copiedSet.id, user.id);
  }

  async createFolder(nameValue: unknown, user: AuthenticatedUser) {
    await this.authService.syncUser(user);
    const name = this.parseText(nameValue, "Tên thư mục", 2, 60, false)!;

    try {
      return await this.prisma.vocabularyFolder.create({
        data: { name, userId: user.id },
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Bạn đã có thư mục cùng tên.");
      }
      throw error;
    }
  }

  async updateFolder(id: string, nameValue: unknown, userId: string) {
    const folder = await this.findOwnedFolder(id, userId);
    const name = this.parseText(nameValue, "Tên thư mục", 2, 60, false)!;

    try {
      return await this.prisma.vocabularyFolder.update({
        where: { id: folder.id },
        data: { name },
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Bạn đã có thư mục cùng tên.");
      }
      throw error;
    }
  }

  async deleteFolder(id: string, userId: string) {
    const folder = await this.findOwnedFolder(id, userId);
    await this.prisma.vocabularyFolder.delete({ where: { id: folder.id } });
    return { deleted: true, id: folder.id };
  }

  private parseSetInput(values: VocabularySetMutationInput) {
    const title = this.parseText(values.title, "Tên bộ từ", 2, 120, false)!;
    const description = this.parseText(
      values.description,
      "Mô tả",
      0,
      600,
      true,
    );
    const topic = this.parseText(values.topic, "Chủ đề", 0, 80, true);
    const difficulty = this.parseText(values.difficulty, "Độ khó", 0, 40, true);
    const folderId = this.parseText(values.folderId, "Thư mục", 0, 100, true);
    const visibility = this.parseVisibility(values.visibility);
    const part = this.parsePart(values.part);
    const terms = this.parseTerms(values.terms);

    return {
      title,
      description,
      topic,
      difficulty,
      folderId,
      visibility,
      part,
      terms,
    };
  }

  private parseTerms(value: unknown) {
    if (!Array.isArray(value) || value.length === 0) {
      throw new BadRequestException("Bộ từ cần có ít nhất một từ.");
    }
    if (value.length > 500) {
      throw new BadRequestException("Mỗi bộ từ được chứa tối đa 500 từ.");
    }

    const terms = value.map((rawValue, index) => {
      if (!rawValue || typeof rawValue !== "object") {
        throw new BadRequestException(`Từ ở dòng ${index + 1} không hợp lệ.`);
      }
      const raw = rawValue as Partial<
        Record<keyof VocabularyTermMutationInput, unknown>
      >;
      return {
        id: this.parseText(raw.id, "ID từ", 0, 100, true),
        term: this.parseText(
          raw.term,
          `Từ ở dòng ${index + 1}`,
          1,
          160,
          false,
        )!,
        meaningVi: this.parseText(
          raw.meaningVi,
          `Nghĩa ở dòng ${index + 1}`,
          1,
          500,
          false,
        )!,
        ipa: this.parseText(raw.ipa, "IPA", 0, 120, true),
        partOfSpeech: this.parseText(raw.partOfSpeech, "Từ loại", 0, 80, true),
        exampleEn: this.parseText(
          raw.exampleEn,
          "Ví dụ tiếng Anh",
          0,
          800,
          true,
        ),
        exampleVi: this.parseText(
          raw.exampleVi,
          "Ví dụ tiếng Việt",
          0,
          800,
          true,
        ),
      };
    });

    const normalizedTerms = terms.map((term) =>
      term.term.toLocaleLowerCase("en"),
    );
    if (new Set(normalizedTerms).size !== normalizedTerms.length) {
      throw new BadRequestException("Không thể thêm từ trùng trong cùng bộ.");
    }

    return terms;
  }

  private parseVisibility(value: unknown) {
    if (
      !Object.values(VocabularySetVisibility).includes(
        value as VocabularySetVisibility,
      )
    ) {
      throw new BadRequestException(
        "Quyền riêng tư phải là PUBLIC, PRIVATE hoặc UNLISTED.",
      );
    }
    return value as VocabularySetVisibility;
  }

  private parsePart(value: unknown) {
    if (value === null || value === undefined || value === "") return null;
    if (!Object.values(ToeicPart).includes(value as ToeicPart)) {
      throw new BadRequestException("Part TOEIC không hợp lệ.");
    }
    return value as ToeicPart;
  }

  private parseText(
    value: unknown,
    label: string,
    min: number,
    max: number,
    nullable: boolean,
  ) {
    if (value === null || value === undefined || value === "") {
      if (nullable) return null;
      throw new BadRequestException(`${label} không được để trống.`);
    }
    if (typeof value !== "string") {
      throw new BadRequestException(`${label} phải là chuỗi.`);
    }
    const normalized = value.trim();
    if (normalized.length < min || normalized.length > max) {
      throw new BadRequestException(
        `${label} cần có từ ${min} đến ${max} ký tự.`,
      );
    }
    return normalized;
  }

  private async assertFolderOwnership(folderId: string | null, userId: string) {
    if (!folderId) return;
    await this.findOwnedFolder(folderId, userId);
  }

  private async findOwnedSet(id: string, userId: string) {
    const vocabularySet = await this.prisma.vocabularySet.findFirst({
      where: { id, ownerId: userId },
      select: { id: true },
    });
    if (!vocabularySet) {
      throw new ForbiddenException("Bạn không có quyền sửa bộ từ này.");
    }
    return vocabularySet;
  }

  private async findOwnedFolder(id: string, userId: string) {
    const folder = await this.prisma.vocabularyFolder.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!folder) {
      throw new ForbiddenException("Bạn không có quyền sửa thư mục này.");
    }
    return folder;
  }

  private async createUniqueSlug(title: string) {
    const base =
      title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("en")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "bo-tu";

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const suffix = randomBytes(3).toString("hex");
      const slug = `${base}-${suffix}`;
      const exists = await this.prisma.vocabularySet.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!exists) return slug;
    }

    throw new ConflictException("Chưa thể tạo URL duy nhất. Hãy thử lại.");
  }
}
