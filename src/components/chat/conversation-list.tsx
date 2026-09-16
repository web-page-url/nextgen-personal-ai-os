"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, MessageSquare } from "lucide-react";
import { api } from "@/src/lib/api-client";
import { Button } from "@/src/components/ui/button";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { cn } from "@/src/lib/utils";

export function ConversationList({
  activeConversationId,
  onNavigate,
}: {
  activeConversationId?: string;
  onNavigate?: () => void;
}) {
  const { data } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.listConversations(),
  });

  const conversations = data?.conversations ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Button asChild className="w-full justify-start" variant="secondary">
          <Link href="/chat" onClick={onNavigate}>
            <Plus className="size-4" /> New chat
          </Link>
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 px-3 pb-3">
          {conversations.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">No conversations yet.</p>
          )}
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/chat/${conversation.id}`}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 truncate rounded-md px-2 py-2 text-sm transition-colors",
                conversation.id === activeConversationId
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60",
              )}
            >
              <MessageSquare className="size-3.5 shrink-0" />
              <span className="truncate">{conversation.title ?? "Untitled conversation"}</span>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
