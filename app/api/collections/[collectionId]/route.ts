import { NextResponse } from "next/server";
import { DEFAULT_USER_ID } from "@/src/lib/config/constants";
import { toErrorResponse, NotFoundError } from "@/src/lib/errors/app-error";
import { deleteCollection, getCollectionById } from "@/src/db/repositories/collection-repository";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ collectionId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { collectionId } = await params;
    const collection = await getCollectionById(collectionId, DEFAULT_USER_ID);
    if (!collection) {
      throw new NotFoundError("Collection not found");
    }
    return NextResponse.json({ collection });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { collectionId } = await params;
    await deleteCollection(collectionId, DEFAULT_USER_ID);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
