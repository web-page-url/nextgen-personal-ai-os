import "server-only";
import { prisma } from "@/src/db/client";
import type { MessageRole } from "@/src/generated/prisma/client";
import type { CitationInput } from "@/src/core/rag/citation/citation-builder";

export async function createMessage(
  conversationId: string,
  role: MessageRole,
  content: string,
  options?: { model?: string; tokenCount?: number },
) {
  return prisma.message.create({
    data: {
      conversationId,
      role,
      content,
      model: options?.model,
      tokenCount: options?.tokenCount,
    },
  });
}

export async function createAssistantMessageWithCitations(
  conversationId: string,
  content: string,
  model: string,
  citations: CitationInput[],
) {
  return prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: { conversationId, role: "ASSISTANT", content, model },
    });

    if (citations.length > 0) {
      await tx.citation.createMany({
        data: citations.map((citation) => ({
          messageId: message.id,
          documentId: citation.documentId,
          chunkId: citation.chunkId,
          similarityScore: citation.similarityScore,
          rank: citation.rank,
          locationLabel: citation.locationLabel,
        })),
      });
    }

    await tx.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  });
}

export async function listRecentMessages(conversationId: string, limit: number) {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return messages.reverse();
}
