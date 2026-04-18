import { JsCal } from "@craftguild/jscalendar";
import type {
  DayOfWeek,
  JSCalendarObject,
  RecurrenceRule,
  TimeZoneId,
} from "@craftguild/jscalendar";

export type TagValue = { name: string; color: string | null };

export type ByDayEntry = { day: DayOfWeek; nthOfPeriod?: number | "" };

export type MonthlyMode = "monthDay" | "nthWeekday";

export type EventFormData = {
  title: string;
  description: string;
  start: string;
  timeZone: string;
  durationHours: number;
  durationMinutes: number;
  recurrenceType: "single" | "recurring";
  frequency: RecurrenceRule["frequency"];
  monthlyMode: MonthlyMode;
  interval: number;
  count: string;
  until: string;
  byDay: ByDayEntry[];
  byMonth: string;
  byMonthDay: string;
  byYearDay: string;
  byWeekNo: string;
  byHour: string;
  byMinute: string;
  bySecond: string;
  bySetPosition: string;
  firstDayOfWeek: RecurrenceRule["firstDayOfWeek"] | "";
  skip: RecurrenceRule["skip"] | "";
  rscale: string;
  tags: TagValue[];
};

export type EventPayload = {
  title: string;
  description: string;
  jscal: JSCalendarObject;
  tags: TagValue[];
};

/**
 * Normalizes a datetime-local value into a JSCalendar LocalDateTime string.
 */
export function normalizeLocalDateTime(value: string): string {
  if (!value) return value;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return "";
  return value.length === 16 ? `${value}:00` : value;
}

/**
 * Parses comma-separated numeric recurrence fields.
 */
export function parseNumberList(value: string): number[] | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const nums = trimmed
    .split(",")
    .map((entry) => Number(entry.trim()))
    .filter((num) => !Number.isNaN(num));
  return nums.length > 0 ? nums : undefined;
}

/**
 * Finds a validated JSCalendar time zone id from a raw string.
 */
export function findTimeZoneId(
  value: string,
  zones: readonly TimeZoneId[],
): TimeZoneId | undefined {
  for (const zone of zones) {
    if (zone === value) return zone;
  }
  return undefined;
}

/**
 * Converts editable form state into the API payload containing a JSCalendar task.
 */
export function buildEventPayload(
  form: EventFormData,
  timeZones: readonly TimeZoneId[],
): EventPayload | null {
  if (!form.title.trim()) return null;

  const countValue = form.count ? Number(form.count) : undefined;
  const untilValue = normalizeLocalDateTime(form.until);
  const recurrenceByDay =
    form.frequency === "weekly" && form.byDay.length > 0
      ? form.byDay.map((entry) => ({
          "@type": "NDay" as const,
          day: entry.day,
        }))
      : form.frequency === "monthly" &&
          form.monthlyMode === "nthWeekday" &&
          form.byDay.length > 0
        ? form.byDay.map((entry) => ({
            "@type": "NDay" as const,
            day: entry.day,
            nthOfPeriod:
              entry.nthOfPeriod === "" ? undefined : Number(entry.nthOfPeriod),
          }))
        : undefined;
  const recurrenceByMonthDay =
    (form.frequency === "monthly" && form.monthlyMode === "monthDay") ||
    form.frequency === "yearly"
      ? parseNumberList(form.byMonthDay)
      : undefined;
  const recurrenceByMonth =
    form.frequency === "yearly"
      ? parseNumberList(form.byMonth)?.map((value) => value.toString())
      : undefined;
  const rule: RecurrenceRule | null =
    form.recurrenceType === "recurring"
      ? {
          "@type": "RecurrenceRule",
          frequency: form.frequency,
          interval: form.interval > 1 ? form.interval : undefined,
          count: Number.isNaN(countValue ?? NaN) ? undefined : countValue,
          until: untilValue || undefined,
          byDay: recurrenceByDay,
          byMonth: recurrenceByMonth,
          byMonthDay: recurrenceByMonthDay,
          byYearDay: parseNumberList(form.byYearDay),
          byWeekNo: parseNumberList(form.byWeekNo),
          byHour: parseNumberList(form.byHour),
          byMinute: parseNumberList(form.byMinute),
          bySecond: parseNumberList(form.bySecond),
          bySetPosition: parseNumberList(form.bySetPosition),
          firstDayOfWeek: form.firstDayOfWeek || undefined,
          skip: "backward",
          rscale: form.rscale ? form.rscale : undefined,
        }
      : null;

  let resolvedTimeZone: TimeZoneId | undefined;
  if (form.timeZone) {
    const found = findTimeZoneId(form.timeZone, timeZones);
    if (!found) return null;
    resolvedTimeZone = found;
  }

  const eventData = new JsCal.Task({
    title: form.title.trim(),
    description: form.description.trim(),
    start: normalizeLocalDateTime(form.start),
    timeZone: resolvedTimeZone,
    recurrenceRules: rule ? [rule] : undefined,
  });

  return {
    title: form.title.trim(),
    description: form.description.trim(),
    jscal: eventData.eject(),
    tags: form.tags,
  };
}
