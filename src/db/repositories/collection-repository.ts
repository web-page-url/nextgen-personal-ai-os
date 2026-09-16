import "server-only";
import { prisma } from "@/src/db/client";

export async function listCollections(userId: string) {
  return prisma.collection.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: { _count: { select: { documents: true } } },
  });
}

export async function createCollection(userId: string, name: string, color?: string, description?: string) {
  return prisma.collection.create({
    data: { userId, name, color, description },
  });
}

export async function getCollectionById(id: string, userId: string) {
  return prisma.collection.findFirst({
    where: { id, userId },
    include: {
      documents: {
        orderBy: { createdAt: "desc" },
        include: {
          collection: { select: { id: true, name: true, color: true } },
          tags: { include: { tag: true } },
        },
      },
    },
  });
}

export async function deleteCollection(id: string, userId: string) {
  return prisma.collection.deleteMany({ where: { id, userId } });
}
