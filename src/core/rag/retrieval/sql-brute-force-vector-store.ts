import "server-only";
import { findRetrievalCandidates } from "@/src/db/repositories/chunk-repository";
import { cosineSimilarity } from "./cosine-similarity";
import type { RetrievalFilters, ScoredChunk, VectorStore } from "./vector-store";

export class SqlBruteForceVectorStore implements VectorStore {
  async retrieve(
    queryEmbedding: number[],
    filters: RetrievalFilters,
    topK: number,
  ): Promise<ScoredChunk[]> {
    const candidates = await findRetrievalCandidates(filters);

    const scored: ScoredChunk[] = candidates.map((candidate) => ({
      chunkId: candidate.id,
      documentId: candidate.documentId,
      chunkIndex: candidate.chunkIndex,
      content: candidate.content,
      pageNumber: candidate.pageNumber,
      sectionPath: candidate.sectionPath,
      locationLabel: candidate.locationLabel,
      score: cosineSimilarity(queryEmbedding, candidate.embedding),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
}

let instance: SqlBruteForceVectorStore | undefined;

export function getVectorStore(): VectorStore {
  if (!instance) {
    instance = new SqlBruteForceVectorStore();
  }
  return instance;
}
