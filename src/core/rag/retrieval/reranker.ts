import "server-only";
import type { ScoredChunk } from "./vector-store";

function tokenize(text: string): Set<string> {
  return new Set(text.toLowerCase().match(/[a-z0-9]+/g) ?? []);
}

/**
 * Light hybrid-retrieval nudge: blends cosine similarity with literal
 * keyword overlap so exact-term matches aren't lost to pure semantic
 * search. Not a full BM25/cross-encoder reranker — that's unnecessary
 * weight for Phase 1's personal-scale corpus.
 */
export function rerankByLexicalOverlap(query: string, chunks: ScoredChunk[]): ScoredChunk[] {
  const queryTerms = tokenize(query);
  if (queryTerms.size === 0) return chunks;

  return chunks
    .map((chunk) => {
      const contentTerms = tokenize(chunk.content);
      let overlap = 0;
      for (const term of queryTerms) {
        if (contentTerms.has(term)) overlap++;
      }
      const lexicalScore = overlap / queryTerms.size;
      return { ...chunk, score: chunk.score * 0.85 + lexicalScore * 0.15 };
    })
    .sort((a, b) => b.score - a.score);
}
