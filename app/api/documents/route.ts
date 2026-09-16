import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_USER_ID } from "@/src/lib/config/constants";
import { toErrorResponse, AppError } from "@/src/lib/errors/app-error";
import { validateUploadedFile } from "@/src/lib/validation/schemas/document";
import { resolveDocumentType } from "@/src/core/rag/parsing/parser-registry";
import { getStorageProvider } from "@/src/core/storage/local-storage-provider";
import { createDocumentWithVersion, listDocuments } from "@/src/db/repositories/document-repository";
import { getJobQueue } from "@/src/core/jobs/sql-job-queue";
import { UPLOAD_LIMITS } from "@/src/lib/config/constants";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const collectionId = request.nextUrl.searchParams.get("collectionId") ?? undefined;
    const tagId = request.nextUrl.searchParams.get("tagId") ?? undefined;
    const documents = await listDocuments(DEFAULT_USER_ID, { collectionId, tagId });
    return NextResponse.json({ documents });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > UPLOAD_LIMITS.maxFileSizeBytes) {
      throw new AppError(
        `Upload exceeds the ${UPLOAD_LIMITS.maxFileSizeBytes / (1024 * 1024)}MB limit`,
        413,
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new AppError("No file provided");
    }
    validateUploadedFile(file);

    const fileType = resolveDocumentType(file.type, file.name);
    if (!fileType) {
      throw new AppError(`Unsupported file type: ${file.type || file.name}`);
    }

    const collectionId = formData.get("collectionId");

    const extension = file.name.split(".").pop() ?? "";
    const storageKey = `${DEFAULT_USER_ID}/${randomUUID()}${extension ? `.${extension}` : ""}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const storage = getStorageProvider();
    await storage.save(storageKey, buffer);

    const { document, version } = await createDocumentWithVersion({
      userId: DEFAULT_USER_ID,
      filename: storageKey,
      originalName: file.name,
      fileType,
      mimeType: file.type || "application/octet-stream",
      fileSizeBytes: file.size,
      storageKey,
      collectionId: typeof collectionId === "string" ? collectionId : undefined,
    });

    await getJobQueue().enqueue({
      userId: DEFAULT_USER_ID,
      documentId: document.id,
      type: "DOCUMENT_INGESTION",
      payload: { documentVersionId: version.id },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
