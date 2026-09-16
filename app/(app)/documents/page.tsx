"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api-client";
import { UploadDropzone } from "@/src/components/documents/upload-dropzone";
import { DocumentCard } from "@/src/components/documents/document-card";
import { Skeleton } from "@/src/components/ui/skeleton";

export default function DocumentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => api.listDocuments(),
    refetchInterval: (query) => {
      const documents = query.state.data?.documents ?? [];
      const hasInFlight = documents.some((doc) => doc.status === "UPLOADED" || doc.status === "PROCESSING");
      return hasInFlight ? 2000 : false;
    },
  });

  const documents = data?.documents ?? [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <UploadDropzone />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No documents yet. Upload one above to get started.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {documents.map((document) => (
            <DocumentCard key={document.id} document={document} />
          ))}
        </div>
      )}
    </div>
  );
}
