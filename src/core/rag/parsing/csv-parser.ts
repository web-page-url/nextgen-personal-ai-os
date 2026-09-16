import "server-only";
import { parse } from "csv-parse/sync";
import { DocumentType } from "@/src/generated/prisma/client";
import type { DocumentParser, DocumentSegment, ParsedDocument } from "./document-parser";

const ROWS_PER_SEGMENT = 20;

export class CsvParser implements DocumentParser {
  readonly fileType = DocumentType.CSV;

  async parse(buffer: Buffer): Promise<ParsedDocument> {
    const records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    }) as Record<string, string>[];

    const segments: DocumentSegment[] = [];
    for (let start = 0; start < records.length; start += ROWS_PER_SEGMENT) {
      const batch = records.slice(start, start + ROWS_PER_SEGMENT);
      const text = batch
        .map((row, index) =>
          `Row ${start + index + 1}: ` +
          Object.entries(row)
            .map(([key, value]) => `${key}=${value}`)
            .join(", "),
        )
        .join("\n");

      const firstRow = start + 1;
      const lastRow = start + batch.length;
      segments.push({
        text,
        locationLabel: firstRow === lastRow ? `Row ${firstRow}` : `Rows ${firstRow}–${lastRow}`,
      });
    }

    return {
      segments,
      metadata: {
        rowCount: records.length,
        columns: records[0] ? Object.keys(records[0]) : [],
      },
    };
  }
}
