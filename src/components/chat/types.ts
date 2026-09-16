export interface UiCitation {
  chunkId: string;
  documentId: string;
  documentName: string;
  locationLabel: string;
  content: string;
  rank: number;
  score: number;
}

export interface UiMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  citations: UiCitation[];
}
