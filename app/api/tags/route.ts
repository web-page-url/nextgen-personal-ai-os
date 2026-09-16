import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_USER_ID } from "@/src/lib/config/constants";
import { toErrorResponse } from "@/src/lib/errors/app-error";
import { createTagSchema } from "@/src/lib/validation/schemas/collection";
import { findOrCreateTag, listTags } from "@/src/db/repositories/tag-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tags = await listTags(DEFAULT_USER_ID);
    return NextResponse.json({ tags });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = createTagSchema.parse(await request.json());
    const tag = await findOrCreateTag(DEFAULT_USER_ID, body.name);
    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
