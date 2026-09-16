import { describe, expect, it } from "vitest";
import { CsvParser } from "./csv-parser";

const parser = new CsvParser();

function makeCsv(rowCount: number): string {
  const header = "name,amount";
  const rows = Array.from({ length: rowCount }, (_, i) => `Item ${i + 1},${i + 1}`);
  return [header, ...rows].join("\n");
}

describe("CsvParser", () => {
  it("groups rows into a single segment when under the batch size", async () => {
    const result = await parser.parse(Buffer.from(makeCsv(5), "utf-8"));

    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].locationLabel).toBe("Rows 1–5");
    expect(result.metadata.rowCount).toBe(5);
    expect(result.metadata.columns).toEqual(["name", "amount"]);
  });

  it("batches rows into multiple segments once the batch size is exceeded", async () => {
    const result = await parser.parse(Buffer.from(makeCsv(45), "utf-8"));

    expect(result.segments).toHaveLength(3);
    expect(result.segments[0].locationLabel).toBe("Rows 1–20");
    expect(result.segments[2].locationLabel).toBe("Rows 41–45");
  });
});
