import "server-only";
import { prisma } from "@/src/db/client";
import { Prisma, type ProcessingJobStatus } from "@/src/generated/prisma/client";
import type { ClaimedJob, EnqueueParams, JobQueue } from "./job-queue";

interface RawClaimedRow {
  id: string;
  userId: string;
  documentId: string | null;
  type: ClaimedJob["type"];
  payload: Prisma.JsonValue | string | null;
  attempts: number;
  maxAttempts: number;
}

/**
 * SQLite-backed (no Redis/BullMQ available without Docker on this machine).
 * SQLite serializes all writes anyway, so a plain "claim the oldest pending
 * row" subquery is inherently race-free — no FOR UPDATE SKIP LOCKED needed
 * (that's Postgres-only syntax).
 */
export class SqlJobQueue implements JobQueue {
  async enqueue(params: EnqueueParams): Promise<string> {
    const job = await prisma.processingJob.create({
      data: {
        userId: params.userId,
        documentId: params.documentId,
        type: params.type,
        payload: (params.payload ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
    return job.id;
  }

  async claimNext(workerId: string): Promise<ClaimedJob | null> {
    const now = new Date().toISOString();
    const rows = await prisma.$queryRaw<RawClaimedRow[]>`
      UPDATE processing_jobs
      SET status = 'RUNNING', lockedAt = ${now}, lockedBy = ${workerId}, startedAt = ${now}, updatedAt = ${now}
      WHERE id = (
        SELECT id FROM processing_jobs
        WHERE status = 'PENDING'
        ORDER BY createdAt ASC
        LIMIT 1
      )
      RETURNING id, userId, documentId, type, payload, attempts, maxAttempts
    `;

    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      userId: row.userId,
      documentId: row.documentId,
      type: row.type,
      // Prisma's raw-query driver adapter already decodes the Json column
      // into a plain object for us — only parse it if it comes back as a string.
      payload: !row.payload
        ? null
        : typeof row.payload === "string"
          ? (JSON.parse(row.payload) as Record<string, unknown>)
          : (row.payload as Record<string, unknown>),
      attempts: row.attempts,
      maxAttempts: row.maxAttempts,
    };
  }

  async complete(jobId: string): Promise<void> {
    await prisma.processingJob.update({
      where: { id: jobId },
      data: { status: "COMPLETED", completedAt: new Date(), lockedAt: null, lockedBy: null },
    });
  }

  async fail(jobId: string, errorMessage: string): Promise<"PENDING" | "FAILED"> {
    const job = await prisma.processingJob.findUniqueOrThrow({ where: { id: jobId } });
    const attempts = job.attempts + 1;
    const status: ProcessingJobStatus = attempts < job.maxAttempts ? "PENDING" : "FAILED";

    await prisma.processingJob.update({
      where: { id: jobId },
      data: {
        attempts,
        status,
        errorMessage,
        lockedAt: null,
        lockedBy: null,
        completedAt: status === "FAILED" ? new Date() : null,
      },
    });

    return status;
  }

  async recoverStuckJobs(timeoutMs: number): Promise<number> {
    const threshold = new Date(Date.now() - timeoutMs);
    const result = await prisma.processingJob.updateMany({
      where: { status: "RUNNING", lockedAt: { lt: threshold } },
      data: { status: "PENDING", lockedAt: null, lockedBy: null },
    });
    return result.count;
  }
}

let instance: SqlJobQueue | undefined;

export function getJobQueue(): JobQueue {
  if (!instance) {
    instance = new SqlJobQueue();
  }
  return instance;
}
