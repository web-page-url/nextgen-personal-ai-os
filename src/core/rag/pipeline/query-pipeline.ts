import "server-only";
import { getEmbeddingProvider } from "@/src/core/ai/provider-registry";
import { getVectorStore } from "@/src/core/rag/retrieval/sql-brute-force-vector-store";
import { rerankByLexicalOverlap } from "@/src/core/rag/retrieval/reranker";
import type { RetrievalFilters, ScoredChunk } from "@/src/core/rag/retrieval/vector-store";
import { RETRIEVAL_DEFAULTS } from "@/src/lib/config/constants";
import { logger } from "@/src/lib/logging/logger";

/**
 * embed query -> vector search -> lexical rerank -> truncate. Reused by
 * both /api/chat (feeds an LLM) and /api/search (no LLM call) — this is
 * what makes the RAG engine generic rather than "Second Brain"-specific.
 */
export async function retrieveRelevantChunks(
  query: string,
  filters: RetrievalFilters,
): Promise<ScoredChunk[]> {
  const startedAt = Date.now();

  const embeddingProvider = getEmbeddingProvider();
  const [queryEmbedding] = await embeddingProvider.embed([query], {
    taskType: "RETRIEVAL_QUERY",
  });

  const vectorStore = getVectorStore();
  const candidates = await vectorStore.retrieve(queryEmbedding, filters, RETRIEVAL_DEFAULTS.topK);
  const reranked = rerankByLexicalOverlap(query, candidates);
  const results = reranked.slice(0, RETRIEVAL_DEFAULTS.topN);

  logger.info("rag.retrieval.completed", {
    userId: filters.userId,
    candidateCount: candidates.length,
    resultCount: results.length,
    durationMs: Date.now() - startedAt,
  });

  return results;
}
