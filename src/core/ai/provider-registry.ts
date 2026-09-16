import "server-only";
import { env } from "@/src/lib/config/env";
import type { LLMProvider } from "./providers/llm/llm-provider";
import { GeminiLLMProvider } from "./providers/llm/gemini-llm-provider";
import type { EmbeddingProvider } from "./providers/embeddings/embedding-provider";
import { GeminiEmbeddingProvider } from "./providers/embeddings/gemini-embedding-provider";

type GlobalWithProviders = typeof globalThis & {
  __llmProvider?: LLMProvider;
  __embeddingProvider?: EmbeddingProvider;
};

const globalForProviders = globalThis as GlobalWithProviders;

function requireGeminiApiKey(): string {
  if (!env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env before using AI features.",
    );
  }
  return env.GEMINI_API_KEY;
}

/**
 * Resolves the active LLM provider from configuration. Gemini is the only
 * implementation today, but application code should only ever depend on
 * this function and the LLMProvider interface — never on Gemini directly.
 */
export function getLLMProvider(): LLMProvider {
  if (globalForProviders.__llmProvider) {
    return globalForProviders.__llmProvider;
  }

  let provider: LLMProvider;
  switch (env.AI_PROVIDER) {
    case "gemini":
      provider = new GeminiLLMProvider(requireGeminiApiKey(), env.GEMINI_MODEL);
      break;
    default:
      throw new Error(`Unsupported AI_PROVIDER: ${env.AI_PROVIDER}`);
  }

  globalForProviders.__llmProvider = provider;
  return provider;
}

/**
 * Resolves the active embedding provider from configuration. Same rule as
 * getLLMProvider(): depend on this function and EmbeddingProvider, not on
 * any vendor SDK.
 */
export function getEmbeddingProvider(): EmbeddingProvider {
  if (globalForProviders.__embeddingProvider) {
    return globalForProviders.__embeddingProvider;
  }

  let provider: EmbeddingProvider;
  switch (env.EMBEDDING_PROVIDER) {
    case "gemini":
      provider = new GeminiEmbeddingProvider(
        requireGeminiApiKey(),
        env.EMBEDDING_MODEL,
        env.EMBEDDING_DIMENSIONS,
      );
      break;
    default:
      throw new Error(`Unsupported EMBEDDING_PROVIDER: ${env.EMBEDDING_PROVIDER}`);
  }

  globalForProviders.__embeddingProvider = provider;
  return provider;
}
