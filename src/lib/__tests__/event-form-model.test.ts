import { describe, expect, it } from "vitest";
import { JsCal } from "@craftguild/jscalendar";
import type { EventFormData } from "@/lib/event-form-model";
import { buildEventPayload, normalizeLocalDateTime, parseNumberList } from "@/lib/event-form-model";

const baseForm: EventFormData = {
  title: "  Review roadmap  ",
  description: "  Align next milestones  ",
  start: "2026-04-18T09:30",
  timeZone: "Asia/Tokyo",
  durationHours: 1,
  durationMinutes: 0,
  recurrenceType: "single",
  frequency: "weekly",
  monthlyMode: "monthDay",
  interval: 1,
  count: "",
  until: "",
  byDay: [],
  byMonth: "",
  byMonthDay: "",
  byYearDay: "",
  byWeekNo: "",
  byHour: "",
  byMinute: "",
  bySecond: "",
  bySetPosition: "",
  firstDayOfWeek: "",
  skip: "",
  rscale: "",
  tags: [{ name: "Planning", color: "#0f172a" }],
};

describe("event form model", () => {
  it("normalizes datetime-local values for JSCalendar LocalDateTime fields", () => {
    expect(normalizeLocalDateTime("2026-04-18T09:30")).toBe("2026-04-18T09:30:00");
    expect(normalizeLocalDateTime("2026-04-18T09:30:15")).toBe("2026-04-18T09:30:15");
    expect(normalizeLocalDateTime("invalid")).toBe("");
  });

  it("parses comma-separated recurrence number fields", () => {
    expect(parseNumberList("1, 15,31")).toEqual([1, 15, 31]);
    expect(parseNumberList("")).toBeUndefined();
    expect(parseNumberList("1, bad, 3")).toEqual([1, 3]);
  });

  it("maps weekly recurring form input to a JSCalendar Task recurrence rule", () => {
    const payload = buildEventPayload(
      {
        ...baseForm,
        recurrenceType: "recurring",
        interval: 2,
        count: "5",
        byDay: [{ day: "mo" }, { day: "we" }, { day: "fr" }],
      },
      JsCal.timeZones,
    );

    expect(payload).not.toBeNull();
    expect(payload?.title).toBe("Review roadmap");
    expect(payload?.description).toBe("Align next milestones");
    expect(payload?.tags).toEqual([{ name: "Planning", color: "#0f172a" }]);
    expect(payload?.jscal).toMatchObject({
      "@type": "Task",
      title: "Review roadmap",
      description: "Align next milestones",
      start: "2026-04-18T09:30:00",
      timeZone: "Asia/Tokyo",
      recurrenceRules: [
        {
          "@type": "RecurrenceRule",
          frequency: "weekly",
          interval: 2,
          count: 5,
          skip: "backward",
          byDay: [
            { "@type": "NDay", day: "mo" },
            { "@type": "NDay", day: "we" },
            { "@type": "NDay", day: "fr" },
          ],
        },
      ],
    });
  });

  it("maps monthly nth weekday input without leaking day-of-month fields", () => {
    const payload = buildEventPayload(
      {
        ...baseForm,
        recurrenceType: "recurring",
        frequency: "monthly",
        monthlyMode: "nthWeekday",
        byDay: [{ day: "tu", nthOfPeriod: 2 }],
        byMonthDay: "10",
      },
      JsCal.timeZones,
    );

    const rule = payload?.jscal.recurrenceRules?.[0];
    expect(rule).toMatchObject({
      frequency: "monthly",
      byDay: [{ "@type": "NDay", day: "tu", nthOfPeriod: 2 }],
    });
    expect(rule?.byMonthDay).toBeUndefined();
  });

  it("rejects unsupported time zones before creating a payload", () => {
    expect(
      buildEventPayload({ ...baseForm, timeZone: "Mars/Base" }, JsCal.timeZones),
    ).toBeNull();
  });
});
