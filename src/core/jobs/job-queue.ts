import "server-only";
import type { ProcessingJobType } from "@/src/generated/prisma/client";

export interface EnqueueParams {
  userId: string;
  documentId?: string;
  type: ProcessingJobType;
  payload?: Record<string, unknown>;
}

export interface ClaimedJob {
  id: string;
  userId: string;
  documentId: string | null;
  type: ProcessingJobType;
  payload: Record<string, unknown> | null;
  attempts: number;
  maxAttempts: number;
}

/**
 * SQLite-backed today (no Redis/BullMQ available without Docker on this
 * machine), hidden behind this interface so a real queue can be swapped in
 * later without touching call sites.
 */
export interface JobQueue {
  enqueue(params: EnqueueParams): Promise<string>;
  claimNext(workerId: string): Promise<ClaimedJob | null>;
  complete(jobId: string): Promise<void>;
  /** Returns the job's resulting status after recording the failure (PENDING if it will retry, FAILED otherwise). */
  fail(jobId: string, errorMessage: string): Promise<"PENDING" | "FAILED">;
  /** Resets jobs stuck RUNNING past the timeout back to PENDING. Returns the number recovered. */
  recoverStuckJobs(timeoutMs: number): Promise<number>;
}
