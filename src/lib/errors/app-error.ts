import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/src/lib/logging/logger";

export class AppError extends Error {
  constructor(
    message: string,
    readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404);
  }
}

/** Converts a thrown error into a JSON API response, logging server errors. */
export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", issues: error.issues },
      { status: 400 },
    );
  }
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  const message = error instanceof Error ? error.message : "Unexpected error";
  logger.error("api.unhandled_error", { message });
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
