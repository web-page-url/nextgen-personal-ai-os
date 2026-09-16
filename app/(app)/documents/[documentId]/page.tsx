"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw, Trash2 } from "lucide-react";
import { api } from "@/src/lib/api-client";
import { StatusPill } from "@/src/components/documents/status-pill";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["documents", documentId],
    queryFn: () => api.getDocument(documentId),
    refetchInterval: (query) => {
      const status = query.state.data?.document.status;
      return status === "UPLOADED" || status === "PROCESSING" ? 2000 : false;
    },
  });

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["documents", documentId] });

  const remove = useMutation({
    mutationFn: () => api.deleteDocument(documentId),
    onSuccess: () => {
      toast.success("Document deleted");
      router.push("/documents");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reprocess = useMutation({
    mutationFn: () => api.reprocessDocument(documentId),
    onSuccess: () => {
      toast.success("Reprocessing started");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const document = data?.document;
  if (!document) {
    return <p className="text-sm text-muted-foreground">Document not found.</p>;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl tracking-tight">{document.originalName}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusPill status={document.status} />
            <span className="text-sm text-muted-foreground">
              {document.fileType} &middot; {formatBytes(document.fileSizeBytes)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => reprocess.mutate()} disabled={reprocess.isPending}>
            <RefreshCw className="size-4" /> Reprocess
          </Button>
          <Button variant="destructive" onClick={() => remove.mutate()} disabled={remove.isPending}>
            <Trash2 className="size-4" /> Delete
          </Button>
        </div>
      </div>

      {document.status === "FAILED" && document.errorMessage && (
        <Alert variant="destructive">
          <AlertTitle>Processing failed</AlertTitle>
          <AlertDescription>{document.errorMessage}</AlertDescription>
        </Alert>
      )}

      <Card className="border-none bg-card shadow-none">
        <CardHeader>
          <CardTitle className="font-heading text-lg font-normal">Processing history</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {document.jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No processing jobs yet.</p>
          ) : (
            document.jobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between text-sm">
                <span>{new Date(job.createdAt).toLocaleString()}</span>
                <span
                  className={
                    job.status === "FAILED"
                      ? "text-destructive"
                      : job.status === "COMPLETED"
                        ? "text-success"
                        : "text-muted-foreground"
                  }
                >
                  {job.status}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {document.currentVersion?.extractedText && (
        <Card className="border-none bg-card shadow-none">
          <CardHeader>
            <CardTitle className="font-heading text-lg font-normal">Extracted text preview</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-80 overflow-y-auto rounded-md bg-muted p-4 font-mono text-xs whitespace-pre-wrap">
              {document.currentVersion.extractedText.slice(0, 4000)}
              {document.currentVersion.extractedText.length > 4000 ? "…" : ""}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
