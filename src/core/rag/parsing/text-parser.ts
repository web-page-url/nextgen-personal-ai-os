import "server-only";
import { DocumentType } from "@/src/generated/prisma/client";
import type { DocumentParser, ParsedDocument } from "./document-parser";

export class TextParser implements DocumentParser {
  readonly fileType = DocumentType.TXT;

  async parse(buffer: Buffer): Promise<ParsedDocument> {
    const text = buffer.toString("utf-8").trim();
    return {
      segments: text ? [{ text, locationLabel: "Document" }] : [],
      metadata: {},
    };
  }
}
