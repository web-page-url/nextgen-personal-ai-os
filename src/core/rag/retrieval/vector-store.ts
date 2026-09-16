import "server-only";

export interface RetrievalFilters {
  userId: string;
  collectionId?: string;
  tagIds?: string[];
}

export interface ScoredChunk {
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  pageNumber: number | null;
  sectionPath: string | null;
  locationLabel: string;
  score: number;
}

/**
 * Brute-force cosine similarity over a SQLite Json column today (SQLite has
 * no native vector/array type, and this machine can't build pgvector or
 * run Postgres/Docker without admin rights). Hidden behind this interface
 * so a real vector-database-backed store can be swapped in later without
 * touching call sites. Fine at personal scale (hundreds-to-low-thousands of
 * chunks); revisit if that changes.
 */
export interface VectorStore {
  retrieve(
    queryEmbedding: number[],
    filters: RetrievalFilters,
    topK: number,
  ): Promise<ScoredChunk[]>;
}
