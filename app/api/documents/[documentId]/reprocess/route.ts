import { NextResponse } from "next/server";
import { DEFAULT_USER_ID } from "@/src/lib/config/constants";
import { toErrorResponse, NotFoundError } from "@/src/lib/errors/app-error";
import { createReprocessVersion, getDocumentById } from "@/src/db/repositories/document-repository";
import { getJobQueue } from "@/src/core/jobs/sql-job-queue";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ documentId: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { documentId } = await params;
    const document = await getDocumentById(documentId, DEFAULT_USER_ID);
    if (!document) {
      throw new NotFoundError("Document not found");
    }

    const version = await createReprocessVersion(documentId, DEFAULT_USER_ID);

    await getJobQueue().enqueue({
      userId: DEFAULT_USER_ID,
      documentId,
      type: "DOCUMENT_REPROCESS",
      payload: { documentVersionId: version.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
