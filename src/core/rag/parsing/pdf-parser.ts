import "server-only";
import { extractText, getDocumentProxy } from "unpdf";
import { DocumentType } from "@/src/generated/prisma/client";
import type { DocumentParser, ParsedDocument } from "./document-parser";

export class PdfParser implements DocumentParser {
  readonly fileType = DocumentType.PDF;

  async parse(buffer: Buffer): Promise<ParsedDocument> {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { totalPages, text } = await extractText(pdf, { mergePages: false });

    const segments = text
      .map((pageText, index) => ({
        text: pageText.trim(),
        pageNumber: index + 1,
        locationLabel: `Page ${index + 1}`,
      }))
      .filter((segment) => segment.text.length > 0);

    return {
      segments,
      metadata: { totalPages },
    };
  }
}
