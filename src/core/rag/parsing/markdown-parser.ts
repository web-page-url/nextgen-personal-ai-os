import "server-only";
import { DocumentType } from "@/src/generated/prisma/client";
import type { DocumentParser, DocumentSegment, ParsedDocument } from "./document-parser";

const HEADING_RE = /^(#{1,6})\s+(.+)$/;

/** Splits on Markdown headings to build a section breadcrumb, same idea as the DOCX parser. */
export class MarkdownParser implements DocumentParser {
  readonly fileType = DocumentType.MD;

  async parse(buffer: Buffer): Promise<ParsedDocument> {
    const lines = buffer.toString("utf-8").split(/\r?\n/);

    const segments: DocumentSegment[] = [];
    const breadcrumb: string[] = [];
    let currentPath: string | undefined;
    let pending: string[] = [];

    const flush = () => {
      const text = pending.join("\n").trim();
      if (text.length > 0) {
        segments.push({
          text,
          sectionPath: currentPath,
          locationLabel: currentPath ? `Section: ${currentPath}` : "Document",
        });
      }
      pending = [];
    };

    for (const line of lines) {
      const match = line.match(HEADING_RE);
      if (match) {
        flush();
        const level = match[1].length;
        breadcrumb.length = level - 1;
        breadcrumb[level - 1] = match[2].trim();
        currentPath = breadcrumb.filter(Boolean).join(" > ") || undefined;
      } else {
        pending.push(line);
      }
    }
    flush();

    return { segments, metadata: {} };
  }
}
