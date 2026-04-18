import { JsCal } from "@craftguild/jscalendar";
import type { JSCalendarObject } from "@craftguild/jscalendar";
import { getCompletionKey, getOccurrenceKey } from "@/lib/occurrence";
import { localDateTimeToDate } from "@/lib/datetime";
import type { AppJsonObject, AppJsonValue } from "@/lib/json-value";
import { fromPrismaJsonValue, isAppJsonObject } from "@/lib/json-value";
import { prisma } from "@/lib/prisma";
import { toJsCalendarObject } from "@/lib/jscal-normalize";

export type OccurrenceItem = {
  eventId: string;
  title: string;
  description: string | null;
  tags: { name: string; color?: string }[];
  occurrence: JSCalendarObject;
  completedAt: string | null;
};

export type OccurrenceResult = {
  items: OccurrenceItem[];
  nextOffset: number | null;
  range: { from: string; to: string };
  serverNow: string;
};

type GetOccurrencesInput = {
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
  now?: Date;
};

/**
 * Recreates a minimal occurrence object from a completion snapshot and occurrence id.
 */
function buildOccurrenceFromSnapshot(
  snapshot: JSCalendarObject,
  occurrenceId: string,
): JSCalendarObject | null {
  if (snapshot["@type"] === "Task") {
    const task = new JsCal.Task({
      title: snapshot.title ?? "",
      description: snapshot.description ?? undefined,
      start: occurrenceId,
      timeZone: snapshot.timeZone ?? undefined,
    });
    return task.eject();
  }
  if (snapshot["@type"] === "Event") {
    const event = new JsCal.Event({
      title: snapshot.title ?? "",
      description: snapshot.description ?? undefined,
      start: occurrenceId,
      timeZone: snapshot.timeZone ?? undefined,
    });
    return event.eject();
  }
  return null;
}

/**
 * Converts a JSCalendar date-time string into a comparable Date.
 */
function toDateValue(value: string, timeZone?: string | null): Date {
  if (value.endsWith("Z")) return new Date(value);
  return localDateTimeToDate(value, timeZone ?? undefined);
}

/**
 * Expands stored JSCalendar tasks/events into paged occurrence items.
 */
export async function getOccurrences({
  from: fromInput,
  to: toInput,
  limit: limitInput = 24,
  offset: offsetInput = 0,
  now: nowInput,
}: GetOccurrencesInput): Promise<OccurrenceResult> {
  const now = nowInput ?? new Date();
  const from = fromInput ?? now;
  const to = toInput ?? new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const limit = Math.min(limitInput, 200);
  const offset = Math.max(offsetInput, 0);

  const events = await prisma.event.findMany({
    where: { deletedAt: null },
    include: { tags: { orderBy: { position: "asc" }, include: { tag: true } } },
  });
  const items: OccurrenceItem[] = [];
  const activeEventIds = new Set(events.map((event) => event.id));

  const completions = await prisma.completion.findMany({
    select: { eventId: true, occurrenceId: true, completedAt: true, snapshot: true },
  });
  const completionMap = new Map<
    string,
    { completedAt: string; snapshot: JSCalendarObject | null; snapshotJson: AppJsonValue }
  >();
  for (const completion of completions) {
    const snapshotJson = fromPrismaJsonValue(completion.snapshot);
    const snapshot = toJsCalendarObject(getSnapshotJsCal(snapshotJson));
    completionMap.set(getCompletionKey(completion.eventId, completion.occurrenceId), {
      completedAt: completion.completedAt.toISOString(),
      snapshot,
      snapshotJson,
    });
  }

  for (const event of events) {
    const jscal = toJsCalendarObject(fromPrismaJsonValue(event.jscal));
    if (!jscal) continue;
    const description =
      jscal["@type"] === "Event" || jscal["@type"] === "Task" ? jscal.description ?? null : null;
    let occurrences: JSCalendarObject[] = [];
    try {
      occurrences = Array.from(JsCal.expandRecurrence([jscal], { from, to }));
    } catch {
      continue;
    }
    for (const occurrence of occurrences) {
      const key = getOccurrenceKey({
        recurrenceId: occurrence.recurrenceId ?? undefined,
        start: "start" in occurrence ? occurrence.start : undefined,
        due: "due" in occurrence ? occurrence.due : undefined,
      });
      if (!key) continue;
      const doneKey = getCompletionKey(event.id, key);
      const completion = completionMap.get(doneKey);
      const snapshot = completion?.snapshot;
      const snapshotTitle =
        snapshot && (snapshot["@type"] === "Event" || snapshot["@type"] === "Task")
          ? snapshot.title ?? null
          : null;
      const snapshotDescription =
        snapshot && (snapshot["@type"] === "Event" || snapshot["@type"] === "Task")
          ? snapshot.description ?? null
          : null;
      const snapshotTags = extractSnapshotTags(completion?.snapshotJson ?? null);
      items.push({
        eventId: event.id,
        title: snapshotTitle ?? event.title,
        description: snapshotDescription ?? description,
        tags:
          snapshotTags.length > 0
            ? snapshotTags
            : event.tags.map((entry) => ({ name: entry.tag.name, color: entry.color })),
        occurrence,
        completedAt: completion?.completedAt ?? null,
      });
    }
  }

  for (const completion of completions) {
    if (activeEventIds.has(completion.eventId)) continue;
    const snapshotJson = fromPrismaJsonValue(completion.snapshot);
    const snapshot = toJsCalendarObject(getSnapshotJsCal(snapshotJson));
    if (!snapshot) continue;
    const timeZone =
      snapshot["@type"] === "Event" || snapshot["@type"] === "Task"
        ? snapshot.recurrenceIdTimeZone ?? snapshot.timeZone ?? null
        : null;
    try {
      const date = toDateValue(completion.occurrenceId, timeZone);
      if (date < from || date > to) {
        continue;
      }
    } catch {
      continue;
    }
    const snapshotTags = extractSnapshotTags(snapshotJson);
    const occurrence = buildOccurrenceFromSnapshot(snapshot, completion.occurrenceId);
    if (!occurrence) continue;
    const description =
      snapshot["@type"] === "Event" || snapshot["@type"] === "Task"
        ? snapshot.description ?? null
        : null;
    const title =
      snapshot["@type"] === "Event" || snapshot["@type"] === "Task" ? snapshot.title ?? "" : "";
    items.push({
      eventId: completion.eventId,
      title,
      description,
      tags: snapshotTags,
      occurrence,
      completedAt: completion.completedAt.toISOString(),
    });
  }

  items.sort((a, b) => {
    const aKey = getOccurrenceKey({
      recurrenceId: a.occurrence.recurrenceId ?? undefined,
      start: "start" in a.occurrence ? a.occurrence.start : undefined,
      due: "due" in a.occurrence ? a.occurrence.due : undefined,
    });
    const bKey = getOccurrenceKey({
      recurrenceId: b.occurrence.recurrenceId ?? undefined,
      start: "start" in b.occurrence ? b.occurrence.start : undefined,
      due: "due" in b.occurrence ? b.occurrence.due : undefined,
    });
    if (!aKey || !bKey) return 0;
    const aZone = a.occurrence.recurrenceIdTimeZone ?? a.occurrence.timeZone ?? null;
    const bZone = b.occurrence.recurrenceIdTimeZone ?? b.occurrence.timeZone ?? null;
    try {
      const aDate = toDateValue(aKey, aZone);
      const bDate = toDateValue(bKey, bZone);
      if (aDate.getTime() === bDate.getTime()) {
        return a.eventId.localeCompare(b.eventId);
      }
      return aDate.getTime() - bDate.getTime();
    } catch {
      if (aKey === bKey) return a.eventId.localeCompare(b.eventId);
      return aKey < bKey ? -1 : 1;
    }
  });

  const paged = items.slice(offset, offset + limit);
  const nextOffset = offset + paged.length < items.length ? offset + paged.length : null;

  return {
    items: paged,
    nextOffset,
    range: { from: from.toISOString(), to: to.toISOString() },
    serverNow: now.toISOString(),
  };
}

/**
 * Loads incomplete occurrences before the supplied date for the pending list.
 */
export async function getOverdueOccurrences(nowDate: Date): Promise<OccurrenceItem[]> {
  const from = new Date(nowDate.getTime() - 3650 * 86400 * 1000);
  const results: OccurrenceItem[] = [];
  let localOffset = 0;
  while (results.length < 100) {
    const data = await getOccurrences({
      from,
      to: nowDate,
      limit: 200,
      offset: localOffset,
      now: nowDate,
    });
    for (const item of data.items) {
      if (item.completedAt) continue;
      const key = getOccurrenceKey({
        recurrenceId: item.occurrence.recurrenceId ?? undefined,
        start: "start" in item.occurrence ? item.occurrence.start : undefined,
        due: "due" in item.occurrence ? item.occurrence.due : undefined,
      });
      if (!key) continue;
      const timeZone = item.occurrence.recurrenceIdTimeZone ?? item.occurrence.timeZone ?? null;
      const date = toDateValue(key, timeZone);
      if (date.getTime() < nowDate.getTime()) {
        results.push(item);
      }
      if (results.length >= 100) break;
    }
    if (data.nextOffset === null) break;
    localOffset = data.nextOffset;
  }
  return results;
}

/**
 * Extracts the JSCalendar payload from a completion snapshot wrapper.
 */
function getSnapshotJsCal(snapshot: AppJsonValue): AppJsonValue {
  if (isJsonObject(snapshot) && snapshot.jscal !== undefined) {
    return snapshot.jscal;
  }
  return snapshot;
}

/**
 * Extracts tag labels and colors from a completion snapshot.
 */
function extractSnapshotTags(snapshot: AppJsonValue): { name: string; color?: string }[] {
  if (!isJsonObject(snapshot)) return [];
  const tags = snapshot.tags;
  if (!Array.isArray(tags)) return [];
  const items: { name: string; color?: string }[] = [];
  for (const entry of tags) {
    if (isJsonObject(entry) && typeof entry.name === "string") {
      const color = typeof entry.color === "string" ? entry.color : undefined;
      items.push({ name: entry.name, color });
    }
  }
  return items;
}

/**
 * Narrows an app JSON value to a plain JSON object.
 */
function isJsonObject(value: AppJsonValue): value is AppJsonObject {
  return isAppJsonObject(value);
}
