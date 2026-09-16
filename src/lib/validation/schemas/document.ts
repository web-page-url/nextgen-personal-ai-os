import { z } from "zod";
import { UPLOAD_LIMITS } from "@/src/lib/config/constants";

export const uploadMetadataSchema = z.object({
  collectionId: z.string().cuid().optional(),
  tagIds: z.array(z.string().cuid()).optional(),
});

export class UploadValidationError extends Error {}

export function validateUploadedFile(file: File): void {
  if (file.size <= 0) {
    throw new UploadValidationError("File is empty");
  }
  if (file.size > UPLOAD_LIMITS.maxFileSizeBytes) {
    throw new UploadValidationError(
      `File exceeds the ${UPLOAD_LIMITS.maxFileSizeBytes / (1024 * 1024)}MB limit`,
    );
  }
}
