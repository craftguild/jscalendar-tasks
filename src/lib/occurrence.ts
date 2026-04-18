export type OccurrenceKeyInput = {
  recurrenceId?: string | null;
  start?: string | null;
  due?: string | null;
};

/**
 * Returns the stable key used to identify a concrete occurrence.
 */
export function getOccurrenceKey(value: OccurrenceKeyInput): string | null {
  if (value.recurrenceId) return value.recurrenceId;
  if (value.start) return value.start;
  if (value.due) return value.due;
  return null;
}

/**
 * Returns the composite key used to match a completion to one event occurrence.
 */
export function getCompletionKey(eventId: string, occurrenceId: string): string {
  return `${eventId}::${occurrenceId}`;
}

/**
 * Returns whether the supplied completion belongs to the supplied event occurrence.
 */
export function matchesCompletion(
  completion: { eventId: string; occurrenceId: string },
  eventId: string,
  occurrence: OccurrenceKeyInput,
): boolean {
  const occurrenceId = getOccurrenceKey(occurrence);
  if (!occurrenceId) return false;
  return getCompletionKey(completion.eventId, completion.occurrenceId) ===
    getCompletionKey(eventId, occurrenceId);
}
