import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z, type ZodType } from "zod";
import type {
  GenerateStructuredParams,
  GenerateTextParams,
  LLMProvider,
} from "./llm-provider";

/**
 * The only file in the app allowed to import "@google/genai" for text
 * generation. Everything else depends on the LLMProvider interface.
 */
export class GeminiLLMProvider implements LLMProvider {
  readonly name = "gemini";
  private readonly client: GoogleGenAI;

  constructor(
    apiKey: string,
    readonly model: string,
  ) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateText(params: GenerateTextParams): Promise<string> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: params.prompt,
      config: {
        systemInstruction: params.systemInstruction,
        temperature: params.temperature,
        maxOutputTokens: params.maxOutputTokens,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned an empty response");
    }
    return text;
  }

  async generateStructured<T>(params: GenerateStructuredParams<T>): Promise<T> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: params.prompt,
      config: {
        systemInstruction: params.systemInstruction,
        temperature: params.temperature,
        maxOutputTokens: params.maxOutputTokens,
        responseMimeType: "application/json",
        responseJsonSchema: toJsonSchema(params.schema),
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned an empty structured response");
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(text);
    } catch {
      throw new Error(`Gemini returned invalid JSON: ${text.slice(0, 200)}`);
    }

    return params.schema.parse(parsedJson);
  }

  async *streamText(
    params: GenerateTextParams,
  ): AsyncGenerator<string, void, unknown> {
    const stream = await this.client.models.generateContentStream({
      model: this.model,
      contents: params.prompt,
      config: {
        systemInstruction: params.systemInstruction,
        temperature: params.temperature,
        maxOutputTokens: params.maxOutputTokens,
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        yield text;
      }
    }
  }

  async countTokens(text: string): Promise<number> {
    const response = await this.client.models.countTokens({
      model: this.model,
      contents: text,
    });
    return response.totalTokens ?? 0;
  }
}

function toJsonSchema(schema: ZodType<unknown>): unknown {
  return z.toJSONSchema(schema, { target: "draft-07" });
}
