import "server-only";
import { prisma } from "@/src/db/client";
import { runIngestion } from "@/src/core/rag/pipeline/ingestion-pipeline";
import { logger } from "@/src/lib/logging/logger";
import type { ClaimedJob } from "../job-queue";

interface IngestionPayload {
  documentVersionId: string;
}

function isIngestionPayload(payload: unknown): payload is IngestionPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    typeof (payload as Record<string, unknown>).documentVersionId === "string"
  );
}

export async function handleDocumentIngestion(job: ClaimedJob): Promise<void> {
  if (!job.documentId || !isIngestionPayload(job.payload)) {
    throw new Error("Document ingestion job is missing documentId or documentVersionId");
  }

  await prisma.document.update({
    where: { id: job.documentId },
    data: { status: "PROCESSING" },
  });

  try {
    await runIngestion(job.payload.documentVersionId);
  } catch (error) {
    const isFinalAttempt = job.attempts + 1 >= job.maxAttempts;
    if (isFinalAttempt) {
      const message = error instanceof Error ? error.message : String(error);
      await prisma.document.update({
        where: { id: job.documentId },
        data: { status: "FAILED", errorMessage: message },
      });
      logger.error("jobs.ingestion.failed_final", { documentId: job.documentId, error: message });
    }
    throw error;
  }
}
