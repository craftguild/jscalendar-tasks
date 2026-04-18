"use client";
import { useState } from "react";
import type { DayOfWeek, RecurrenceRule } from "@craftguild/jscalendar";
import type { AppJsonValue } from "@/lib/json-value";
import { toJsCalendarObject } from "@/lib/jscal-normalize";
import { localDateTimeToDate } from "@/lib/datetime";
import {
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineTrash,
} from "react-icons/hi2";
import Button from "@/components/Button";
import ChoiceMessageModal from "@/components/ChoiceMessageModal";
import FloatingActionButton from "@/components/FloatingActionButton";
import PageLayout from "@/components/PageLayout";
import TaskCard from "@/components/TaskCard";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { getLanguageLocale } from "@/lib/language";
type EventRecord = {
  id: string;
  title: string;
  jscal: AppJsonValue;
  tags: { id: string; name: string; color: string }[];
  createdAt: string;
  updatedAt: string;
};
/**
 * Formats a task start date for the task list.
 */
function formatStart(value: string | undefined, locale: string): string {
  if (!value) return "";
  if (value.endsWith("Z")) {
    return new Date(value).toLocaleString(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    });
  }
  const local = localDateTimeToDate(value);
  return local.toLocaleString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
}
/**
 * Extracts the start or due field from a JSCalendar task/event payload.
 */
function pickStart(jscal: AppJsonValue): string | undefined {
  const obj = toJsCalendarObject(jscal);
  if (!obj) return undefined;
  if (obj["@type"] == "Event") return obj.start;
  if (obj["@type"] == "Task") return obj.start ?? obj.due;
  return undefined;
}
/**
 * Extracts the description from a JSCalendar task/event payload.
 */
function pickDescription(jscal: AppJsonValue): string | null {
  const obj = toJsCalendarObject(jscal);
  if (!obj) return null;
  if (obj["@type"] == "Event" || obj["@type"] == "Task")
    return obj.description ?? null;
  return null;
}
const dayShortKeys: Record<DayOfWeek, MessageKey> = {
  mo: "weekdayShortMo",
  tu: "weekdayShortTu",
  we: "weekdayShortWe",
  th: "weekdayShortTh",
  fr: "weekdayShortFr",
  sa: "weekdayShortSa",
  su: "weekdayShortSu",
};
const frequencyKeys: Record<RecurrenceRule["frequency"], MessageKey> = {
  daily: "daily",
  weekly: "weekly",
  monthly: "monthly",
  yearly: "yearly",
  hourly: "hourly",
  minutely: "minutely",
  secondly: "secondly",
};
/**
 * Formats a local or UTC date-time string for recurrence summaries.
 */
function formatLocalDateTimeLabel(
  value: string | undefined,
  locale: string,
): string {
  if (!value) return "";
  if (value.endsWith("Z")) {
    return new Date(value).toLocaleString(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  const local = localDateTimeToDate(value);
  return local.toLocaleString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
/**
 * Formats one byDay entry, including nth weekday rules.
 */
function formatNthDay(
  entry: { day: DayOfWeek; nthOfPeriod?: number },
  t: (key: MessageKey, values?: Record<string, string | number>) => string,
): string {
  const label = t(dayShortKeys[entry.day]);
  if (!entry.nthOfPeriod) return label;
  const abs = Math.abs(entry.nthOfPeriod);
  const key = entry.nthOfPeriod > 0 ? "nthWeekdayLabel" : "lastNthWeekday";
  return t(key, { value: abs, day: label });
}
/**
 * Formats the anchor date-time shown in a recurrence summary.
 */
function formatAnchorDateTime(date: Date, locale: string): string {
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return `${date.toLocaleDateString(locale, { month: "short", day: "numeric" })} ${time}`;
}
/**
 * Formats a numeric month value for the active locale.
 */
function formatMonthValue(month: number, locale: string): string {
  return new Date(2000, month - 1, 1).toLocaleDateString(locale, {
    month: "short",
  });
}
/**
 * Builds a localized recurrence summary for a task card.
 */
function pickRuleSummary(
  jscal: AppJsonValue,
  locale: string,
  t: (key: MessageKey, values?: Record<string, string | number>) => string,
): {
  typeLabel: string;
  frequencyLabel: string;
  details: string[];
  dateTimeLabel?: string;
  hasMultipleRules: boolean;
} | null {
  const obj = toJsCalendarObject(jscal);
  if (!obj) return null;
  if (obj["@type"] !== "Event" && obj["@type"] !== "Task") return null;
  const rules = obj.recurrenceRules ?? [];
  const rule = rules[0];
  const hasMultipleRules = rules.length > 1;
  const anchor = obj["@type"] === "Event" ? obj.start : (obj.start ?? obj.due);
  const anchorDate = anchor
    ? anchor.endsWith("Z")
      ? new Date(anchor)
      : localDateTimeToDate(anchor)
    : null;
  if (!rule) {
    return {
      typeLabel: obj["@type"] === "Task" ? t("eventTask") : t("eventEvent"),
      frequencyLabel: t("oneTime"),
      details: [],
      dateTimeLabel: anchorDate
        ? formatAnchorDateTime(anchorDate, locale)
        : undefined,
      hasMultipleRules,
    };
  }
  const details: string[] = [];
  if (rule.interval && rule.interval > 1) {
    details.push(t("detailsInterval", { value: rule.interval }));
  }
  if (rule.count && rule.count > 0) {
    details.push(t("detailsCount", { value: rule.count }));
  }
  if (rule.until) {
    details.push(
      t("detailsUntil", {
        value: formatLocalDateTimeLabel(rule.until, locale),
      }),
    );
  }
  if (rule.byDay && rule.byDay.length > 0) {
    const value = rule.byDay.map((d) => formatNthDay(d, t)).join(" / ");
    details.push(t("detailsWeekday", { value }));
  }
  if (rule.byMonth && rule.byMonth.length > 0) {
    const value = rule.byMonth
      .map((m) => formatMonthValue(Number(m), locale))
      .join(" / ");
    details.push(t("detailsMonth", { value }));
  } else if (rule.frequency === "yearly" && anchorDate) {
    const value = formatMonthValue(anchorDate.getMonth() + 1, locale);
    details.push(t("detailsMonth", { value }));
  }
  return {
    typeLabel: obj["@type"] === "Task" ? t("eventTask") : t("eventEvent"),
    frequencyLabel: t(frequencyKeys[rule.frequency] ?? "recurring"),
    details,
    dateTimeLabel: anchorDate
      ? formatAnchorDateTime(anchorDate, locale)
      : undefined,
    hasMultipleRules,
  };
}
type TasksClientProps = { initialEvents: EventRecord[] };
/**
 * Renders the task management list and deletion flow.
 */
export default function TasksClient({ initialEvents }: TasksClientProps) {
  const { language, t } = useI18n();
  const locale = getLanguageLocale(language);
  const [events, setEvents] = useState<EventRecord[]>(initialEvents);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  /**
   * Reloads active events after a mutation.
   */
  async function loadEvents() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/events");
    if (res.ok) {
      const data: { events: EventRecord[] } = await res.json();
      setEvents(data.events ?? []);
    }
    setLoading(false);
  }
  /**
   * Deletes or soft-deletes a task through the API.
   */
  async function deleteTask(id: string) {
    setError("");
    setDeleteTargetId(null);
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (res.ok) {
      await loadEvents();
      return;
    }
    let message = t("deleteFailed");
    try {
      const data = await res.json();
      if (data && typeof data.error === "string") {
        if (data.error.includes("Completed tasks")) {
          message = t("deleteBlocked");
        } else {
          message = `${t("deleteFailed")}: ${data.error}`;
        }
      }
    } catch {
      const detail = await res.text();
      if (detail) {
        message = `${t("deleteFailed")}: ${detail}`;
      }
    }
    setError(message);
  }
  return (
    <PageLayout titleKey="pageTasks">
      <section className="grid gap-4 pb-28">
        {error && (
          <div className="rounded-md bg-surface p-4 shadow-sm">{error}</div>
        )}
        {loading && (
          <span className="text-[color:color-mix(in oklab,var(--ink) 60%,transparent)]">
            {t("loading")}
          </span>
        )}
        {events.length == 0 && !loading && (
          <div className="rounded-md bg-surface p-4 shadow-sm">
            {t("noTasks")}
          </div>
        )}
        {events.map((event) => {
          const start = pickStart(event.jscal);
          const description = pickDescription(event.jscal);
          const ruleSummary = pickRuleSummary(event.jscal, locale, t);
          return (
            <TaskCard
              key={event.id}
              dateText={
                ruleSummary
                  ? `${ruleSummary.typeLabel} / ${ruleSummary.frequencyLabel}${ruleSummary.dateTimeLabel ? ` ${ruleSummary.dateTimeLabel}` : ""}${ruleSummary.hasMultipleRules ? ` (${t("multipleRules")})` : ""}`
                  : start
                    ? formatStart(start, locale)
                    : "-"
              }
              title={event.title}
              notes={description}
              details={
                ruleSummary && ruleSummary.details.length > 0 ? (
                  <div className="grid gap-1 text-[color:color-mix(in oklab,var(--ink) 65%,transparent)]">
                    <span>{ruleSummary.details.join(" / ")}</span>
                  </div>
                ) : null
              }
              tags={event.tags}
              action={
                <>
                  <Button
                    href={`/tasks/${event.id}/edit`}
                    variant="surface"
                    size="md"
                    icon={HiOutlinePencilSquare}
                    label={t("edit")}
                  />
                  <Button
                    type="button"
                    variant="danger"
                    size="md"
                    icon={HiOutlineTrash}
                    label={t("delete")}
                    onClick={() => setDeleteTargetId(event.id)}
                  />
                </>
              }
            />
          );
        })}
      </section>
      <FloatingActionButton
        href="/tasks/new"
        icon={HiOutlinePlus}
        label={<span>{t("register")}</span>}
      />
      <ChoiceMessageModal
        open={deleteTargetId !== null}
        title={t("deleteTitle")}
        message={t("deleteConfirm")}
        choices={[
          { value: "delete", label: t("deleteAction"), variant: "danger" },
          { value: "cancel", label: t("cancel"), variant: "normal" },
        ]}
        onSelect={(value) => {
          if (value === "delete" && deleteTargetId) {
            void deleteTask(deleteTargetId);
            return;
          }
          setDeleteTargetId(null);
        }}
        onClose={() => setDeleteTargetId(null)}
      />
    </PageLayout>
  );
}
