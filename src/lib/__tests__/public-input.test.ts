import { describe, expect, it } from "vitest";
import {
  PUBLIC_INPUT_LIMITS,
  normalizeMultiLineText,
  normalizeSingleLineText,
  normalizeSubmittedJsCalendar,
  normalizeTagInputs,
} from "@/lib/public-input";

describe("public input normalization", () => {
  it("bounds single-line text and removes control characters", () => {
    const value = `  hello\u0000\n\tworld  ${"x".repeat(200)}`;
    expect(normalizeSingleLineText(value, 12)).toBe("hello world ");
  });

  it("bounds multi-line text while preserving line breaks", () => {
    const value = " first line\nsecond line\u0007 ";
    expect(normalizeMultiLineText(value, 100)).toBe("first line\nsecond line");
  });

  it("accepts only bounded tag names with palette colors", () => {
    const tags = normalizeTagInputs([
      { name: " Team ", color: "#0f172a" },
      { name: "Team", color: "#0f172a" },
      { name: "Invalid", color: "url(javascript:alert(1))" },
      { name: "x".repeat(PUBLIC_INPUT_LIMITS.tagName + 10), color: "#22c55e" },
    ]);

    expect(tags).toEqual([
      { name: "Team", color: "#0f172a" },
      { name: "x".repeat(PUBLIC_INPUT_LIMITS.tagName), color: "#22c55e" },
    ]);
  });

  it("normalizes submitted JSCalendar to known task fields and display text", () => {
    const normalized = normalizeSubmittedJsCalendar(
      {
        "@type": "Task",
        uid: "task-1",
        updated: "2026-04-18T00:00:00Z",
        start: "2026-04-18T09:00:00",
        title: "<script>alert(1)</script>",
        description: "raw",
        extra: "<img src=x onerror=alert(1)>",
      },
      "Safe title",
      "Safe description",
    );

    expect(normalized).toMatchObject({
      "@type": "Task",
      uid: "task-1",
      title: "Safe title",
      description: "Safe description",
    });
    expect("extra" in (normalized ?? {})).toBe(false);
  });
});
