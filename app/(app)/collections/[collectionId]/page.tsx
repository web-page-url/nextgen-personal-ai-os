"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { api } from "@/src/lib/api-client";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { UploadDropzone } from "@/src/components/documents/upload-dropzone";
import { DocumentCard } from "@/src/components/documents/document-card";

export default function CollectionDetailPage({
  params,
}: {
  params: Promise<{ collectionId: string }>;
}) {
  const { collectionId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["collections", collectionId],
    queryFn: () => api.getCollection(collectionId),
  });

  const remove = useMutation({
    mutationFn: () => api.deleteCollection(collectionId),
    onSuccess: () => {
      toast.success("Collection deleted");
      void queryClient.invalidateQueries({ queryKey: ["collections"] });
      router.push("/collections");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const collection = data?.collection;
  if (!collection) {
    return <p className="text-sm text-muted-foreground">Collection not found.</p>;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl tracking-tight">{collection.name}</h2>
          {collection.description && (
            <p className="mt-1 text-sm text-muted-foreground">{collection.description}</p>
          )}
        </div>
        <Button variant="destructive" onClick={() => remove.mutate()} disabled={remove.isPending}>
          <Trash2 className="size-4" /> Delete
        </Button>
      </div>

      <UploadDropzone collectionId={collectionId} />

      <div className="flex flex-col gap-3">
        {collection.documents.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No documents in this collection yet.
          </p>
        ) : (
          collection.documents.map((doc) => <DocumentCard key={doc.id} document={doc} />)
        )}
      </div>
    </div>
  );
}
