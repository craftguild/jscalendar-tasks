"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  HiOutlineCheckBadge,
  HiOutlineCheckCircle,
  HiOutlinePaperClip,
} from "react-icons/hi2";
import { formatLocalizedDateTimeValue } from "@/lib/date-format";
import { getOccurrenceKey } from "@/lib/occurrence";
import { localDateTimeToDate } from "@/lib/datetime";
import type { OccurrenceItem, OccurrenceResult } from "@/lib/occurrences-data";
import Button from "@/components/Button";
import CompletionStatusBadge from "@/components/CompletionStatusBadge";
import ListSectionHeader from "@/components/ListSectionHeader";
import Modal from "@/components/Modal";
import OccurrenceListItem from "@/components/OccurrenceListItem";
import PageLayout from "@/components/PageLayout";
import SplitDateTimeField from "@/components/SplitDateTimeField";
import { useI18n } from "@/lib/i18n";
import { getLanguageLocale } from "@/lib/language";
const RANGE_DAYS = 60;
/**
 * Formats a Date for a local datetime input.
 */
function toLocalInputValue(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
/**
 * Converts a JSCalendar date-time string into a Date.
 */
function toDateValue(value: string, timeZone?: string | null): Date {
  if (value.endsWith("Z")) return new Date(value);
  return localDateTimeToDate(value, timeZone ?? undefined);
}
/**
 * Selects the visual urgency tone for an occurrence date.
 */
function pickRibbonTone(
  date: Date | null,
  now: Date,
): "overdue" | "soon" | "warning" | "notice" | "none" {
  if (!date) return "none";
  const diffMs = date.getTime() - now.getTime();
  if (diffMs < 0) return "overdue";
  const remaining = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (remaining < 3) return "soon";
  if (remaining < 5) return "warning";
  if (remaining < 7) return "notice";
  return "none";
}
/**
 * Extracts the occurrence date from an occurrence item.
 */
function getOccurrenceDate(item: OccurrenceItem): Date | null {
  const key = getOccurrenceKey({
    recurrenceId: item.occurrence.recurrenceId ?? undefined,
    start: "start" in item.occurrence ? item.occurrence.start : undefined,
    due: "due" in item.occurrence ? item.occurrence.due : undefined,
  });
  if (!key) return null;
  const timeZone =
    item.occurrence.recurrenceIdTimeZone ??
    item.occurrence.timeZone ??
    undefined;
  return toDateValue(key, timeZone);
}
/**
 * Checks whether an item represents the supplied event occurrence key.
 */
function isSameOccurrence(item: OccurrenceItem, eventId: string, key: string) {
  if (item.eventId !== eventId) return false;
  const itemKey = getOccurrenceKey({
    recurrenceId: item.occurrence.recurrenceId ?? undefined,
    start: "start" in item.occurrence ? item.occurrence.start : undefined,
    due: "due" in item.occurrence ? item.occurrence.due : undefined,
  });
  return itemKey === key;
}
type MonthGroup = { key: string; label: string; items: OccurrenceItem[] };
/**
 * Groups occurrence items by localized calendar month.
 */
function buildMonthGroups(items: OccurrenceItem[], locale: string): MonthGroup[] {
  const entries: Array<{
    item: OccurrenceItem;
    date: Date;
    key: string;
    label: string;
  }> = [];
  for (const item of items) {
    const occurrenceKey = getOccurrenceKey({
      recurrenceId: item.occurrence.recurrenceId ?? undefined,
      start: "start" in item.occurrence ? item.occurrence.start : undefined,
      due: "due" in item.occurrence ? item.occurrence.due : undefined,
    });
    if (!occurrenceKey) continue;
    const timeZone =
      item.occurrence.recurrenceIdTimeZone ??
      item.occurrence.timeZone ??
      undefined;
    const date = toDateValue(occurrenceKey, timeZone);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
    });
    entries.push({ item, date, key, label });
  }
  entries.sort((a, b) => {
    const diff = a.date.getTime() - b.date.getTime();
    if (diff !== 0) return diff;
    return a.item.eventId.localeCompare(b.item.eventId);
  });
  const groups: MonthGroup[] = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last && last.key === entry.key) {
      last.items.push(entry.item);
    } else {
      groups.push({ key: entry.key, label: entry.label, items: [entry.item] });
    }
  }
  return groups;
}
type OccurrenceFeedProps = {
  initialResult: OccurrenceResult;
  initialOverdueItems: OccurrenceItem[];
  demoMode?: boolean;
};
/**
 * Renders the upcoming occurrence feed and handles client-side infinite loading.
 */
export default function OccurrenceFeed({
  initialResult,
  initialOverdueItems,
  demoMode = false,
}: OccurrenceFeedProps) {
  const { language, t } = useI18n();
  const locale = getLanguageLocale(language);
  const [items, setItems] = useState<OccurrenceItem[]>(initialResult.items);
  const [overdueItems, setOverdueItems] =
    useState<OccurrenceItem[]>(initialOverdueItems);
  const [offset, setOffset] = useState(
    initialResult.nextOffset ?? initialResult.items.length,
  );
  const [rangeTo, setRangeTo] = useState(
    () => new Date(initialResult.range.to),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<OccurrenceItem | null>(null);
  const [hasMore, setHasMore] = useState(initialResult.nextOffset !== null);
  const [canExtend, setCanExtend] = useState(true);
  const [serverNow, setServerNow] = useState<Date | null>(
    () => new Date(initialResult.serverNow),
  );
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const rangeFrom = useMemo(
    () => new Date(initialResult.range.from),
    [initialResult.range.from],
  );
  const upcomingItems = useMemo(() => items, [items]);
  const monthGroups = useMemo(
    () => buildMonthGroups(upcomingItems, locale),
    [locale, upcomingItems],
  );
  /**
   * Loads an occurrence page from the API and appends it to the feed.
   */
  const fetchPage = useCallback(
    async (nextOffset: number, nextRangeTo: Date) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/occurrences?from=${rangeFrom.toISOString()}&to=${nextRangeTo.toISOString()}&limit=24&offset=${nextOffset}`,
        );
        if (!res.ok) throw new Error("failed to load");
        const data: OccurrenceResult = await res.json();
        if (data.serverNow) {
          const nowDate = new Date(data.serverNow);
          if (!Number.isNaN(nowDate.getTime())) {
            setServerNow(nowDate);
          }
        }
        setItems((prev) =>
          nextOffset === 0 ? data.items : [...prev, ...data.items],
        );
        if (data.nextOffset === null) {
          setHasMore(false);
          if (data.items.length === 0) {
            setCanExtend(false);
          }
        } else {
          setHasMore(true);
          setOffset(data.nextOffset);
        }
      } catch {
        setError(t("tasksLoadFailed"));
      } finally {
        setLoading(false);
      }
    },
    [rangeFrom, t],
  );
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || loading) return;
        if (hasMore) {
          fetchPage(offset, rangeTo);
          return;
        }
        if (!canExtend) return;
        const extended = new Date(
          rangeTo.getTime() + RANGE_DAYS * 86400 * 1000,
        );
        setRangeTo(extended);
        const nextOffset = items.length;
        setOffset(nextOffset);
        setHasMore(true);
        fetchPage(nextOffset, extended);
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [canExtend, fetchPage, hasMore, items.length, loading, offset, rangeTo]);
  /**
   * Registers the selected occurrence as completed.
   */
  async function submitCompletion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const key = getOccurrenceKey({
      recurrenceId: selected.occurrence.recurrenceId ?? undefined,
      start:
        "start" in selected.occurrence ? selected.occurrence.start : undefined,
      due: "due" in selected.occurrence ? selected.occurrence.due : undefined,
    });
    if (!key) return;
    data.append("eventId", selected.eventId);
    data.append("occurrenceId", key);
    const res = await fetch("/api/completions", { method: "POST", body: data });
    if (res.ok) {
      const completedAt =
        data.get("completedAt")?.toString() || new Date().toISOString();
      setItems((prev) =>
        prev.map((item) =>
          isSameOccurrence(item, selected.eventId, key)
            ? { ...item, completedAt }
            : item,
        ),
      );
      setOverdueItems((prev) =>
        prev.map((item) =>
          isSameOccurrence(item, selected.eventId, key)
            ? { ...item, completedAt }
            : item,
        ),
      );
      setSelected(null);
      setAttachedFiles([]);
      form.reset();
    } else {
      const detail = await res.text();
      const message = detail
        ? `${t("completionFailed")} (${res.status} ${res.statusText}): ${detail}`
        : `${t("completionFailed")} (${res.status} ${res.statusText})`;
      setError(message);
    }
  }
  /**
   * Stores selected attachment files for the completion form.
   */
  function handleFiles(files: FileList | File[]) {
    const next = Array.from(files).filter((file) => file.size > 0);
    setAttachedFiles(next);
  }
  /**
   * Handles file input changes for completion attachments.
   */
  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.currentTarget.files) return;
    handleFiles(event.currentTarget.files);
    setDragActive(false);
  }
  /**
   * Handles dropped files for completion attachments.
   */
  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    const files = event.dataTransfer.files;
    if (!files || files.length === 0) return;
    handleFiles(files);
    if (fileInputRef.current) {
      const dt = new DataTransfer();
      for (const file of Array.from(files)) {
        dt.items.add(file);
      }
      fileInputRef.current.files = dt.files;
    }
  }
  /**
   * Renders either the completion action button or completed status.
   */
  function renderCompletionAction(item: OccurrenceItem) {
    if (item.completedAt) {
      return <CompletionStatusBadge label={t("completed")} />;
    }

    return (
      <Button
        type="button"
        variant="primary"
        size="md"
        icon={HiOutlineCheckBadge}
        label={t("completeAction")}
        fontWeight="semibold"
        onClick={() => setSelected(item)}
      />
    );
  }
  return (
    <PageLayout titleKey="pageUpcoming">
      {demoMode ? (
        <div className="rounded-md bg-surface p-4 shadow-sm">
          {t("demoResetNotice")}
        </div>
      ) : null}
      {error && (
        <div className="rounded-md bg-surface p-4 shadow-sm">{error}</div>
      )}
      <section className="grid gap-6">
        {items.length === 0 && overdueItems.length === 0 && !loading && (
          <div className="rounded-md bg-surface p-4 shadow-sm">
            {t("noTasks")}
          </div>
        )}
        {overdueItems.length > 0 && (
          <div className="grid gap-4">
            <ListSectionHeader label={t("pending")} tone="accent" />
            {overdueItems.map((item, index) => {
              const key = getOccurrenceKey({
                recurrenceId: item.occurrence.recurrenceId ?? undefined,
                start:
                  "start" in item.occurrence
                    ? item.occurrence.start
                    : undefined,
                due: "due" in item.occurrence ? item.occurrence.due : undefined,
              });
              const timeZone =
                item.occurrence.recurrenceIdTimeZone ??
                item.occurrence.timeZone ??
                null;
              const dateValue = key
                ? formatLocalizedDateTimeValue(key, locale, timeZone)
                : "-";
              const now = serverNow ?? new Date();
              const ribbonTone = item.completedAt
                ? "none"
                : pickRibbonTone(getOccurrenceDate(item), now);
              return (
                <OccurrenceListItem
                  key={`${item.eventId}-overdue-${key}-${index}`}
                  item={item}
                  dateText={dateValue}
                  ribbonTone={ribbonTone}
                  action={renderCompletionAction(item)}
                />
              );
            })}
          </div>
        )}
        {monthGroups.map((group) => (
          <div key={group.key} className="grid gap-4">
            <ListSectionHeader label={group.label} />
            {group.items.map((item, index) => {
              const key = getOccurrenceKey({
                recurrenceId: item.occurrence.recurrenceId ?? undefined,
                start:
                  "start" in item.occurrence
                    ? item.occurrence.start
                    : undefined,
                due: "due" in item.occurrence ? item.occurrence.due : undefined,
              });
              const timeZone =
                item.occurrence.recurrenceIdTimeZone ??
                item.occurrence.timeZone ??
                null;
              const dateValue = key
                ? formatLocalizedDateTimeValue(key, locale, timeZone)
                : "-";
              const now = serverNow ?? new Date();
              const ribbonTone = pickRibbonTone(getOccurrenceDate(item), now);
              return (
                <OccurrenceListItem
                  key={`${item.eventId}-${key}-${index}`}
                  item={item}
                  dateText={dateValue}
                  ribbonTone={ribbonTone}
                  action={renderCompletionAction(item)}
                />
              );
            })}
          </div>
        ))}
      </section>
      <div ref={sentinelRef} className="h-12" />
      <Modal
        open={Boolean(selected)}
        eyebrow={t("completeModalTitle")}
        title={selected?.title}
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <form className="space-y-4" onSubmit={submitCompletion}>
            <SplitDateTimeField
              label={t("completedAt")}
              name="completedAt"
              defaultValue={toLocalInputValue(new Date())}
              required
            />
            <label className="block ">
              {t("memo")}
              <textarea
                name="memo"
                rows={3}
                className="mt-2 w-full rounded-md bg-surface px-4 py-2 shadow-sm"
                placeholder={t("memoPlaceholder")}
              />
            </label>
            <label className="block ">
              {t("attachments")}
              <div
                className={`mt-2 flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 px-4 py-6 transition ${dragActive ? "bg-[color:color-mix(in oklab,var(--accent) 12%,transparent)]" : "bg-[color:color-mix(in oklab,var(--ink) 4%,transparent)]"}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                <span>{t("dragDrop")}</span>
                <span className="text-[color:color-mix(in oklab,var(--ink) 60%,transparent)]">
                  {t("orChoose")}
                </span>
                <Button
                  type="button"
                  variant="surface"
                  size="sm"
                  icon={HiOutlinePaperClip}
                  label={t("chooseFile")}
                  onClick={() => fileInputRef.current?.click()}
                />
              </div>
              <input
                ref={fileInputRef}
                name="files"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              {attachedFiles.length > 0 ? (
                <ul className="mt-2 space-y-1 ">
                  {attachedFiles.map((file) => (
                    <li
                      key={`${file.name}-${file.lastModified}`}
                      className="truncate"
                    >
                      {file.name}
                    </li>
                  ))}
                </ul>
              ) : null}
            </label>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon={HiOutlineCheckCircle}
              label={t("completeSubmit")}
              type="submit"
            />
          </form>
        ) : null}
      </Modal>
    </PageLayout>
  );
}
