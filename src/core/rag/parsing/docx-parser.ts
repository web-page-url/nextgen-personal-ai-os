import "server-only";
import mammoth from "mammoth";
import { DocumentType } from "@/src/generated/prisma/client";
import type { DocumentParser, DocumentSegment, ParsedDocument } from "./document-parser";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Splits mammoth's HTML output on heading tags to build a heading
 * breadcrumb (e.g. "Coverage > Limits") since DOCX has no page concept.
 */
export class DocxParser implements DocumentParser {
  readonly fileType = DocumentType.DOCX;

  async parse(buffer: Buffer): Promise<ParsedDocument> {
    const { value: html } = await mammoth.convertToHtml({ buffer });
    const parts = html.split(/(<h[1-6][^>]*>.*?<\/h[1-6]>)/gis);

    const segments: DocumentSegment[] = [];
    const breadcrumb: string[] = [];
    let currentPath: string | undefined;
    let pending = "";

    const flush = () => {
      const text = stripHtml(pending);
      if (text.length > 0) {
        segments.push({
          text,
          sectionPath: currentPath,
          locationLabel: currentPath ? `Section: ${currentPath}` : "Document",
        });
      }
      pending = "";
    };

    for (const part of parts) {
      const headingMatch = part.match(/^<h([1-6])[^>]*>(.*?)<\/h\1>$/is);
      if (headingMatch) {
        flush();
        const level = Number(headingMatch[1]);
        const title = stripHtml(headingMatch[2]);
        breadcrumb.length = level - 1;
        breadcrumb[level - 1] = title;
        currentPath = breadcrumb.filter(Boolean).join(" > ") || undefined;
      } else {
        pending += part;
      }
    }
    flush();

    if (segments.length === 0) {
      const { value: rawText } = await mammoth.extractRawText({ buffer });
      const text = rawText.trim();
      if (text) {
        segments.push({ text, locationLabel: "Document" });
      }
    }

    return { segments, metadata: {} };
  }
}
