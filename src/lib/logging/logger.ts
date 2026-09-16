import "server-only";

type LogFields = Record<string, unknown>;

/**
 * Minimal structured logger. Console-based for Phase 1; the call sites
 * (job lifecycle, LLM/retrieval latency, errors) are what matter — the sink
 * can be swapped later without touching them. Never pass API keys or full
 * document contents in `fields`.
 */
function log(level: "info" | "warn" | "error", event: string, fields?: LogFields) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...fields,
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (event: string, fields?: LogFields) => log("info", event, fields),
  warn: (event: string, fields?: LogFields) => log("warn", event, fields),
  error: (event: string, fields?: LogFields) => log("error", event, fields),
};
