import "server-only";
import { prisma } from "@/src/db/client";
import type { DocumentType } from "@/src/generated/prisma/client";

export interface CreateDocumentInput {
  userId: string;
  filename: string;
  originalName: string;
  fileType: DocumentType;
  mimeType: string;
  fileSizeBytes: number;
  storageKey: string;
  collectionId?: string;
}

export async function createDocumentWithVersion(input: CreateDocumentInput) {
  return prisma.$transaction(async (tx) => {
    const document = await tx.document.create({
      data: {
        userId: input.userId,
        filename: input.filename,
        originalName: input.originalName,
        fileType: input.fileType,
        mimeType: input.mimeType,
        fileSizeBytes: input.fileSizeBytes,
        storageKey: input.storageKey,
        collectionId: input.collectionId,
        status: "UPLOADED",
      },
    });

    const version = await tx.documentVersion.create({
      data: {
        documentId: document.id,
        versionNumber: 1,
        storageKey: input.storageKey,
        fileSizeBytes: input.fileSizeBytes,
      },
    });

    await tx.document.update({
      where: { id: document.id },
      data: { currentVersionId: version.id },
    });

    return { document, version };
  });
}

export async function listDocuments(userId: string, filters?: { collectionId?: string; tagId?: string }) {
  return prisma.document.findMany({
    where: {
      userId,
      collectionId: filters?.collectionId,
      ...(filters?.tagId ? { tags: { some: { tagId: filters.tagId } } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      collection: { select: { id: true, name: true, color: true } },
      tags: { include: { tag: true } },
    },
  });
}

export async function getDocumentById(id: string, userId: string) {
  return prisma.document.findFirst({
    where: { id, userId },
    include: {
      collection: { select: { id: true, name: true, color: true } },
      tags: { include: { tag: true } },
      currentVersion: true,
      jobs: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
}

export async function deleteDocument(id: string, userId: string) {
  return prisma.document.deleteMany({ where: { id, userId } });
}

export async function findDocumentNames(
  ids: string[],
  userId: string,
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const documents = await prisma.document.findMany({
    where: { id: { in: ids }, userId },
    select: { id: true, originalName: true },
  });
  return new Map(documents.map((doc) => [doc.id, doc.originalName]));
}

export async function createReprocessVersion(documentId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const document = await tx.document.findFirstOrThrow({ where: { id: documentId, userId } });
    const latestVersion = await tx.documentVersion.findFirstOrThrow({
      where: { documentId },
      orderBy: { versionNumber: "desc" },
    });

    const version = await tx.documentVersion.create({
      data: {
        documentId,
        versionNumber: latestVersion.versionNumber + 1,
        storageKey: document.storageKey,
        fileSizeBytes: document.fileSizeBytes,
      },
    });

    await tx.document.update({
      where: { id: documentId },
      data: { currentVersionId: version.id, status: "UPLOADED", errorMessage: null },
    });

    return version;
  });
}
