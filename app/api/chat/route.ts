import { NextRequest } from "next/server";
import { DEFAULT_USER_ID } from "@/src/lib/config/constants";
import { toErrorResponse, NotFoundError } from "@/src/lib/errors/app-error";
import { chatRequestSchema } from "@/src/lib/validation/schemas/chat";
import { retrieveRelevantChunks } from "@/src/core/rag/pipeline/query-pipeline";
import { buildCitationInputs } from "@/src/core/rag/citation/citation-builder";
import { buildRagPrompt, type ContextBlock } from "@/src/core/ai/prompts/rag-prompt";
import { getLLMProvider } from "@/src/core/ai/provider-registry";
import {
  createConversation,
  getConversationById,
  setConversationTitle,
} from "@/src/db/repositories/conversation-repository";
import {
  createAssistantMessageWithCitations,
  createMessage,
  listRecentMessages,
} from "@/src/db/repositories/message-repository";
import { findDocumentNames } from "@/src/db/repositories/document-repository";
import { logger } from "@/src/lib/logging/logger";

export const dynamic = "force-dynamic";

const HISTORY_LIMIT = 10;

function sseFrame(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function POST(request: NextRequest) {
  let body: ReturnType<typeof chatRequestSchema.parse>;
  try {
    body = chatRequestSchema.parse(await request.json());
  } catch (error) {
    return toErrorResponse(error);
  }

  let conversationId = body.conversationId;
  try {
    if (conversationId) {
      const conversation = await getConversationById(conversationId, DEFAULT_USER_ID);
      if (!conversation) {
        throw new NotFoundError("Conversation not found");
      }
    } else {
      const conversation = await createConversation(DEFAULT_USER_ID, body.collectionId);
      conversationId = conversation.id;
      void setConversationTitle(conversationId, body.message.slice(0, 80));
    }
  } catch (error) {
    return toErrorResponse(error);
  }

  const finalConversationId = conversationId;
  await createMessage(finalConversationId, "USER", body.message);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const [scoredChunks, history] = await Promise.all([
          retrieveRelevantChunks(body.message, {
            userId: DEFAULT_USER_ID,
            collectionId: body.collectionId,
            tagIds: body.tagIds,
          }),
          listRecentMessages(finalConversationId, HISTORY_LIMIT),
        ]);

        const documentNames = await findDocumentNames(
          scoredChunks.map((chunk) => chunk.documentId),
          DEFAULT_USER_ID,
        );

        const contextBlocks: ContextBlock[] = scoredChunks.map((chunk, index) => ({
          rank: index + 1,
          documentName: documentNames.get(chunk.documentId) ?? "Unknown document",
          locationLabel: chunk.locationLabel,
          content: chunk.content,
        }));

        const { systemInstruction, prompt } = buildRagPrompt({
          question: body.message,
          contextBlocks,
          history: history
            .slice(0, -1)
            .map((message) => ({ role: message.role as "USER" | "ASSISTANT", content: message.content })),
        });

        const llm = getLLMProvider();
        let fullText = "";

        for await (const delta of llm.streamText({ prompt, systemInstruction })) {
          fullText += delta;
          controller.enqueue(sseFrame("token", { delta }));
        }

        const citationInputs = buildCitationInputs(scoredChunks);
        await createAssistantMessageWithCitations(
          finalConversationId,
          fullText,
          llm.model,
          citationInputs,
        );

        controller.enqueue(
          sseFrame("citations", {
            citations: citationInputs.map((citation, index) => ({
              ...citation,
              documentName: documentNames.get(citation.documentId) ?? "Unknown document",
              content: scoredChunks[index].content,
            })),
          }),
        );
        controller.enqueue(sseFrame("done", { conversationId: finalConversationId }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unexpected error";
        logger.error("api.chat.stream_failed", { error: message });
        controller.enqueue(sseFrame("error", { error: message }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
