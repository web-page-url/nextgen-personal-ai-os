"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { api } from "@/src/lib/api-client";
import { streamChat, type StreamedCitation } from "@/src/lib/chat-stream";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { ConversationList } from "./conversation-list";
import { CitationPanel } from "./citation-panel";
import { MessageBubble } from "./message-bubble";
import type { UiCitation, UiMessage } from "./types";

type RawCitation = Pick<
  StreamedCitation,
  "chunkId" | "documentId" | "documentName" | "locationLabel" | "content"
> & { rank: number | null; similarityScore: number | null };

function toUiCitations(citations: RawCitation[]): UiCitation[] {
  return citations
    .map((citation) => ({
      chunkId: citation.chunkId,
      documentId: citation.documentId,
      documentName: citation.documentName,
      locationLabel: citation.locationLabel,
      content: citation.content,
      rank: citation.rank ?? 0,
      score: citation.similarityScore ?? 0,
    }))
    .sort((a, b) => a.rank - b.rank);
}

function paneVisibility(active: string, pane: string, extra = ""): string {
  return `${active === pane ? "flex" : "hidden"} md:flex flex-col ${extra}`;
}

export function ChatView({ conversationId }: { conversationId?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [liveMessages, setLiveMessages] = React.useState<UiMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [manualActiveId, setManualActiveId] = React.useState<string | null>(null);
  const [mobilePane, setMobilePane] = React.useState<"conversations" | "chat" | "sources">("chat");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const { data: conversationData } = useQuery({
    queryKey: ["conversations", conversationId],
    queryFn: () => api.getConversation(conversationId as string),
    enabled: Boolean(conversationId),
  });

  const historicalMessages = React.useMemo<UiMessage[]>(() => {
    if (!conversationData?.conversation) return [];
    return conversationData.conversation.messages.map((message) => ({
      id: message.id,
      role: message.role === "USER" ? "USER" : "ASSISTANT",
      content: message.content,
      citations: toUiCitations(
        message.citations.map((citation) => ({
          chunkId: citation.chunkId,
          documentId: citation.documentId,
          documentName: citation.document.originalName,
          locationLabel: citation.locationLabel,
          content: citation.chunk.content,
          rank: citation.rank,
          similarityScore: citation.similarityScore,
        })),
      ),
    }));
  }, [conversationData]);

  const messages = React.useMemo(
    () => [...historicalMessages, ...liveMessages],
    [historicalMessages, liveMessages],
  );

  const activeMessage = React.useMemo(() => {
    if (manualActiveId) {
      return messages.find((message) => message.id === manualActiveId) ?? null;
    }
    return [...messages].reverse().find((message) => message.citations.length > 0) ?? null;
  }, [manualActiveId, messages]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    setIsStreaming(true);

    const userMessage: UiMessage = {
      id: `local-user-${Date.now()}`,
      role: "USER",
      content: text,
      citations: [],
    };
    const assistantId = `local-assistant-${Date.now()}`;
    setLiveMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: "ASSISTANT", content: "", citations: [] },
    ]);

    await streamChat(
      { conversationId, message: text },
      {
        onToken: (delta) => {
          setLiveMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId ? { ...message, content: message.content + delta } : message,
            ),
          );
        },
        onCitations: (citations) => {
          const uiCitations = toUiCitations(citations);
          setLiveMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId ? { ...message, citations: uiCitations } : message,
            ),
          );
          setManualActiveId(assistantId);
        },
        onDone: (newConversationId) => {
          setIsStreaming(false);
          void queryClient.invalidateQueries({ queryKey: ["conversations"] });
          if (!conversationId) {
            router.replace(`/chat/${newConversationId}`);
          }
        },
        onError: (message) => {
          setIsStreaming(false);
          setLiveMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: `Error: ${message}` } : m)),
          );
        },
      },
    );
  };

  return (
    <div className="flex h-[75vh] flex-col gap-3 md:h-[calc(100svh-9rem)]">
      <div className="flex gap-2 md:hidden">
        {(["conversations", "chat", "sources"] as const).map((pane) => (
          <Button
            key={pane}
            size="sm"
            variant={mobilePane === pane ? "default" : "secondary"}
            onClick={() => setMobilePane(pane)}
            className="flex-1 capitalize"
          >
            {pane}
          </Button>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden md:grid-cols-[220px_1fr_280px]">
        <div className={paneVisibility(mobilePane, "conversations", "rounded-lg border border-border bg-sidebar")}>
          <ConversationList activeConversationId={conversationId} onNavigate={() => setMobilePane("chat")} />
        </div>

        <div className={paneVisibility(mobilePane, "chat", "rounded-lg border border-border bg-background")}>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                Ask a question about your documents.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isActive={message.id === activeMessage?.id}
                    onSelectCitations={() => {
                      setManualActiveId(message.id);
                      setMobilePane("sources");
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="flex items-end gap-2 border-t border-border p-3">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="Ask about your documents…"
              className="min-h-11 flex-1 resize-none"
              disabled={isStreaming}
            />
            <Button size="icon" onClick={() => void handleSend()} disabled={isStreaming || !input.trim()}>
              <Send className="size-4" />
            </Button>
          </div>
        </div>

        <div className={paneVisibility(mobilePane, "sources", "overflow-hidden rounded-lg border border-border bg-[#181715]")}>
          <CitationPanel citations={activeMessage?.citations ?? null} />
        </div>
      </div>
    </div>
  );
}
