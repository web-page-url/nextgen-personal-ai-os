import "server-only";
import type { ZodType } from "zod";

export interface GenerateTextParams {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GenerateStructuredParams<T> extends GenerateTextParams {
  schema: ZodType<T>;
}

/**
 * Every LLM call in the app goes through this interface — never call a
 * vendor SDK (e.g. @google/genai) outside the provider that implements it.
 */
export interface LLMProvider {
  readonly name: string;
  readonly model: string;

  generateText(params: GenerateTextParams): Promise<string>;
  generateStructured<T>(params: GenerateStructuredParams<T>): Promise<T>;
  streamText(params: GenerateTextParams): AsyncGenerator<string, void, unknown>;
  countTokens(text: string): Promise<number>;
}
