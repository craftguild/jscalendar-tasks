import { describe, expect, it } from "vitest";
import { toJsCalendarObject } from "@/lib/jscal-normalize";

describe("JSCalendar normalization", () => {
  it("accepts persisted task JSON and preserves supported recurrence fields", () => {
    const obj = toJsCalendarObject({
      "@type": "Task",
      uid: "task-1",
      updated: "2026-04-18T00:00:00Z",
      start: "2026-04-18T09:00:00",
      title: "Prepare weekly report",
      description: "Collect team updates",
      timeZone: "Asia/Tokyo",
      recurrenceRules: [
        {
          "@type": "RecurrenceRule",
          frequency: "monthly",
          byDay: [{ "@type": "NDay", day: "fr", nthOfPeriod: -1 }],
          byMonth: [4, "10"],
          byMonthDay: [15],
          firstDayOfWeek: "mo",
          skip: "forward",
        },
      ],
    });

    expect(obj).toMatchObject({
      "@type": "Task",
      uid: "task-1",
      start: "2026-04-18T09:00:00",
      title: "Prepare weekly report",
      timeZone: "Asia/Tokyo",
      recurrenceRules: [
        {
          "@type": "RecurrenceRule",
          frequency: "monthly",
          byDay: [{ "@type": "NDay", day: "fr", nthOfPeriod: -1 }],
          byMonth: ["4", "10"],
          byMonthDay: [15],
          firstDayOfWeek: "mo",
          skip: "forward",
        },
      ],
    });
  });

  it("drops invalid recurrence and time zone values instead of returning unsafe data", () => {
    const obj = toJsCalendarObject({
      "@type": "Task",
      uid: "task-2",
      updated: "2026-04-18T00:00:00Z",
      due: "2026-04-19T09:00:00",
      timeZone: "Mars/Base",
      recurrenceRules: [
        { "@type": "RecurrenceRule", frequency: "not-real" },
        { "@type": "Other", frequency: "daily" },
      ],
    });

    expect(obj).toMatchObject({
      "@type": "Task",
      uid: "task-2",
      due: "2026-04-19T09:00:00",
    });
    expect(obj && "timeZone" in obj ? obj.timeZone : undefined).toBeUndefined();
    expect(obj && "recurrenceRules" in obj ? obj.recurrenceRules : undefined).toBeUndefined();
  });

  it("rejects tasks that do not have a start or due date", () => {
    expect(
      toJsCalendarObject({
        "@type": "Task",
        uid: "task-3",
        updated: "2026-04-18T00:00:00Z",
      }),
    ).toBeNull();
  });
});
