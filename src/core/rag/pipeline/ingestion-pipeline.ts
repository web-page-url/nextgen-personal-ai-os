import "server-only";
import { prisma } from "@/src/db/client";
import type { Prisma } from "@/src/generated/prisma/client";
import { getStorageProvider } from "@/src/core/storage/local-storage-provider";
import { getParser } from "@/src/core/rag/parsing/parser-registry";
import { ParagraphChunker } from "@/src/core/rag/chunking/paragraph-chunker";
import { CHUNKING_DEFAULTS } from "@/src/lib/config/constants";
import { getEmbeddingProvider } from "@/src/core/ai/provider-registry";
import { logger } from "@/src/lib/logging/logger";

const chunker = new ParagraphChunker();
const EMBEDDING_BATCH_SIZE = 32;

/**
 * Parse -> chunk -> embed -> store for a single document version. Not
 * specific to "Second Brain" — this is the reusable ingestion path other
 * modules (Life Library, etc.) will call later.
 */
export async function runIngestion(documentVersionId: string): Promise<void> {
  const startedAt = Date.now();

  const version = await prisma.documentVersion.findUniqueOrThrow({
    where: { id: documentVersionId },
    include: { document: true },
  });

  const storage = getStorageProvider();
  const buffer = await storage.read(version.storageKey);

  const parser = getParser(version.document.fileType);
  const parsed = await parser.parse(buffer);

  const chunks = chunker.chunk(parsed, CHUNKING_DEFAULTS);
  if (chunks.length === 0) {
    throw new Error("Document produced no extractable text");
  }

  const embeddingProvider = getEmbeddingProvider();
  const embeddings: number[][] = [];
  for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE).map((chunk) => chunk.text);
    const batchEmbeddings = await embeddingProvider.embed(batch, {
      taskType: "RETRIEVAL_DOCUMENT",
    });
    embeddings.push(...batchEmbeddings);
  }

  const extractedText = parsed.segments.map((segment) => segment.text).join("\n\n");

  await prisma.$transaction([
    prisma.documentChunk.deleteMany({ where: { documentVersionId } }),
    prisma.documentChunk.createMany({
      data: chunks.map((chunk, index) => ({
        documentId: version.documentId,
        documentVersionId: version.id,
        userId: version.document.userId,
        chunkIndex: chunk.chunkIndex,
        content: chunk.text,
        embedding: embeddings[index],
        embeddingModel: embeddingProvider.model,
        embeddingDim: embeddingProvider.dimensions,
        pageNumber: chunk.pageNumber,
        sectionPath: chunk.sectionPath,
        locationLabel: chunk.locationLabel,
        charStart: chunk.charStart,
        charEnd: chunk.charEnd,
      })),
    }),
    prisma.documentVersion.update({
      where: { id: version.id },
      data: { extractedText },
    }),
    prisma.document.update({
      where: { id: version.documentId },
      data: {
        status: "READY",
        errorMessage: null,
        metadata: parsed.metadata as unknown as Prisma.InputJsonValue,
      },
    }),
  ]);

  logger.info("rag.ingestion.completed", {
    documentId: version.documentId,
    chunkCount: chunks.length,
    durationMs: Date.now() - startedAt,
  });
}
