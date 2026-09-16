import { NextResponse } from "next/server";
import { DEFAULT_USER_ID } from "@/src/lib/config/constants";
import { toErrorResponse } from "@/src/lib/errors/app-error";
import { createConversation, listConversations } from "@/src/db/repositories/conversation-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const conversations = await listConversations(DEFAULT_USER_ID);
    return NextResponse.json({ conversations });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST() {
  try {
    const conversation = await createConversation(DEFAULT_USER_ID);
    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
