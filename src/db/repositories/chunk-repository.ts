import "server-only";
import { prisma } from "@/src/db/client";
import type { Prisma } from "@/src/generated/prisma/client";

export interface RetrievalCandidateFilters {
  userId: string;
  collectionId?: string;
  tagIds?: string[];
}

export interface RetrievalCandidate {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  embedding: number[];
  pageNumber: number | null;
  sectionPath: string | null;
  locationLabel: string;
}

/** Narrow, always userId-scoped selects — never drag full rows (with embeddings) into list/detail views. */
export async function findRetrievalCandidates(
  filters: RetrievalCandidateFilters,
): Promise<RetrievalCandidate[]> {
  const documentWhere: Prisma.DocumentWhereInput = {
    userId: filters.userId,
    status: "READY",
  };
  if (filters.collectionId) {
    documentWhere.collectionId = filters.collectionId;
  }
  if (filters.tagIds && filters.tagIds.length > 0) {
    documentWhere.tags = { some: { tagId: { in: filters.tagIds } } };
  }

  const chunks = await prisma.documentChunk.findMany({
    where: {
      userId: filters.userId,
      document: documentWhere,
    },
    select: {
      id: true,
      documentId: true,
      chunkIndex: true,
      content: true,
      embedding: true,
      pageNumber: true,
      sectionPath: true,
      locationLabel: true,
    },
  });

  // Stored as a JSON column (SQLite has no native float-array type) — always
  // written as number[] by the ingestion pipeline, so this cast is safe.
  return chunks.map((chunk) => ({ ...chunk, embedding: chunk.embedding as number[] }));
}

export async function findChunkById(chunkId: string, userId: string) {
  return prisma.documentChunk.findFirst({
    where: { id: chunkId, userId },
    select: {
      id: true,
      documentId: true,
      chunkIndex: true,
      content: true,
      pageNumber: true,
      sectionPath: true,
      locationLabel: true,
      documentVersionId: true,
    },
  });
}

/** Neighboring chunks (chunkIndex ± 1) for the citation "surrounding context" panel. */
export async function findNeighboringChunks(
  documentVersionId: string,
  chunkIndex: number,
  userId: string,
) {
  return prisma.documentChunk.findMany({
    where: {
      documentVersionId,
      userId,
      chunkIndex: { in: [chunkIndex - 1, chunkIndex, chunkIndex + 1] },
    },
    orderBy: { chunkIndex: "asc" },
    select: {
      id: true,
      chunkIndex: true,
      content: true,
      pageNumber: true,
      sectionPath: true,
      locationLabel: true,
    },
  });
}
