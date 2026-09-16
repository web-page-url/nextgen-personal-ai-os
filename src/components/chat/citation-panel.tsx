"use client";

import * as React from "react";
import { FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Card, CardContent } from "@/src/components/ui/card";
import { api } from "@/src/lib/api-client";
import type { UiCitation } from "./types";

function CitationSourceCard({ citation }: { citation: UiCitation }) {
  const [expanded, setExpanded] = React.useState(false);

  const { data, isFetching } = useQuery({
    queryKey: ["chunk-context", citation.chunkId],
    queryFn: () => api.getChunkContext(citation.chunkId),
    enabled: expanded,
  });

  return (
    <Card className="border-none bg-[#181715] text-[#faf9f5] shadow-none">
      <CardContent className="flex flex-col gap-2 px-4 py-3">
        <div className="flex items-center justify-between gap-2 text-xs text-[#a09d96]">
          <span className="flex items-center gap-1.5 font-medium text-[#faf9f5]">
            <FileText className="size-3.5" />
            {citation.documentName}
          </span>
          <span>{citation.locationLabel}</span>
        </div>

        {!expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="cursor-pointer text-left font-mono text-xs leading-relaxed text-[#d8d5cc] line-clamp-4 hover:text-[#faf9f5]"
          >
            {citation.content}
          </button>
        ) : (
          <div className="font-mono text-xs leading-relaxed text-[#d8d5cc]">
            {isFetching && <p className="text-[#a09d96]">Loading surrounding context…</p>}
            {data?.neighbors.map((neighbor) => (
              <p
                key={neighbor.id}
                className={
                  neighbor.id === citation.chunkId
                    ? "mb-2 rounded bg-white/5 p-1.5 text-[#faf9f5]"
                    : "mb-2 p-1.5"
                }
              >
                {neighbor.content}
              </p>
            ))}
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-[10px] text-[#a09d96] underline hover:text-[#faf9f5]"
            >
              Collapse
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CitationPanel({ citations }: { citations: UiCitation[] | null }) {
  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-3 p-4">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Sources</p>
        {!citations || citations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sources for the answer you select will appear here.
          </p>
        ) : (
          citations.map((citation) => <CitationSourceCard key={citation.chunkId} citation={citation} />)
        )}
      </div>
    </ScrollArea>
  );
}
