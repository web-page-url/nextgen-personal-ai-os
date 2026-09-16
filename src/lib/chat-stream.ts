export interface StreamedCitation {
  documentId: string;
  chunkId: string;
  similarityScore: number;
  rank: number;
  locationLabel: string;
  documentName: string;
  content: string;
}

export interface ChatStreamCallbacks {
  onToken: (delta: string) => void;
  onCitations: (citations: StreamedCitation[]) => void;
  onDone: (conversationId: string) => void;
  onError: (message: string) => void;
}

export interface ChatStreamPayload {
  conversationId?: string;
  message: string;
  collectionId?: string;
  tagIds?: string[];
}

/** Reads the /api/chat Server-Sent-Events stream: token deltas, then a citations event, then done. */
export async function streamChat(
  payload: ChatStreamPayload,
  callbacks: ChatStreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok || !response.body) {
    const body = await response.json().catch(() => ({}));
    callbacks.onError(body.error ?? `Request failed: ${response.status}`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");

      const eventMatch = frame.match(/^event: (.+)$/m);
      const dataMatch = frame.match(/^data: (.+)$/m);
      if (!eventMatch || !dataMatch) continue;

      const event = eventMatch[1];
      const data = JSON.parse(dataMatch[1]);

      if (event === "token") callbacks.onToken(data.delta);
      else if (event === "citations") callbacks.onCitations(data.citations);
      else if (event === "done") callbacks.onDone(data.conversationId);
      else if (event === "error") callbacks.onError(data.error);
    }
  }
}
