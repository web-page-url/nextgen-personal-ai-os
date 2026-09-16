import Link from "next/link";
import { FileText, FolderKanban, Loader2, MessageSquare, AlertTriangle } from "lucide-react";
import { DEFAULT_USER_ID } from "@/src/lib/config/constants";
import { listDocuments } from "@/src/db/repositories/document-repository";
import { listCollections } from "@/src/db/repositories/collection-repository";
import { listConversations } from "@/src/db/repositories/conversation-repository";
import { StatTile } from "@/src/components/dashboard/stat-tile";
import { StatusPill } from "@/src/components/documents/status-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { DocumentStatus } from "@/src/lib/api-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [documents, collections, conversations] = await Promise.all([
    listDocuments(DEFAULT_USER_ID),
    listCollections(DEFAULT_USER_ID),
    listConversations(DEFAULT_USER_ID),
  ]);

  const processingCount = documents.filter(
    (doc) => doc.status === "UPLOADED" || doc.status === "PROCESSING",
  ).length;
  const failedCount = documents.filter((doc) => doc.status === "FAILED").length;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Documents" value={documents.length} icon={FileText} />
        <StatTile label="Collections" value={collections.length} icon={FolderKanban} />
        <StatTile label="Processing" value={processingCount} icon={Loader2} tone="warning" />
        <StatTile label="Failed" value={failedCount} icon={AlertTriangle} tone="destructive" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-none bg-card shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-lg font-normal">Recent documents</CardTitle>
            <Link href="/documents" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {documents.length === 0 && (
              <p className="text-sm text-muted-foreground">No documents yet. Upload one to get started.</p>
            )}
            {documents.slice(0, 5).map((doc) => (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent"
              >
                <span className="truncate">{doc.originalName}</span>
                <StatusPill status={doc.status as DocumentStatus} />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none bg-card shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-lg font-normal">Recent conversations</CardTitle>
            <Link href="/chat" className="text-sm text-primary hover:underline">
              Open chat
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {conversations.length === 0 && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="size-4" /> No conversations yet.
              </p>
            )}
            {conversations.slice(0, 5).map((conversation) => (
              <Link
                key={conversation.id}
                href={`/chat/${conversation.id}`}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent"
              >
                <span className="truncate">{conversation.title ?? "Untitled conversation"}</span>
                <span className="text-xs text-muted-foreground">{conversation._count.messages} messages</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
