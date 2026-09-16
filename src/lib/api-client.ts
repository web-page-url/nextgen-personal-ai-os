export type DocumentStatus = "UPLOADED" | "PROCESSING" | "READY" | "FAILED";
export type DocumentType = "PDF" | "DOCX" | "TXT" | "MD" | "CSV" | "JSON";

export interface DocumentTagRef {
  tag: { id: string; name: string };
}

export interface DocumentSummary {
  id: string;
  originalName: string;
  fileType: DocumentType;
  mimeType: string;
  fileSizeBytes: number;
  status: DocumentStatus;
  errorMessage: string | null;
  collectionId: string | null;
  collection: { id: string; name: string; color: string | null } | null;
  tags: DocumentTagRef[];
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentDetail extends DocumentSummary {
  currentVersion: { id: string; extractedText: string | null } | null;
  jobs: { id: string; status: string; errorMessage: string | null; createdAt: string }[];
}

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  _count: { documents: number };
}

export interface CollectionDetail extends Omit<Collection, "_count"> {
  documents: DocumentSummary[];
}

export interface Tag {
  id: string;
  name: string;
  _count: { documents: number };
}

export interface Conversation {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

export interface CitationRef {
  id: string;
  documentId: string;
  chunkId: string;
  rank: number | null;
  similarityScore: number | null;
  locationLabel: string;
  document: { originalName: string };
  chunk: { content: string };
}

export interface Message {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  createdAt: string;
  citations: CitationRef[];
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface SearchResult {
  chunkId: string;
  documentId: string;
  documentName: string;
  chunkIndex: number;
  content: string;
  locationLabel: string;
  score: number;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // FormData bodies (file uploads) must let the browser set its own
  // Content-Type so the multipart boundary is included.
  const isFormData = init?.body instanceof FormData;
  const response = await fetch(path, {
    ...init,
    headers:
      init?.body && !isFormData
        ? { "Content-Type": "application/json", ...init.headers }
        : init?.headers,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  listDocuments: (filters?: { collectionId?: string; tagId?: string }) => {
    const params = new URLSearchParams(filters as Record<string, string>);
    const query = params.toString();
    return apiFetch<{ documents: DocumentSummary[] }>(`/api/documents${query ? `?${query}` : ""}`);
  },
  getDocument: (id: string) => apiFetch<{ document: DocumentDetail }>(`/api/documents/${id}`),
  uploadDocument: async (file: File, opts?: { collectionId?: string }) => {
    const formData = new FormData();
    formData.append("file", file);
    if (opts?.collectionId) formData.append("collectionId", opts.collectionId);
    return apiFetch<{ document: DocumentSummary }>("/api/documents", {
      method: "POST",
      body: formData,
    });
  },
  deleteDocument: (id: string) => apiFetch<{ ok: true }>(`/api/documents/${id}`, { method: "DELETE" }),
  reprocessDocument: (id: string) =>
    apiFetch<{ ok: true }>(`/api/documents/${id}/reprocess`, { method: "POST" }),

  listCollections: () => apiFetch<{ collections: Collection[] }>("/api/collections"),
  createCollection: (input: { name: string; color?: string; description?: string }) =>
    apiFetch<{ collection: Collection }>("/api/collections", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  getCollection: (id: string) => apiFetch<{ collection: CollectionDetail }>(`/api/collections/${id}`),
  deleteCollection: (id: string) =>
    apiFetch<{ ok: true }>(`/api/collections/${id}`, { method: "DELETE" }),

  listTags: () => apiFetch<{ tags: Tag[] }>("/api/tags"),
  createTag: (name: string) =>
    apiFetch<{ tag: Tag }>("/api/tags", { method: "POST", body: JSON.stringify({ name }) }),

  listConversations: () => apiFetch<{ conversations: Conversation[] }>("/api/conversations"),
  createConversation: () => apiFetch<{ conversation: Conversation }>("/api/conversations", { method: "POST" }),
  getConversation: (id: string) =>
    apiFetch<{ conversation: ConversationDetail }>(`/api/conversations/${id}`),
  deleteConversation: (id: string) =>
    apiFetch<{ ok: true }>(`/api/conversations/${id}`, { method: "DELETE" }),

  search: (input: { query: string; collectionId?: string; tagIds?: string[] }) =>
    apiFetch<{ results: SearchResult[] }>("/api/search", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  getChunkContext: (chunkId: string) =>
    apiFetch<{
      documentName: string;
      chunk: { id: string; chunkIndex: number; content: string; locationLabel: string };
      neighbors: { id: string; chunkIndex: number; content: string; locationLabel: string }[];
    }>(`/api/chunks/${chunkId}`),
};
