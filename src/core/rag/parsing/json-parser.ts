import "server-only";
import { DocumentType } from "@/src/generated/prisma/client";
import type { DocumentParser, DocumentSegment, ParsedDocument } from "./document-parser";

/** One segment per top-level array element or object key, so citations can point at "Record #N". */
export class JsonParser implements DocumentParser {
  readonly fileType = DocumentType.JSON;

  async parse(buffer: Buffer): Promise<ParsedDocument> {
    const parsed: unknown = JSON.parse(buffer.toString("utf-8"));
    const segments: DocumentSegment[] = [];

    if (Array.isArray(parsed)) {
      parsed.forEach((entry, index) => {
        segments.push({
          text: JSON.stringify(entry, null, 2),
          locationLabel: `Record #${index + 1}`,
        });
      });
    } else if (parsed && typeof parsed === "object") {
      for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
        segments.push({
          text: `${key}: ${JSON.stringify(value, null, 2)}`,
          sectionPath: key,
          locationLabel: `Key: ${key}`,
        });
      }
    } else {
      segments.push({ text: JSON.stringify(parsed), locationLabel: "Document" });
    }

    return { segments, metadata: {} };
  }
}
