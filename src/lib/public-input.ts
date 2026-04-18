import type { JSCalendarObject } from "@craftguild/jscalendar";
import type { AppJsonValue } from "@/lib/json-value";
import { isAppJsonObject } from "@/lib/json-value";
import { toJsCalendarObject } from "@/lib/jscal-normalize";
import { TAG_COLORS } from "@/lib/tag-colors";

export const PUBLIC_INPUT_LIMITS = {
  title: 120,
  description: 2000,
  memo: 2000,
  tagName: 40,
  tags: 8,
  attachments: 3,
  attachmentBytes: 2 * 1024 * 1024,
} as const;

export type SanitizedTagInput = {
  name: string;
  color: string;
};

/**
 * Normalizes user-controlled single-line text to a bounded plain string.
 */
export function normalizeSingleLineText(
  value: unknown,
  maxLength: number,
): string {
  if (typeof value !== "string") return "";
  return stripControlCharacters(value).replace(/\s+/g, " ").trim().slice(0, maxLength);
}

/**
 * Normalizes user-controlled multi-line text to bounded plain text.
 */
export function normalizeMultiLineText(
  value: unknown,
  maxLength: number,
): string {
  if (typeof value !== "string") return "";
  return stripControlCharacters(value).trim().slice(0, maxLength);
}

/**
 * Returns whether a submitted tag color is one of the app palette values.
 */
export function isAllowedTagColor(value: string): boolean {
  return TAG_COLORS.some((color) => color === value);
}

/**
 * Validates and normalizes tag input from public APIs.
 */
export function normalizeTagInput(value: AppJsonValue): SanitizedTagInput | null {
  if (!isAppJsonObject(value)) return null;
  const name = normalizeSingleLineText(value.name, PUBLIC_INPUT_LIMITS.tagName);
  const color =
    typeof value.color === "string" && isAllowedTagColor(value.color.trim())
      ? value.color.trim()
      : "";
  if (!name || !color) return null;
  return { name, color };
}

/**
 * Validates and normalizes the bounded tag list accepted by event APIs.
 */
export function normalizeTagInputs(value: AppJsonValue): SanitizedTagInput[] {
  if (!Array.isArray(value)) return [];
  const tags: SanitizedTagInput[] = [];
  for (const entry of value) {
    const tag = normalizeTagInput(entry);
    if (!tag) continue;
    if (tags.some((existing) => existing.name === tag.name)) continue;
    tags.push(tag);
    if (tags.length >= PUBLIC_INPUT_LIMITS.tags) break;
  }
  return tags;
}

/**
 * Converts a submitted JSCalendar payload to the app-supported object shape.
 */
export function normalizeSubmittedJsCalendar(
  value: AppJsonValue,
  title: string,
  description: string,
): JSCalendarObject | null {
  const obj = toJsCalendarObject(value);
  if (!obj || (obj["@type"] !== "Task" && obj["@type"] !== "Event")) return null;
  const normalized = {
    ...obj,
    title,
    description: description || undefined,
  };
  return JSON.parse(JSON.stringify(normalized)) as JSCalendarObject;
}

/**
 * Removes control characters while preserving common whitespace.
 */
function stripControlCharacters(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}
