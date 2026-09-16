import { z } from "zod";

export const createCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export type CreateCollectionRequest = z.infer<typeof createCollectionSchema>;

export const createTagSchema = z.object({
  name: z.string().min(1).max(50),
});

export type CreateTagRequest = z.infer<typeof createTagSchema>;
