import { describe, expect, it, vi } from "vitest";

const embedContent = vi.fn();

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(function GoogleGenAIMock() {
    return { models: { embedContent } };
  }),
}));

const { GeminiEmbeddingProvider } = await import("./gemini-embedding-provider");

describe("GeminiEmbeddingProvider", () => {
  it("returns embeddings in the same order as the input batch", async () => {
    embedContent.mockResolvedValueOnce({
      embeddings: [{ values: [0.1, 0.2] }, { values: [0.3, 0.4] }],
    });
    const provider = new GeminiEmbeddingProvider("test-key", "gemini-embedding-001", 2);

    const result = await provider.embed(["first", "second"]);

    expect(result).toEqual([
      [0.1, 0.2],
      [0.3, 0.4],
    ]);
    expect(embedContent).toHaveBeenCalledWith(
      expect.objectContaining({ contents: ["first", "second"] }),
    );
  });

  it("returns an empty array without calling the API for an empty batch", async () => {
    const provider = new GeminiEmbeddingProvider("test-key", "gemini-embedding-001", 2);
    expect(await provider.embed([])).toEqual([]);
    expect(embedContent).not.toHaveBeenCalled();
  });

  it("throws when the API returns a mismatched number of embeddings", async () => {
    embedContent.mockResolvedValueOnce({ embeddings: [{ values: [0.1] }] });
    const provider = new GeminiEmbeddingProvider("test-key", "gemini-embedding-001", 1);

    await expect(provider.embed(["a", "b"])).rejects.toThrow(/mismatch/i);
  });
});
