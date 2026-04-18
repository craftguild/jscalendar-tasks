import { localDateTimeToDate } from "@/lib/datetime";

const dateTimeFormatOptions: Intl.DateTimeFormatOptions = {
  weekday: "short",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

/**
 * Formats a Date with weekday and time using the active UI locale.
 */
export function formatLocalizedDateTime(
  date: Date,
  locale: string,
  timeZone?: string | null,
): string {
  return new Intl.DateTimeFormat(locale, {
    ...dateTimeFormatOptions,
    ...(timeZone ? { timeZone } : {}),
  }).format(date);
}

/**
 * Formats a JSCalendar date-time value using the active UI locale.
 */
export function formatLocalizedDateTimeValue(
  value: string,
  locale: string,
  timeZone?: string | null,
): string {
  if (!value) return "-";
  const date = value.endsWith("Z")
    ? new Date(value)
    : localDateTimeToDate(value, timeZone ?? undefined);
  return formatLocalizedDateTime(date, locale, timeZone);
}
