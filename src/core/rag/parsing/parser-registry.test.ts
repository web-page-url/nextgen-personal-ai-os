import { describe, expect, it } from "vitest";
import { resolveDocumentType } from "./parser-registry";
import { DocumentType } from "@/src/generated/prisma/client";

describe("resolveDocumentType", () => {
  it("resolves by MIME type first", () => {
    expect(resolveDocumentType("application/pdf", "unknown.bin")).toBe(DocumentType.PDF);
    expect(resolveDocumentType("text/csv", "data.bin")).toBe(DocumentType.CSV);
  });

  it("falls back to file extension when MIME type is unrecognized", () => {
    expect(resolveDocumentType("application/octet-stream", "notes.md")).toBe(DocumentType.MD);
    expect(resolveDocumentType("", "lease.docx")).toBe(DocumentType.DOCX);
  });

  it("returns null for unsupported types", () => {
    expect(resolveDocumentType("image/png", "photo.png")).toBeNull();
  });
});
