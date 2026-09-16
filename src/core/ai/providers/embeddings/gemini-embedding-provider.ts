import "server-only";
import { GoogleGenAI } from "@google/genai";
import type {
  EmbedOptions,
  EmbeddingProvider,
} from "./embedding-provider";

/**
 * The only file in the app allowed to import "@google/genai" for
 * embeddings. Everything else depends on the EmbeddingProvider interface.
 */
export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly name = "gemini";
  private readonly client: GoogleGenAI;

  constructor(
    apiKey: string,
    readonly model: string,
    readonly dimensions: number,
  ) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async embed(texts: string[], options?: EmbedOptions): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const response = await this.client.models.embedContent({
      model: this.model,
      contents: texts,
      config: {
        outputDimensionality: this.dimensions,
        taskType: options?.taskType ?? "RETRIEVAL_DOCUMENT",
      },
    });

    const embeddings = response.embeddings;
    if (!embeddings || embeddings.length !== texts.length) {
      throw new Error(
        `Gemini embedding count mismatch: expected ${texts.length}, got ${embeddings?.length ?? 0}`,
      );
    }

    return embeddings.map((embedding, index) => {
      if (!embedding.values) {
        throw new Error(`Gemini returned no embedding values for input ${index}`);
      }
      return embedding.values;
    });
  }
}
