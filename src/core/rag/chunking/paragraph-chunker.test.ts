import { describe, expect, it } from "vitest";
import { ParagraphChunker } from "./paragraph-chunker";
import type { ParsedDocument } from "../parsing/document-parser";

const chunker = new ParagraphChunker();

describe("ParagraphChunker", () => {
  it("keeps a whole short segment as a single chunk", () => {
    const document: ParsedDocument = {
      segments: [{ text: "First paragraph.\n\nSecond paragraph.", pageNumber: 1, locationLabel: "Page 1" }],
      metadata: {},
    };

    const chunks = chunker.chunk(document, { chunkSize: 1000, chunkOverlap: 100 });

    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toContain("First paragraph.");
    expect(chunks[0].text).toContain("Second paragraph.");
    expect(chunks[0].pageNumber).toBe(1);
    expect(chunks[0].locationLabel).toBe("Page 1");
  });

  it("never merges chunks across a segment boundary", () => {
    const document: ParsedDocument = {
      segments: [
        { text: "Page one content.", pageNumber: 1, locationLabel: "Page 1" },
        { text: "Page two content.", pageNumber: 2, locationLabel: "Page 2" },
      ],
      metadata: {},
    };

    const chunks = chunker.chunk(document, { chunkSize: 1000, chunkOverlap: 100 });

    expect(chunks).toHaveLength(2);
    expect(chunks[0].pageNumber).toBe(1);
    expect(chunks[1].pageNumber).toBe(2);
    expect(chunks.map((c) => c.chunkIndex)).toEqual([0, 1]);
  });

  it("splits a segment into multiple chunks once chunkSize is exceeded", () => {
    const paragraphs = Array.from({ length: 5 }, (_, i) => `Paragraph ${i} `.repeat(20));
    const document: ParsedDocument = {
      segments: [{ text: paragraphs.join("\n\n"), locationLabel: "Document" }],
      metadata: {},
    };

    const chunks = chunker.chunk(document, { chunkSize: 200, chunkOverlap: 50 });

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.text.length).toBeGreaterThan(0);
    }
  });

  it("falls back to a hard split for a single paragraph larger than chunkSize", () => {
    const hugeParagraph = "word ".repeat(500);
    const document: ParsedDocument = {
      segments: [{ text: hugeParagraph, locationLabel: "Document" }],
      metadata: {},
    };

    const chunks = chunker.chunk(document, { chunkSize: 300, chunkOverlap: 50 });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.text.length <= 300)).toBe(true);
  });

  it("carries overlap forward between consecutive chunks in the same segment", () => {
    const paragraphs = ["Alpha paragraph text here.", "Beta paragraph text here.", "Gamma paragraph text here."];
    const document: ParsedDocument = {
      segments: [{ text: paragraphs.join("\n\n"), locationLabel: "Document" }],
      metadata: {},
    };

    const chunks = chunker.chunk(document, { chunkSize: 40, chunkOverlap: 30 });

    expect(chunks.length).toBeGreaterThan(1);
    // The overlap paragraph carried into chunk 2 should also appear in chunk 1.
    const overlapCandidate = chunks[1].text.split("\n\n")[0];
    expect(chunks[0].text).toContain(overlapCandidate);
  });
});
