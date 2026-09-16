import { describe, expect, it } from "vitest";
import { JsonParser } from "./json-parser";

const parser = new JsonParser();

describe("JsonParser", () => {
  it("creates one segment per array element, labeled by record number", async () => {
    const json = JSON.stringify([{ name: "Alice" }, { name: "Bob" }]);
    const result = await parser.parse(Buffer.from(json, "utf-8"));

    expect(result.segments).toHaveLength(2);
    expect(result.segments[0].locationLabel).toBe("Record #1");
    expect(result.segments[0].text).toContain("Alice");
    expect(result.segments[1].locationLabel).toBe("Record #2");
  });

  it("creates one segment per top-level key for an object", async () => {
    const json = JSON.stringify({ owner: "Alice", policyNumber: "P-123" });
    const result = await parser.parse(Buffer.from(json, "utf-8"));

    expect(result.segments).toHaveLength(2);
    expect(result.segments.map((s) => s.sectionPath)).toEqual(["owner", "policyNumber"]);
  });
});
