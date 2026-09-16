"use client";

import Link from "next/link";
import { FileText, MoreVertical, RefreshCw, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Button } from "@/src/components/ui/button";
import { StatusPill } from "./status-pill";
import { api, type DocumentSummary } from "@/src/lib/api-client";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentCard({ document }: { document: DocumentSummary }) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["documents"] });
    void queryClient.invalidateQueries({ queryKey: ["collections"] });
  };

  const remove = useMutation({
    mutationFn: () => api.deleteDocument(document.id),
    onSuccess: () => {
      toast.success(`Deleted ${document.originalName}`);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reprocess = useMutation({
    mutationFn: () => api.reprocessDocument(document.id),
    onSuccess: () => {
      toast.success("Reprocessing started");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Card className="border-border bg-card shadow-none transition-colors hover:border-primary/40">
      <CardContent className="flex items-start justify-between gap-3 px-4 py-4">
        <Link href={`/documents/${document.id}`} className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
            <FileText className="size-4 text-muted-foreground" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{document.originalName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-[10px] uppercase">
                {document.fileType}
              </Badge>
              <span className="text-xs text-muted-foreground">{formatBytes(document.fileSizeBytes)}</span>
              <StatusPill status={document.status} />
            </div>
          </div>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Document actions">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => reprocess.mutate()} disabled={reprocess.isPending}>
              <RefreshCw className="size-4" /> Reprocess
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
            >
              <Trash2 className="size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}
