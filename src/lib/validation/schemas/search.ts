import { z } from "zod";

export const searchRequestSchema = z.object({
  query: z.string().min(1).max(500),
  collectionId: z.string().cuid().optional(),
  tagIds: z.array(z.string().cuid()).optional(),
});

export type SearchRequest = z.infer<typeof searchRequestSchema>;
