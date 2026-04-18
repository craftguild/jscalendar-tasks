import { fromZonedTime } from "date-fns-tz";

/**
 * Parses a JSCalendar LocalDateTime string into numeric date-time parts.
 */
export function parseLocalDateTime(value: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/.exec(value);
  if (!match) {
    throw new Error(`Invalid LocalDateTime: ${value}`);
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6]),
  };
}

/**
 * Converts a JSCalendar LocalDateTime string into a JavaScript Date.
 */
export function localDateTimeToDate(value: string, timeZone?: string): Date {
  const parts = parseLocalDateTime(value);
  const local = new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  if (timeZone) {
    return fromZonedTime(local, timeZone);
  }
  return local;
}
