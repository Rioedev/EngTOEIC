const { PrismaClient } = require("@prisma/client");
const {
  set,
  terms,
} = require("../../../packages/shared/src/vocabulary-demo.json");

const prisma = new PrismaClient();

async function main() {
  const vocabularySet = await prisma.vocabularySet.upsert({
    where: { slug: set.slug },
    update: set,
    create: set,
  });

  for (const [index, term] of terms.entries()) {
    await prisma.vocabularyTerm.upsert({
      where: {
        vocabularySetId_term: {
          vocabularySetId: vocabularySet.id,
          term: term.term,
        },
      },
      update: {
        ...term,
        order: index + 1,
        sourceName: "EngTOEIC editorial seed",
        sourceLicense: "Original educational content",
      },
      create: {
        ...term,
        vocabularySetId: vocabularySet.id,
        order: index + 1,
        sourceName: "EngTOEIC editorial seed",
        sourceLicense: "Original educational content",
      },
    });
  }

  console.log(`Seeded ${terms.length} terms into ${vocabularySet.slug}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
