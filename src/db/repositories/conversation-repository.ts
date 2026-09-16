import "server-only";
import { prisma } from "@/src/db/client";

export async function createConversation(userId: string, collectionId?: string) {
  return prisma.conversation.create({
    data: { userId, collectionId },
  });
}

export async function listConversations(userId: string) {
  return prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { messages: true } },
    },
  });
}

export async function getConversationById(id: string, userId: string) {
  return prisma.conversation.findFirst({ where: { id, userId } });
}

export async function getConversationWithMessages(id: string, userId: string) {
  return prisma.conversation.findFirst({
    where: { id, userId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          citations: {
            include: {
              document: { select: { originalName: true } },
              chunk: { select: { content: true } },
            },
          },
        },
      },
    },
  });
}

export async function setConversationTitle(id: string, title: string) {
  await prisma.conversation.update({ where: { id }, data: { title } });
}
