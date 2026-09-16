import { describe, expect, it } from "vitest";
import { rerankByLexicalOverlap } from "./reranker";
import type { ScoredChunk } from "./vector-store";

function makeChunk(overrides: Partial<ScoredChunk>): ScoredChunk {
  return {
    chunkId: "chunk-1",
    documentId: "doc-1",
    chunkIndex: 0,
    content: "",
    pageNumber: null,
    sectionPath: null,
    locationLabel: "Document",
    score: 0.5,
    ...overrides,
  };
}

describe("rerankByLexicalOverlap", () => {
  it("boosts a lower-similarity chunk that contains exact query terms", () => {
    const chunks: ScoredChunk[] = [
      makeChunk({ chunkId: "semantic-only", content: "unrelated filler text", score: 0.6 }),
      makeChunk({ chunkId: "exact-match", content: "car insurance expiration date", score: 0.5 }),
    ];

    const reranked = rerankByLexicalOverlap("car insurance expiration", chunks);

    expect(reranked[0].chunkId).toBe("exact-match");
  });

  it("returns chunks unchanged when the query has no usable terms", () => {
    const chunks: ScoredChunk[] = [makeChunk({ chunkId: "a" }), makeChunk({ chunkId: "b" })];
    const reranked = rerankByLexicalOverlap("   ", chunks);
    expect(reranked).toEqual(chunks);
  });
});
