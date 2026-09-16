import "server-only";
import type { ParsedDocument } from "../parsing/document-parser";
import type { Chunk, ChunkConfig, Chunker } from "./chunker";
import { chunkTextFixedSize } from "./fixed-size-chunker";

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

interface PendingParagraph {
  text: string;
  start: number;
}

/**
 * Default chunking strategy: packs paragraphs up to chunkSize, carries
 * trailing paragraphs forward as overlap, and falls back to a hard
 * character split for any single paragraph larger than chunkSize. Never
 * crosses a segment boundary (a segment is already page/heading-scoped).
 */
export class ParagraphChunker implements Chunker {
  chunk(document: ParsedDocument, config: ChunkConfig): Chunk[] {
    const chunks: Chunk[] = [];
    let chunkIndex = 0;

    for (const segment of document.segments) {
      const paragraphs = splitParagraphs(segment.text);
      let current: PendingParagraph[] = [];
      let currentLength = 0;
      let cursor = 0;

      const flush = () => {
        if (current.length === 0) return;
        const text = current.map((p) => p.text).join("\n\n");
        const charStart = current[0].start;
        chunks.push({
          text,
          chunkIndex: chunkIndex++,
          pageNumber: segment.pageNumber,
          sectionPath: segment.sectionPath,
          locationLabel: segment.locationLabel,
          charStart,
          charEnd: charStart + text.length,
        });
      };

      for (const paragraph of paragraphs) {
        const paraStart = segment.text.indexOf(paragraph, cursor);
        cursor = paraStart + paragraph.length;

        if (paragraph.length > config.chunkSize) {
          flush();
          current = [];
          currentLength = 0;
          for (const window of chunkTextFixedSize(paragraph, config)) {
            chunks.push({
              text: window.text,
              chunkIndex: chunkIndex++,
              pageNumber: segment.pageNumber,
              sectionPath: segment.sectionPath,
              locationLabel: segment.locationLabel,
              charStart: paraStart + window.charStart,
              charEnd: paraStart + window.charEnd,
            });
          }
          continue;
        }

        if (currentLength + paragraph.length > config.chunkSize && current.length > 0) {
          flush();
          let overlapLength = 0;
          const carry: PendingParagraph[] = [];
          for (let i = current.length - 1; i >= 0; i--) {
            const candidate = current[i];
            if (overlapLength + candidate.text.length > config.chunkOverlap) break;
            carry.unshift(candidate);
            overlapLength += candidate.text.length;
          }
          current = carry;
          currentLength = overlapLength;
        }

        current.push({ text: paragraph, start: paraStart });
        currentLength += paragraph.length;
      }
      flush();
    }

    return chunks;
  }
}
