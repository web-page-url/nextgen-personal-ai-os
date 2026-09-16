import { CheckCircle2, XCircle } from "lucide-react";
import { env } from "@/src/lib/config/env";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";

export const dynamic = "force-dynamic";

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}

export default function SettingsPage() {
  const hasApiKey = Boolean(env.GEMINI_API_KEY);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Card className="border-none bg-card shadow-none">
        <CardHeader>
          <CardTitle className="font-heading text-lg font-normal">AI provider</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col">
          <div className="flex items-center justify-between border-b border-border py-3">
            <span className="text-sm text-muted-foreground">Gemini API key</span>
            {hasApiKey ? (
              <Badge className="gap-1 bg-success/15 text-success">
                <CheckCircle2 className="size-3.5" /> Configured
              </Badge>
            ) : (
              <Badge className="gap-1 bg-destructive/15 text-destructive">
                <XCircle className="size-3.5" /> Missing — set GEMINI_API_KEY in .env
              </Badge>
            )}
          </div>
          <SettingRow label="LLM provider" value={env.AI_PROVIDER} />
          <SettingRow label="LLM model" value={env.GEMINI_MODEL} />
          <SettingRow label="Embedding provider" value={env.EMBEDDING_PROVIDER} />
          <SettingRow label="Embedding model" value={env.EMBEDDING_MODEL} />
          <SettingRow label="Embedding dimensions" value={String(env.EMBEDDING_DIMENSIONS)} />
        </CardContent>
      </Card>

      <Card className="border-none bg-card shadow-none">
        <CardHeader>
          <CardTitle className="font-heading text-lg font-normal">Storage</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col">
          <SettingRow label="Storage provider" value={env.STORAGE_PROVIDER} />
          <SettingRow label="Local storage path" value={env.LOCAL_STORAGE_PATH} />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        This is a single-user local installation — all data lives in a local SQLite
        database and on disk. Configuration is read from your <span className="font-mono">.env</span> file.
      </p>
    </div>
  );
}
