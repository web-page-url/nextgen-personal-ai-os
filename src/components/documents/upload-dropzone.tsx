"use client";

import * as React from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { api } from "@/src/lib/api-client";

const ACCEPT = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
  "text/markdown": [".md"],
  "text/csv": [".csv"],
  "application/json": [".json"],
};

export function UploadDropzone({ collectionId }: { collectionId?: string }) {
  const queryClient = useQueryClient();

  const upload = useMutation({
    mutationFn: (file: File) => api.uploadDocument(file, { collectionId }),
    onSuccess: (data) => {
      toast.success(`Uploaded ${data.document.originalName}`);
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
      void queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        upload.mutate(file);
      }
    },
    [upload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: ACCEPT });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center transition-colors",
        isDragActive ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50",
      )}
    >
      <input {...getInputProps()} />
      <UploadCloud className="size-8 text-muted-foreground" />
      <p className="text-sm font-medium">
        {isDragActive ? "Drop to upload" : "Drag & drop a document, or click to browse"}
      </p>
      <p className="text-xs text-muted-foreground">PDF, DOCX, TXT, Markdown, CSV, JSON &middot; up to 50MB</p>
    </div>
  );
}
