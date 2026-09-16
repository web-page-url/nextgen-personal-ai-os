import "server-only";

/**
 * Phase 1 has no login UI — every table is still scoped by userId so real
 * multi-user auth is a call-site change later, not a schema migration.
 */
export const DEFAULT_USER_ID = "user_default_local";

/**
 * Character counts, not tokens — chunking every paragraph through a real
 * tokenizer just to decide packing is unnecessary cost for Phase 1. ~4
 * chars/token, so these approximate an ~800-token chunk with ~120 overlap.
 */
export const CHUNKING_DEFAULTS = {
  chunkSize: 3200,
  chunkOverlap: 480,
} as const;

export const RETRIEVAL_DEFAULTS = {
  topK: 8,
  topN: 5,
} as const;

export const UPLOAD_LIMITS = {
  maxFileSizeBytes: 50 * 1024 * 1024,
  allowedMimeTypes: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/json",
  ] as const,
} as const;

export const JOB_RECOVERY = {
  stuckJobTimeoutMs: 10 * 60 * 1000,
  pollIntervalMs: 2000,
} as const;
