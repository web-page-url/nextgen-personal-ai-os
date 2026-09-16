export async function register() {
  // Next.js runs this once per server process (not per hot-reload module
  // re-evaluation, not during `next build`) — the natural place to wire up
  // job handlers and start the in-process worker.
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { registerJobHandler, startWorker } = await import("@/src/core/jobs/worker");
  const { handleDocumentIngestion } = await import(
    "@/src/core/jobs/handlers/document-ingestion-handler"
  );
  const { ProcessingJobType } = await import("@/src/generated/prisma/client");

  registerJobHandler(ProcessingJobType.DOCUMENT_INGESTION, handleDocumentIngestion);
  registerJobHandler(ProcessingJobType.DOCUMENT_REPROCESS, handleDocumentIngestion);

  await startWorker();
}
