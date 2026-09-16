import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

const generateContent = vi.fn();
const generateContentStream = vi.fn();
const countTokens = vi.fn();

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(function GoogleGenAIMock() {
    return { models: { generateContent, generateContentStream, countTokens } };
  }),
}));

const { GeminiLLMProvider } = await import("./gemini-llm-provider");

describe("GeminiLLMProvider", () => {
  it("generateText returns the response's text", async () => {
    generateContent.mockResolvedValueOnce({ text: "Hello there" });
    const provider = new GeminiLLMProvider("test-key", "gemini-flash-latest");

    const result = await provider.generateText({ prompt: "hi" });

    expect(result).toBe("Hello there");
    expect(generateContent).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gemini-flash-latest", contents: "hi" }),
    );
  });

  it("generateText throws on an empty response instead of returning empty text", async () => {
    generateContent.mockResolvedValueOnce({ text: "" });
    const provider = new GeminiLLMProvider("test-key", "gemini-flash-latest");

    await expect(provider.generateText({ prompt: "hi" })).rejects.toThrow(/empty response/i);
  });

  it("generateStructured parses and validates JSON against the given schema", async () => {
    generateContent.mockResolvedValueOnce({ text: JSON.stringify({ name: "Alice", age: 30 }) });
    const provider = new GeminiLLMProvider("test-key", "gemini-flash-latest");
    const schema = z.object({ name: z.string(), age: z.number() });

    const result = await provider.generateStructured({ prompt: "extract", schema });

    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  it("generateStructured rejects a response that doesn't match the schema", async () => {
    generateContent.mockResolvedValueOnce({ text: JSON.stringify({ name: "Alice" }) });
    const provider = new GeminiLLMProvider("test-key", "gemini-flash-latest");
    const schema = z.object({ name: z.string(), age: z.number() });

    await expect(provider.generateStructured({ prompt: "extract", schema })).rejects.toThrow();
  });

  it("streamText yields each non-empty chunk's text", async () => {
    generateContentStream.mockResolvedValueOnce(
      (async function* () {
        yield { text: "Hello " };
        yield { text: "" };
        yield { text: "world" };
      })(),
    );
    const provider = new GeminiLLMProvider("test-key", "gemini-flash-latest");

    const chunks: string[] = [];
    for await (const chunk of provider.streamText({ prompt: "hi" })) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(["Hello ", "world"]);
  });

  it("countTokens returns 0 when the API omits totalTokens", async () => {
    countTokens.mockResolvedValueOnce({});
    const provider = new GeminiLLMProvider("test-key", "gemini-flash-latest");

    expect(await provider.countTokens("hi")).toBe(0);
  });
});
