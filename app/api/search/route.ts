import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_USER_ID } from "@/src/lib/config/constants";
import { toErrorResponse } from "@/src/lib/errors/app-error";
import { searchRequestSchema } from "@/src/lib/validation/schemas/search";
import { retrieveRelevantChunks } from "@/src/core/rag/pipeline/query-pipeline";
import { findDocumentNames } from "@/src/db/repositories/document-repository";

export const dynamic = "force-dynamic";

/**
 * No LLM call — pure semantic search over the same RAG engine /api/chat
 * uses. This is what proves the retrieval core is reusable beyond chat,
 * and what Life Library will call later.
 */
export async function POST(request: NextRequest) {
  try {
    const body = searchRequestSchema.parse(await request.json());

    const results = await retrieveRelevantChunks(body.query, {
      userId: DEFAULT_USER_ID,
      collectionId: body.collectionId,
      tagIds: body.tagIds,
    });

    const documentNames = await findDocumentNames(
      results.map((result) => result.documentId),
      DEFAULT_USER_ID,
    );

    return NextResponse.json({
      results: results.map((result) => ({
        ...result,
        documentName: documentNames.get(result.documentId) ?? "Unknown document",
      })),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
