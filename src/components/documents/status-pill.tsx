import { cn } from "@/src/lib/utils";
import type { DocumentStatus } from "@/src/lib/api-client";

const STATUS_STYLES: Record<DocumentStatus, string> = {
  READY: "bg-success/15 text-success",
  PROCESSING: "bg-warning/15 text-warning animate-pulse",
  UPLOADED: "bg-muted text-muted-foreground",
  FAILED: "bg-destructive/15 text-destructive",
};

const STATUS_LABELS: Record<DocumentStatus, string> = {
  READY: "Ready",
  PROCESSING: "Processing",
  UPLOADED: "Uploaded",
  FAILED: "Failed",
};

export function StatusPill({ status }: { status: DocumentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
