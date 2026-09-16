import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_USER_ID } from "@/src/lib/config/constants";
import { toErrorResponse } from "@/src/lib/errors/app-error";
import { createCollectionSchema } from "@/src/lib/validation/schemas/collection";
import { createCollection, listCollections } from "@/src/db/repositories/collection-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const collections = await listCollections(DEFAULT_USER_ID);
    return NextResponse.json({ collections });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = createCollectionSchema.parse(await request.json());
    const collection = await createCollection(DEFAULT_USER_ID, body.name, body.color, body.description);
    return NextResponse.json({ collection }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
