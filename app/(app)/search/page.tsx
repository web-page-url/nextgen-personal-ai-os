"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { Search as SearchIcon, FileText } from "lucide-react";
import { api, type SearchResult } from "@/src/lib/api-client";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";

export default function SearchPage() {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[] | null>(null);

  const search = useMutation({
    mutationFn: (q: string) => api.search({ query: q }),
    onSuccess: (data) => setResults(data.results),
  });

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    search.mutate(query.trim());
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <form onSubmit={onSubmit} className="relative">
        <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search across everything you've uploaded…"
          className="h-11 pl-9"
        />
      </form>

      {search.isPending && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!search.isPending && results && results.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No matching passages found. Try rephrasing your search.
        </p>
      )}

      {!search.isPending && results && results.length > 0 && (
        <div className="flex flex-col gap-3">
          {results.map((result) => (
            <Card key={result.chunkId} className="border-none bg-card shadow-none">
              <CardContent className="flex flex-col gap-2 px-4 py-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="size-4 text-muted-foreground" />
                    {result.documentName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {result.locationLabel} &middot; {(result.score * 100).toFixed(0)}% match
                  </span>
                </div>
                <p className="line-clamp-4 text-sm text-muted-foreground">{result.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
