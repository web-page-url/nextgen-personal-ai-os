"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/src/lib/utils";
import type { UiMessage } from "./types";

export function MessageBubble({
  message,
  onSelectCitations,
  isActive,
}: {
  message: UiMessage;
  onSelectCitations?: () => void;
  isActive?: boolean;
}) {
  const isUser = message.role === "USER";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-4 py-3 text-sm",
          isUser ? "bg-card text-card-foreground" : "bg-transparent",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content || "…"}</ReactMarkdown>
          </div>
        )}

        {message.citations.length > 0 && (
          <button
            type="button"
            onClick={onSelectCitations}
            className={cn(
              "mt-2 flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
              isActive
                ? "border-primary text-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary",
            )}
          >
            {message.citations.length} source{message.citations.length === 1 ? "" : "s"}
          </button>
        )}
      </div>
    </div>
  );
}
