import "server-only";
import type { ScoredChunk } from "../retrieval/vector-store";

export interface CitationInput {
  documentId: string;
  chunkId: string;
  similarityScore: number;
  rank: number;
  locationLabel: string;
}

/** Numbers the chunks actually placed in context and carries their citation metadata. */
export function buildCitationInputs(chunks: ScoredChunk[]): CitationInput[] {
  return chunks.map((chunk, index) => ({
    documentId: chunk.documentId,
    chunkId: chunk.chunkId,
    similarityScore: chunk.score,
    rank: index + 1,
    locationLabel: chunk.locationLabel,
  }));
}
