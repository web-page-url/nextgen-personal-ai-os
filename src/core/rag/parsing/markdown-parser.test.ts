import { describe, expect, it } from "vitest";
import { MarkdownParser } from "./markdown-parser";

const parser = new MarkdownParser();

describe("MarkdownParser", () => {
  it("builds a heading breadcrumb across nested sections", async () => {
    const markdown = [
      "# Coverage",
      "",
      "Intro text.",
      "",
      "## Limits",
      "",
      "Limit details.",
      "",
      "# Exclusions",
      "",
      "Exclusion details.",
    ].join("\n");

    const result = await parser.parse(Buffer.from(markdown, "utf-8"));

    expect(result.segments).toHaveLength(3);
    expect(result.segments[0]).toMatchObject({ sectionPath: "Coverage", text: "Intro text." });
    expect(result.segments[1]).toMatchObject({ sectionPath: "Coverage > Limits", text: "Limit details." });
    expect(result.segments[2]).toMatchObject({ sectionPath: "Exclusions", text: "Exclusion details." });
  });

  it("treats content before any heading as an untitled document segment", async () => {
    const result = await parser.parse(Buffer.from("Just a plain paragraph.", "utf-8"));

    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].sectionPath).toBeUndefined();
    expect(result.segments[0].locationLabel).toBe("Document");
  });
});
