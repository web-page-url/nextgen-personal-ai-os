import "server-only";
import { RAG_SYSTEM_PROMPT } from "./system-prompts";

export interface ContextBlock {
  rank: number;
  documentName: string;
  locationLabel: string;
  content: string;
}

export interface HistoryMessage {
  role: "USER" | "ASSISTANT";
  content: string;
}

export interface RagPrompt {
  systemInstruction: string;
  prompt: string;
}

/** Assembles numbered context + recent history + the question into a single prompt for LLMProvider.streamText/generateText. */
export function buildRagPrompt(params: {
  question: string;
  contextBlocks: ContextBlock[];
  history?: HistoryMessage[];
}): RagPrompt {
  const contextSection =
    params.contextBlocks.length > 0
      ? params.contextBlocks
          .map(
            (block) =>
              `[${block.rank}] Source: ${block.documentName} (${block.locationLabel})\n${block.content}`,
          )
          .join("\n\n")
      : "(No relevant documents were found for this question.)";

  const historySection = (params.history ?? [])
    .map((message) => `${message.role === "USER" ? "User" : "Assistant"}: ${message.content}`)
    .join("\n");

  const prompt = [
    "## Context from your documents",
    contextSection,
    historySection ? "## Recent conversation" : "",
    historySection,
    "## Question",
    params.question,
  ]
    .filter(Boolean)
    .join("\n\n");

  return { systemInstruction: RAG_SYSTEM_PROMPT, prompt };
}
