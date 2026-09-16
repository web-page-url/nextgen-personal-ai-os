import "server-only";
import type { ParsedDocument } from "../parsing/document-parser";

export interface ChunkConfig {
  chunkSize: number;
  chunkOverlap: number;
}

export interface Chunk {
  text: string;
  chunkIndex: number;
  pageNumber?: number;
  sectionPath?: string;
  locationLabel: string;
  charStart: number;
  charEnd: number;
}

/**
 * Chunking is configurable and swappable — never hardcode one chunk size
 * throughout the app. A chunk never crosses a segment boundary, so it
 * always keeps exactly one pageNumber/sectionPath for citations.
 */
export interface Chunker {
  chunk(document: ParsedDocument, config: ChunkConfig): Chunk[];
}
