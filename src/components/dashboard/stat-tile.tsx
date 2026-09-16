import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils";

export function StatTile({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "destructive";
}) {
  return (
    <Card className="border-none bg-card shadow-none">
      <CardContent className="flex items-center gap-4 px-5 py-4">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            tone === "success" && "bg-success/15 text-success",
            tone === "warning" && "bg-warning/15 text-warning",
            tone === "destructive" && "bg-destructive/15 text-destructive",
            tone === "default" && "bg-primary/15 text-primary",
          )}
        >
          <Icon className="size-5" />
        </span>
        <div>
          <p className="font-heading text-2xl leading-none tracking-tight">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
