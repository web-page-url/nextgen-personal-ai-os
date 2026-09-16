import { z } from "zod";

export const chatRequestSchema = z.object({
  conversationId: z.string().cuid().optional(),
  message: z.string().min(1).max(8000),
  collectionId: z.string().cuid().optional(),
  tagIds: z.array(z.string().cuid()).optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
