import "server-only";
import type { ChunkConfig } from "./chunker";

export interface TextWindow {
  text: string;
  charStart: number;
  charEnd: number;
}

/** Hard character-window split, used as a fallback when a single paragraph exceeds chunkSize. */
export function chunkTextFixedSize(text: string, config: ChunkConfig): TextWindow[] {
  const windows: TextWindow[] = [];
  const step = Math.max(config.chunkSize - config.chunkOverlap, 1);

  for (let start = 0; start < text.length; start += step) {
    const end = Math.min(start + config.chunkSize, text.length);
    windows.push({ text: text.slice(start, end), charStart: start, charEnd: end });
    if (end === text.length) break;
  }

  return windows;
}
