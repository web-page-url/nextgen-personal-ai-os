import { NextResponse } from "next/server";
import { DEFAULT_USER_ID } from "@/src/lib/config/constants";
import { toErrorResponse, NotFoundError } from "@/src/lib/errors/app-error";
import { getConversationWithMessages } from "@/src/db/repositories/conversation-repository";
import { prisma } from "@/src/db/client";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ conversationId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { conversationId } = await params;
    const conversation = await getConversationWithMessages(conversationId, DEFAULT_USER_ID);
    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }
    return NextResponse.json({ conversation });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { conversationId } = await params;
    await prisma.conversation.deleteMany({ where: { id: conversationId, userId: DEFAULT_USER_ID } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
