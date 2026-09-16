"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FolderKanban } from "lucide-react";
import { api } from "@/src/lib/api-client";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { CreateCollectionDialog } from "@/src/components/collections/create-collection-dialog";

export default function CollectionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["collections"],
    queryFn: () => api.listCollections(),
  });

  const collections = data?.collections ?? [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Group related documents together to filter search and chat.
        </p>
        <CreateCollectionDialog />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No collections yet. Create one to start organizing your documents.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {collections.map((collection) => (
            <Link key={collection.id} href={`/collections/${collection.id}`}>
              <Card className="h-full border-border bg-card shadow-none transition-colors hover:border-primary/40">
                <CardContent className="flex items-start gap-3 px-4 py-4">
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${collection.color ?? "#cc785c"}26` }}
                  >
                    <FolderKanban className="size-4" style={{ color: collection.color ?? "#cc785c" }} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{collection.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {collection._count.documents} document{collection._count.documents === 1 ? "" : "s"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
