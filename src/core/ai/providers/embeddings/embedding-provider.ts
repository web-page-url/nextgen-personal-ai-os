import "server-only";

export type EmbeddingTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

export interface EmbedOptions {
  taskType?: EmbeddingTaskType;
}

/**
 * Every embedding call goes through this interface — never call a vendor
 * SDK directly for embeddings outside the provider that implements it.
 */
export interface EmbeddingProvider {
  readonly name: string;
  readonly model: string;
  readonly dimensions: number;

  embed(texts: string[], options?: EmbedOptions): Promise<number[][]>;
}
