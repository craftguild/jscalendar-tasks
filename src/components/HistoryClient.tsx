"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import CompletionStatusBadge from "@/components/CompletionStatusBadge";
import CompletionEditButton from "@/components/CompletionEditButton";
import HistoryMonthSelector from "@/components/HistoryMonthSelector";
import TaskCard from "@/components/TaskCard";
import { formatLocalizedDateTimeValue } from "@/lib/date-format";
import type { CompletionHistoryItem } from "@/lib/history-data";
import type { AppJsonObject, AppJsonValue } from "@/lib/json-value";
import { isAppJsonObject } from "@/lib/json-value";
import { toJsCalendarObject } from "@/lib/jscal-normalize";
import { useI18n } from "@/lib/i18n";
import { getLanguageLocale } from "@/lib/language";

type HistoryClientProps = {
  initialYear: number;
  initialMonth: number;
  years: number[];
  initialItems: CompletionHistoryItem[];
};

/**
 * Narrows an app JSON value to a plain JSON object.
 */
function isJsonObject(value: AppJsonValue): value is AppJsonObject {
  return isAppJsonObject(value);
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
 * Returns the best title for a completion history item.
 */
function getSnapshotTitle(item: CompletionHistoryItem): string {
  const obj = toJsCalendarObject(getSnapshotJsCal(item.snapshot));
  if (!obj) return item.event.title;
  if (obj["@type"] === "Event" || obj["@type"] === "Task") {
    return obj.title ?? item.event.title;
  }
  return item.event.title;
}

/**
 * Returns the snapshot description for a completion history item.
 */
function getSnapshotDescription(item: CompletionHistoryItem): string | null {
  const obj = toJsCalendarObject(getSnapshotJsCal(item.snapshot));
  if (!obj) return null;
  if (obj["@type"] === "Event" || obj["@type"] === "Task") {
    return obj.description ?? null;
  }
  return null;
}

/**
 * Returns the tags stored in a completion snapshot.
 */
function getSnapshotTags(
  item: CompletionHistoryItem,
): { name: string; color?: string }[] {
  const snapshot = item.snapshot;
  if (isJsonObject(snapshot)) {
    const tags = snapshot.tags;
    if (Array.isArray(tags)) {
      const items: { name: string; color?: string }[] = [];
      for (const entry of tags) {
        if (isJsonObject(entry) && typeof entry.name === "string") {
          const color =
            typeof entry.color === "string" ? entry.color : undefined;
          items.push({ name: entry.name, color });
        }
      }
      return items;
    }
  }
  return [];
}

/**
 * Renders the history page client island and month switching behavior.
 */
export default function HistoryClient({
  initialYear,
  initialMonth,
  years,
  initialItems,
}: HistoryClientProps) {
  const { language, t } = useI18n();
  const locale = getLanguageLocale(language);
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  /**
   * Loads completion history for a month and updates the current URL.
   */
  const loadMonth = useCallback(async (nextYear: number, nextMonth: number) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setError("");
    const params = new URLSearchParams({
      year: String(nextYear),
      month: String(nextMonth),
    });
    const response = await fetch(`/api/completions?${params.toString()}`);
    if (requestId !== requestIdRef.current) return;
    if (!response.ok) {
      setError(t("historyLoadFailed"));
      return;
    }
    const data = (await response.json()) as {
      items?: CompletionHistoryItem[];
      completions?: CompletionHistoryItem[];
    };
    if (requestId !== requestIdRef.current) return;
    setYear(nextYear);
    setMonth(nextMonth);
    setItems(data.items ?? data.completions ?? []);
    window.history.replaceState(
      null,
      "",
      `/history?year=${nextYear}&month=${nextMonth}`,
    );
  }, [t]);

  const renderedItems = useMemo(
    () =>
      items.map((item) => {
        const title = getSnapshotTitle(item);
        return (
          <TaskCard
            key={item.id}
            dateText={`${formatLocalizedDateTimeValue(item.occurrenceId, locale)} / ${formatLocalizedDateTimeValue(item.completedAt, locale)} ${t("completedSuffix")}`}
            title={title}
            notes={getSnapshotDescription(item)}
            tags={getSnapshotTags(item)}
            action={
              <div className="flex flex-wrap items-center gap-2">
                <CompletionEditButton
                  completionId={item.id}
                  title={title}
                  memo={item.memo}
                  attachments={item.attachments}
                  onUpdated={() => loadMonth(year, month)}
                />
                <CompletionStatusBadge label={t("completedSuffix")} />
              </div>
            }
            footer={
              item.memo || item.attachments.length > 0 ? (
                <div className="grid gap-2">
                  {item.memo ? (
                    <p className="text-[color:color-mix(in oklab,var(--ink) 70%,transparent)]">
                      {t("memo")}: {item.memo}
                    </p>
                  ) : null}
                  {item.attachments.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {item.attachments.map((file) => (
                        <a
                          key={file.id}
                          href={`/api/attachments/${file.id}`}
                          className="rounded-md bg-surface px-3 py-1 shadow-sm"
                        >
                          {file.filename}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null
            }
          />
        );
      }),
    [items, loadMonth, locale, month, t, year],
  );

  return (
    <>
      <HistoryMonthSelector
        year={year}
        month={month}
        years={years}
        onChange={loadMonth}
      />
      <section className="grid gap-4">
        {error ? (
          <div className="rounded-md bg-surface p-4 text-red-600 shadow-sm">
            {error}
          </div>
        ) : null}
        {items.length === 0 && !error ? (
          <div className="rounded-md bg-surface p-4 shadow-sm">
            {t("noHistory")}
          </div>
        ) : null}
        {renderedItems}
      </section>
    </>
  );
}
