import "server-only";
import type { DocumentType } from "@/src/generated/prisma/client";

/**
 * A contiguous piece of a parsed document that carries whatever location
 * information the source format naturally provides. The chunker never
 * splits a chunk across two segments, so every chunk keeps one
 * pageNumber/sectionPath and a human-readable citation label.
 */
export interface DocumentSegment {
  text: string;
  pageNumber?: number;
  sectionPath?: string;
  locationLabel: string;
}

export interface ParsedDocument {
  segments: DocumentSegment[];
  metadata: Record<string, unknown>;
}

/**
 * One parser per supported file type, picked by parser-registry.ts. Never
 * hand-roll parsing logic here — wrap a mature library per format.
 */
export interface DocumentParser {
  readonly fileType: DocumentType;
  parse(buffer: Buffer): Promise<ParsedDocument>;
}
