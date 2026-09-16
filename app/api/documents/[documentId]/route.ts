import { NextResponse } from "next/server";
import { DEFAULT_USER_ID } from "@/src/lib/config/constants";
import { toErrorResponse, NotFoundError } from "@/src/lib/errors/app-error";
import { deleteDocument, getDocumentById } from "@/src/db/repositories/document-repository";
import { getStorageProvider } from "@/src/core/storage/local-storage-provider";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ documentId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { documentId } = await params;
    const document = await getDocumentById(documentId, DEFAULT_USER_ID);
    if (!document) {
      throw new NotFoundError("Document not found");
    }
    return NextResponse.json({ document });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { documentId } = await params;
    const document = await getDocumentById(documentId, DEFAULT_USER_ID);
    if (!document) {
      throw new NotFoundError("Document not found");
    }

    await deleteDocument(documentId, DEFAULT_USER_ID);

    const storage = getStorageProvider();
    await storage.delete(document.storageKey).catch(() => undefined);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
