import { JsCal } from "@craftguild/jscalendar";
import type {
  DayOfWeek,
  Event,
  Group,
  JSCalendarObject,
  NDay,
  PatchObject,
  RecurrenceRule,
  Task,
  TimeZoneId,
} from "@craftguild/jscalendar";
import type { AppJsonObject, AppJsonValue } from "@/lib/json-value";
import { isAppJsonObject } from "@/lib/json-value";

const frequencyValues: RecurrenceRule["frequency"][] = [
  "yearly",
  "monthly",
  "weekly",
  "daily",
  "hourly",
  "minutely",
  "secondly",
];

const dayValues: DayOfWeek[] = ["mo", "tu", "we", "th", "fr", "sa", "su"];
const skipValues: RecurrenceRule["skip"][] = ["omit", "backward", "forward"];

/**
 * Converts persisted app JSON into a validated JSCalendar object.
 */
export function toJsCalendarObject(value: AppJsonValue): JSCalendarObject | null {
  if (!isJsonObject(value)) return null;
  const type = getString(value, "@type");
  if (!type) return null;

  if (type === "Event") {
    const start = getString(value, "start");
    const uid = getString(value, "uid");
    const updated = getString(value, "updated");
    if (!start || !uid || !updated) return null;
    const recurrenceRules = parseRecurrenceRules(getValue(value, "recurrenceRules"));
    const excludedRecurrenceRules = parseRecurrenceRules(getValue(value, "excludedRecurrenceRules"));
    const recurrenceOverrides = parseOverrides(getValue(value, "recurrenceOverrides"));
    const event: Event = {
      "@type": "Event",
      uid,
      updated,
      start,
      title: getString(value, "title"),
      description: getString(value, "description"),
      duration: getString(value, "duration"),
      timeZone: getTimeZone(value, "timeZone"),
      recurrenceRules,
      excludedRecurrenceRules,
      recurrenceOverrides,
      recurrenceIdTimeZone: parseNullableTimeZone(value["recurrenceIdTimeZone"]),
      recurrenceId: getString(value, "recurrenceId"),
      excluded: getBoolean(value, "excluded"),
    };
    return event;
  }

  if (type === "Task") {
    const uid = getString(value, "uid");
    const updated = getString(value, "updated");
    const start = getString(value, "start");
    const due = getString(value, "due");
    if (!uid || !updated) return null;
    if (!start && !due) return null;
    const recurrenceRules = parseRecurrenceRules(getValue(value, "recurrenceRules"));
    const excludedRecurrenceRules = parseRecurrenceRules(getValue(value, "excludedRecurrenceRules"));
    const recurrenceOverrides = parseOverrides(getValue(value, "recurrenceOverrides"));
    const task: Task = {
      "@type": "Task",
      uid,
      updated,
      start,
      due,
      title: getString(value, "title"),
      description: getString(value, "description"),
      timeZone: getTimeZone(value, "timeZone"),
      recurrenceRules,
      excludedRecurrenceRules,
      recurrenceOverrides,
      recurrenceIdTimeZone: parseNullableTimeZone(value["recurrenceIdTimeZone"]),
      recurrenceId: getString(value, "recurrenceId"),
      excluded: getBoolean(value, "excluded"),
    };
    return task;
  }

  if (type === "Group") {
    const uid = getString(value, "uid");
    const updated = getString(value, "updated");
    const entriesValue = getValue(value, "entries");
    if (!uid || !updated) return null;
    if (!Array.isArray(entriesValue)) return null;
    const entries = entriesValue
      .map((entry) => toJsCalendarObject(entry))
      .filter((entry): entry is JSCalendarObject => entry !== null)
      .filter((entry) => entry["@type"] === "Event" || entry["@type"] === "Task");
    const group: Group = {
      "@type": "Group",
      uid,
      updated,
      title: getString(value, "title"),
      description: getString(value, "description"),
      entries,
    };
    return group;
  }

  return null;
}

/**
 * Narrows an app JSON value to a plain JSON object.
 */
function isJsonObject(value: AppJsonValue): value is AppJsonObject {
  return isAppJsonObject(value);
}

/**
 * Reads a string property from a JSON object.
 */
function getString(obj: AppJsonObject, key: string): string | undefined {
  const value = obj[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Reads and validates a time zone identifier from a JSON object.
 */
function getTimeZone(obj: AppJsonObject, key: string): TimeZoneId | undefined {
  const value = obj[key];
  return typeof value === "string" && isTimeZoneId(value) ? value : undefined;
}

/**
 * Reads a JSON property and normalizes missing values to null.
 */
function getValue(obj: AppJsonObject, key: string): AppJsonValue {
  const value = obj[key];
  return value ?? null;
}

/**
 * Reads a boolean property from a JSON object.
 */
function getBoolean(obj: AppJsonObject, key: string): boolean | undefined {
  const value = obj[key];
  return typeof value === "boolean" ? value : undefined;
}

/**
 * Parses a nullable JSCalendar time zone field.
 */
function parseNullableTimeZone(value: AppJsonValue): TimeZoneId | null | undefined {
  if (typeof value === "string" && isTimeZoneId(value)) return value;
  if (value === null) return null;
  return undefined;
}

/**
 * Parses a recurrence rule array from persisted JSON.
 */
function parseRecurrenceRules(value: AppJsonValue): RecurrenceRule[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const rules = value
    .map((entry) => parseRecurrenceRule(entry))
    .filter((rule): rule is RecurrenceRule => rule !== null);
  return rules.length > 0 ? rules : undefined;
}

/**
 * Parses a single JSCalendar RecurrenceRule from persisted JSON.
 */
function parseRecurrenceRule(value: AppJsonValue): RecurrenceRule | null {
  if (!isJsonObject(value)) return null;
  const type = getString(value, "@type");
  if (type !== "RecurrenceRule") return null;
  const frequency = getString(value, "frequency");
  if (!frequency || !isFrequency(frequency)) return null;

    const rule: RecurrenceRule = {
    "@type": "RecurrenceRule",
    frequency,
    interval: getNumber(value, "interval"),
    count: getNumber(value, "count"),
    until: getString(value, "until"),
    byDay: parseByDay(getValue(value, "byDay")),
    byMonth: parseMonth(getValue(value, "byMonth")),
    byMonthDay: parseNumberArray(getValue(value, "byMonthDay")),
    byYearDay: parseNumberArray(getValue(value, "byYearDay")),
    byWeekNo: parseNumberArray(getValue(value, "byWeekNo")),
    byHour: parseNumberArray(getValue(value, "byHour")),
    byMinute: parseNumberArray(getValue(value, "byMinute")),
    bySecond: parseNumberArray(getValue(value, "bySecond")),
    bySetPosition: parseNumberArray(getValue(value, "bySetPosition")),
    firstDayOfWeek: parseFirstDay(getValue(value, "firstDayOfWeek")),
    skip: parseSkip(getValue(value, "skip")),
    rscale: getString(value, "rscale"),
  };

  return rule;
}

/**
 * Parses recurrence override entries into JSCalendar patch objects.
 */
function parseOverrides(value: AppJsonValue): Record<string, PatchObject> | undefined {
  if (!isJsonObject(value)) return undefined;
  const result: Record<string, PatchObject> = {};
  for (const [key, entry] of Object.entries(value)) {
    const patch = parsePatchObject(entry);
    if (patch) {
      result[key] = patch;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Parses one recurrence override patch object.
 */
function parsePatchObject(value: AppJsonValue): PatchObject | null {
  if (!isJsonObject(value)) return null;
  const result: PatchObject = {};
  for (const [key, entry] of Object.entries(value)) {
    result[key] = toJsonValue(entry);
  }
  return result;
}

/**
 * Rebuilds a JSON value while removing unsupported values.
 */
function toJsonValue(value: AppJsonValue): AppJsonValue {
  if (value === null) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => toJsonValue(entry));
  }
  if (isJsonObject(value)) {
    const result: Record<string, AppJsonValue> = {};
    for (const [key, entry] of Object.entries(value)) {
      result[key] = toJsonValue(entry);
    }
    return result;
  }
  return null;
}

/**
 * Parses JSCalendar NDay entries from a byDay array.
 */
function parseByDay(value: AppJsonValue): NDay[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const days = value
    .map((entry) => parseNDay(entry))
    .filter((entry): entry is NDay => entry !== null);
  return days.length > 0 ? days : undefined;
}

/**
 * Parses one JSCalendar NDay object.
 */
function parseNDay(value: AppJsonValue): NDay | null {
  if (!isJsonObject(value)) return null;
  const type = getString(value, "@type");
  if (type !== "NDay") return null;
  const day = getString(value, "day");
  if (!day || !isDay(day)) return null;
  const nthOfPeriod = getNumber(value, "nthOfPeriod");
  return { "@type": "NDay", day, nthOfPeriod };
}

/**
 * Parses an array of numeric recurrence parts.
 */
function parseNumberArray(value: AppJsonValue): number[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const numbers = value
    .map((entry) => (typeof entry === "number" ? entry : undefined))
    .filter((entry): entry is number => typeof entry === "number");
  return numbers.length > 0 ? numbers : undefined;
}

/**
 * Parses JSCalendar month values while accepting numeric legacy values.
 */
function parseMonth(value: AppJsonValue): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const months = value
    .map((entry) => {
      if (typeof entry === "string") return entry;
      if (typeof entry === "number") return entry.toString();
      return undefined;
    })
    .filter((entry): entry is string => typeof entry === "string");
  return months.length > 0 ? months : undefined;
}

/**
 * Parses the first day of week value for a recurrence rule.
 */
function parseFirstDay(value: AppJsonValue): RecurrenceRule["firstDayOfWeek"] | undefined {
  if (typeof value !== "string") return undefined;
  return isDay(value) ? value : undefined;
}

/**
 * Parses the JSCalendar recurrence skip strategy.
 */
function parseSkip(value: AppJsonValue): RecurrenceRule["skip"] | undefined {
  if (typeof value !== "string") return undefined;
  return isSkip(value) ? value : undefined;
}

/**
 * Reads a numeric property from a JSON object.
 */
function getNumber(obj: AppJsonObject, key: string): number | undefined {
  const value = obj[key];
  return typeof value === "number" ? value : undefined;
}

/**
 * Checks whether a string is a supported JSCalendar recurrence frequency.
 */
function isFrequency(value: string): value is RecurrenceRule["frequency"] {
  return frequencyValues.some((entry) => entry === value);
}

/**
 * Checks whether a string is one of the JSCalendar time zone identifiers.
 */
function isTimeZoneId(value: string): value is TimeZoneId {
  return JsCal.timeZones.some((entry) => entry === value);
}

/**
 * Checks whether a string is a JSCalendar weekday code.
 */
function isDay(value: string): value is DayOfWeek {
  return dayValues.some((entry) => entry === value);
}

/**
 * Checks whether a string is a JSCalendar recurrence skip value.
 */
function isSkip(value: string): value is NonNullable<RecurrenceRule["skip"]> {
  return skipValues.some((entry) => entry === value);
}
