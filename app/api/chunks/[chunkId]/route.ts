import { NextResponse } from "next/server";
import { DEFAULT_USER_ID } from "@/src/lib/config/constants";
import { toErrorResponse, NotFoundError } from "@/src/lib/errors/app-error";
import { findChunkById, findNeighboringChunks } from "@/src/db/repositories/chunk-repository";
import { findDocumentNames } from "@/src/db/repositories/document-repository";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ chunkId: string }>;
}

/** Citation click-through: the chunk plus its immediate neighbors (chunkIndex ± 1) for surrounding context. */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { chunkId } = await params;
    const chunk = await findChunkById(chunkId, DEFAULT_USER_ID);
    if (!chunk) {
      throw new NotFoundError("Chunk not found");
    }

    const neighbors = await findNeighboringChunks(
      chunk.documentVersionId,
      chunk.chunkIndex,
      DEFAULT_USER_ID,
    );
    const documentNames = await findDocumentNames([chunk.documentId], DEFAULT_USER_ID);

    return NextResponse.json({
      documentName: documentNames.get(chunk.documentId) ?? "Unknown document",
      chunk,
      neighbors,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
