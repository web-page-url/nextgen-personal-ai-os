import { describe, expect, it } from "vitest";
import { buildCitationInputs } from "./citation-builder";
import type { ScoredChunk } from "../retrieval/vector-store";

describe("buildCitationInputs", () => {
  it("numbers citations by array order and carries location metadata", () => {
    const chunks: ScoredChunk[] = [
      {
        chunkId: "c1",
        documentId: "d1",
        chunkIndex: 3,
        content: "text",
        pageNumber: 4,
        sectionPath: null,
        locationLabel: "Page 4",
        score: 0.9,
      },
      {
        chunkId: "c2",
        documentId: "d2",
        chunkIndex: 0,
        content: "text",
        pageNumber: null,
        sectionPath: "Coverage > Limits",
        locationLabel: "Section: Coverage > Limits",
        score: 0.8,
      },
    ];

    const citations = buildCitationInputs(chunks);

    expect(citations).toEqual([
      { documentId: "d1", chunkId: "c1", similarityScore: 0.9, rank: 1, locationLabel: "Page 4" },
      {
        documentId: "d2",
        chunkId: "c2",
        similarityScore: 0.8,
        rank: 2,
        locationLabel: "Section: Coverage > Limits",
      },
    ]);
  });

  it("returns an empty array for no retrieved chunks", () => {
    expect(buildCitationInputs([])).toEqual([]);
  });
});
