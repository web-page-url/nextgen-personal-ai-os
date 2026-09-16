import "server-only";
import { prisma } from "@/src/db/client";

export async function listTags(userId: string) {
  return prisma.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: { _count: { select: { documents: true } } },
  });
}

export async function findOrCreateTag(userId: string, name: string) {
  return prisma.tag.upsert({
    where: { userId_name: { userId, name } },
    update: {},
    create: { userId, name },
  });
}

export async function setDocumentTags(documentId: string, tagIds: string[]) {
  // SQLite's createMany doesn't support skipDuplicates, so dedupe up front.
  const uniqueTagIds = [...new Set(tagIds)];
  await prisma.$transaction([
    prisma.documentTag.deleteMany({ where: { documentId } }),
    prisma.documentTag.createMany({
      data: uniqueTagIds.map((tagId) => ({ documentId, tagId })),
    }),
  ]);
}
