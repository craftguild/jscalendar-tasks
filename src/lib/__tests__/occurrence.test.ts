import { describe, expect, it } from "vitest";
import {
  getCompletionKey,
  getOccurrenceKey,
  matchesCompletion,
} from "@/lib/occurrence";

describe("occurrence and completion keys", () => {
  it("uses recurrenceId before start or due when identifying an occurrence", () => {
    expect(
      getOccurrenceKey({
        recurrenceId: "2026-04-18T09:00:00",
        start: "2026-04-19T09:00:00",
        due: "2026-04-20T09:00:00",
      }),
    ).toBe("2026-04-18T09:00:00");
  });

  it("falls back to start and then due for non-recurring occurrences", () => {
    expect(getOccurrenceKey({ start: "2026-04-19T09:00:00" })).toBe(
      "2026-04-19T09:00:00",
    );
    expect(getOccurrenceKey({ due: "2026-04-20T09:00:00" })).toBe(
      "2026-04-20T09:00:00",
    );
    expect(getOccurrenceKey({})).toBeNull();
  });

  it("matches completions by event id and concrete occurrence id", () => {
    const completion = {
      eventId: "event-1",
      occurrenceId: "2026-04-18T09:00:00",
    };

    expect(getCompletionKey(completion.eventId, completion.occurrenceId)).toBe(
      "event-1::2026-04-18T09:00:00",
    );
    expect(
      matchesCompletion(completion, "event-1", {
        recurrenceId: "2026-04-18T09:00:00",
      }),
    ).toBe(true);
    expect(
      matchesCompletion(completion, "event-2", {
        recurrenceId: "2026-04-18T09:00:00",
      }),
    ).toBe(false);
    expect(
      matchesCompletion(completion, "event-1", {
        recurrenceId: "2026-04-19T09:00:00",
      }),
    ).toBe(false);
  });
});
