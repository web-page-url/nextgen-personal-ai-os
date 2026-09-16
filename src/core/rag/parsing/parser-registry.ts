import "server-only";
import { DocumentType } from "@/src/generated/prisma/client";
import type { DocumentParser } from "./document-parser";
import { PdfParser } from "./pdf-parser";
import { DocxParser } from "./docx-parser";
import { TextParser } from "./text-parser";
import { MarkdownParser } from "./markdown-parser";
import { CsvParser } from "./csv-parser";
import { JsonParser } from "./json-parser";

const parsers: Record<DocumentType, DocumentParser> = {
  [DocumentType.PDF]: new PdfParser(),
  [DocumentType.DOCX]: new DocxParser(),
  [DocumentType.TXT]: new TextParser(),
  [DocumentType.MD]: new MarkdownParser(),
  [DocumentType.CSV]: new CsvParser(),
  [DocumentType.JSON]: new JsonParser(),
};

const MIME_TO_TYPE: Record<string, DocumentType> = {
  "application/pdf": DocumentType.PDF,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": DocumentType.DOCX,
  "text/plain": DocumentType.TXT,
  "text/markdown": DocumentType.MD,
  "text/csv": DocumentType.CSV,
  "application/json": DocumentType.JSON,
};

const EXTENSION_TO_TYPE: Record<string, DocumentType> = {
  pdf: DocumentType.PDF,
  docx: DocumentType.DOCX,
  txt: DocumentType.TXT,
  md: DocumentType.MD,
  markdown: DocumentType.MD,
  csv: DocumentType.CSV,
  json: DocumentType.JSON,
};

export function resolveDocumentType(mimeType: string, filename: string): DocumentType | null {
  if (MIME_TO_TYPE[mimeType]) {
    return MIME_TO_TYPE[mimeType];
  }
  const extension = filename.split(".").pop()?.toLowerCase();
  return extension ? (EXTENSION_TO_TYPE[extension] ?? null) : null;
}

export function getParser(fileType: DocumentType): DocumentParser {
  return parsers[fileType];
}
