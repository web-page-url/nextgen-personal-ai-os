import "server-only";
import { randomUUID } from "node:crypto";
import { JOB_RECOVERY } from "@/src/lib/config/constants";
import { logger } from "@/src/lib/logging/logger";
import type { ProcessingJobType } from "@/src/generated/prisma/client";
import type { ClaimedJob } from "./job-queue";
import { getJobQueue } from "./sql-job-queue";

export type JobHandler = (job: ClaimedJob) => Promise<void>;

type GlobalWithWorker = typeof globalThis & {
  __jobWorkerStarted?: boolean;
};

const globalForWorker = globalThis as GlobalWithWorker;
const handlers = new Map<ProcessingJobType, JobHandler>();
const workerId = randomUUID();
let ticking = false;

export function registerJobHandler(type: ProcessingJobType, handler: JobHandler): void {
  handlers.set(type, handler);
}

async function tick(): Promise<void> {
  if (ticking) return;
  ticking = true;
  try {
    const queue = getJobQueue();
    const job = await queue.claimNext(workerId);
    if (!job) return;

    const handler = handlers.get(job.type);
    if (!handler) {
      logger.error("jobs.worker.no_handler", { jobId: job.id, type: job.type });
      await queue.fail(job.id, `No handler registered for job type: ${job.type}`);
      return;
    }

    try {
      await handler(job);
      await queue.complete(job.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("jobs.worker.job_failed", { jobId: job.id, type: job.type, error: message });
      await queue.fail(job.id, message);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("jobs.worker.tick_failed", { error: message });
  } finally {
    ticking = false;
  }
}

/**
 * Starts the in-process poll loop exactly once per server process. Called
 * from instrumentation.ts's register(), which Next.js guarantees runs once
 * per server start (not per hot-reload). The atomic claim in
 * SqlJobQueue is the real safety net if this ever runs as >1 process.
 */
export async function startWorker(): Promise<void> {
  if (globalForWorker.__jobWorkerStarted) return;
  globalForWorker.__jobWorkerStarted = true;

  const recovered = await getJobQueue().recoverStuckJobs(JOB_RECOVERY.stuckJobTimeoutMs);
  if (recovered > 0) {
    logger.info("jobs.worker.recovered_stuck_jobs", { count: recovered });
  }

  setInterval(() => {
    void tick();
  }, JOB_RECOVERY.pollIntervalMs);

  logger.info("jobs.worker.started", { workerId });
}
