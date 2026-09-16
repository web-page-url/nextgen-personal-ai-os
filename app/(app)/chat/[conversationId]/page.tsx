"use client";

import { use } from "react";
import { ChatView } from "@/src/components/chat/chat-view";

export default function ChatConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  return <ChatView key={conversationId} conversationId={conversationId} />;
}
