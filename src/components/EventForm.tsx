"use client";
/* eslint-disable react-hooks/set-state-in-effect */ import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  HiOutlineArrowPath,
  HiOutlinePlus,
  HiOutlineTrash,
} from "react-icons/hi2";
import { HiPencilAlt } from "react-icons/hi";
import { JsCal } from "@craftguild/jscalendar";
import type {
  DayOfWeek,
  JSCalendarObject,
  RecurrenceRule,
  TimeZoneId,
} from "@craftguild/jscalendar";
import AccessibleSelect, {
  type SelectOption,
} from "@/components/AccessibleSelect";
import Button from "@/components/Button";
import ChoiceMessageModal from "@/components/ChoiceMessageModal";
import EventFormTagSection from "@/components/EventFormTagSection";
import FormSection from "@/components/FormSection";
import RadioButton from "@/components/RadioButton";
import SplitDateTimeField from "@/components/SplitDateTimeField";
import { useI18n } from "@/lib/i18n";
import { TAG_COLORS } from "@/lib/tag-colors";
import { buildEventPayload } from "@/lib/event-form-model";
type FrequencyOption = { value: RecurrenceRule["frequency"]; label: string };
const frequencyValues: RecurrenceRule["frequency"][] = [
  "daily",
  "weekly",
  "monthly",
  "yearly",
];
const dayValues: DayOfWeek[] = ["mo", "tu", "we", "th", "fr", "sa", "su"];
type ByDayEntry = { day: DayOfWeek; nthOfPeriod?: number | "" };
type MonthlyMode = "monthDay" | "nthWeekday";
export type TagValue = { name: string; color: string | null };
type TagResponse = { tags?: Array<{ name?: string; color?: string | null }> };
type EventFormData = {
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
export type EventFormInitial = {
  id?: string;
  jscal?: JSCalendarObject | null;
  tags?: TagValue[];
};
type EventFormProps = {
  mode: "create" | "edit";
  initial?: EventFormInitial | null;
  onProcessed?: () => void;
};
/**
 * Formats a Date for a local datetime input.
 */
function toLocalInputValue(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
/**
 * Formats a JSCalendar LocalDateTime string for display in form fields.
 */
function displayLocalDateTime(value?: string): string {
  if (!value) return "";
  return value.length >= 16 ? value.slice(0, 16) : value;
}
/**
 * Parses a JSCalendar duration string into seconds.
 */
function parseDurationSeconds(value?: string): number | null {
  if (!value) return null;
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(
    value,
  );
  if (!match) return null;
  const daysValue = match[1] ? Number(match[1]) : 0;
  const hoursValue = match[2] ? Number(match[2]) : 0;
  const minutesValue = match[3] ? Number(match[3]) : 0;
  const secondsValue = match[4] ? Number(match[4]) : 0;
  return (
    daysValue * 86400 + hoursValue * 3600 + minutesValue * 60 + secondsValue
  );
}
/**
 * Selects the monthly recurrence editing mode for an existing rule.
 */
function getMonthlyMode(rule?: RecurrenceRule): MonthlyMode {
  if (rule?.byDay && rule.byDay.length > 0) return "nthWeekday";
  return "monthDay";
}
/**
 * Converts an optional JSCalendar object into editable form state.
 */
function toFormData(initial?: EventFormInitial | null): EventFormData {
  const base: EventFormData = {
    title: "",
    description: "",
    start: toLocalInputValue(new Date()),
    timeZone: "Asia/Tokyo",
    durationHours: 1,
    durationMinutes: 0,
    recurrenceType: "single",
    frequency: "monthly",
    monthlyMode: "monthDay",
    interval: 1,
    count: "",
    until: "",
    byDay: [],
    byMonth: "",
    byMonthDay: "",
    byYearDay: "",
    byWeekNo: "",
    byHour: "",
    byMinute: "",
    bySecond: "",
    bySetPosition: "",
    firstDayOfWeek: "",
    skip: "",
    rscale: "",
    tags: initial?.tags ?? [],
  };
  const obj = initial?.jscal;
  if (!obj) return base;
  if (obj["@type"] === "Task") {
    const durationValue =
      "duration" in obj && typeof obj.duration === "string"
        ? obj.duration
        : undefined;
    const durationSeconds = parseDurationSeconds(durationValue);
    const hours = durationSeconds ? Math.floor(durationSeconds / 3600) : 1;
    const minutes = durationSeconds
      ? Math.floor((durationSeconds % 3600) / 60)
      : 0;
    const firstRule =
      obj.recurrenceRules && obj.recurrenceRules.length > 0
        ? obj.recurrenceRules[0]
        : undefined;
    const recurrenceType = firstRule ? "recurring" : "single";
    return {
      ...base,
      title: obj.title ?? "",
      description: obj.description ?? "",
      start: displayLocalDateTime(obj.start ?? obj.due),
      timeZone: obj.timeZone ?? "",
      durationHours: hours,
      durationMinutes: minutes,
      recurrenceType,
      frequency: firstRule?.frequency ?? base.frequency,
      monthlyMode: getMonthlyMode(firstRule),
      interval: firstRule?.interval ?? 1,
      count: firstRule?.count ? String(firstRule.count) : "",
      until: displayLocalDateTime(firstRule?.until),
      byDay: firstRule?.byDay
        ? firstRule.byDay.map((entry) => ({
            day: entry.day,
            nthOfPeriod: entry.nthOfPeriod ?? "",
          }))
        : [],
      byMonth: firstRule?.byMonth ? firstRule.byMonth.join(",") : "",
      byMonthDay: firstRule?.byMonthDay ? firstRule.byMonthDay.join(",") : "",
      byYearDay: firstRule?.byYearDay ? firstRule.byYearDay.join(",") : "",
      byWeekNo: firstRule?.byWeekNo ? firstRule.byWeekNo.join(",") : "",
      byHour: firstRule?.byHour ? firstRule.byHour.join(",") : "",
      byMinute: firstRule?.byMinute ? firstRule.byMinute.join(",") : "",
      bySecond: firstRule?.bySecond ? firstRule.bySecond.join(",") : "",
      bySetPosition: firstRule?.bySetPosition
        ? firstRule.bySetPosition.join(",")
        : "",
      firstDayOfWeek: firstRule?.firstDayOfWeek ?? "",
      skip: firstRule?.skip ?? "",
      rscale: firstRule?.rscale ?? "",
      tags: initial?.tags ?? [],
    };
  }
  if (obj["@type"] !== "Event") return base;
  const durationValue =
    "duration" in obj && typeof obj.duration === "string"
      ? obj.duration
      : undefined;
  const durationSeconds = parseDurationSeconds(durationValue);
  const hours = durationSeconds ? Math.floor(durationSeconds / 3600) : 1;
  const minutes = durationSeconds
    ? Math.floor((durationSeconds % 3600) / 60)
    : 0;
  const firstRule =
    obj.recurrenceRules && obj.recurrenceRules.length > 0
      ? obj.recurrenceRules[0]
      : undefined;
  const recurrenceType = firstRule ? "recurring" : "single";
  return {
    ...base,
    title: obj.title ?? "",
    description: obj.description ?? "",
    start: displayLocalDateTime(obj.start),
    timeZone: obj.timeZone ?? "",
    durationHours: hours,
    durationMinutes: minutes,
    recurrenceType,
    frequency: firstRule?.frequency ?? base.frequency,
    monthlyMode: getMonthlyMode(firstRule),
    interval: firstRule?.interval ?? 1,
    count: firstRule?.count ? String(firstRule.count) : "",
    until: displayLocalDateTime(firstRule?.until),
    byDay: firstRule?.byDay
      ? firstRule.byDay.map((entry) => ({
          day: entry.day,
          nthOfPeriod: entry.nthOfPeriod ?? "",
        }))
      : [],
    byMonth: firstRule?.byMonth ? firstRule.byMonth.join(",") : "",
    byMonthDay: firstRule?.byMonthDay ? firstRule.byMonthDay.join(",") : "",
    byYearDay: firstRule?.byYearDay ? firstRule.byYearDay.join(",") : "",
    byWeekNo: firstRule?.byWeekNo ? firstRule.byWeekNo.join(",") : "",
    byHour: firstRule?.byHour ? firstRule.byHour.join(",") : "",
    byMinute: firstRule?.byMinute ? firstRule.byMinute.join(",") : "",
    bySecond: firstRule?.bySecond ? firstRule.bySecond.join(",") : "",
    bySetPosition: firstRule?.bySetPosition
      ? firstRule.bySetPosition.join(",")
      : "",
    firstDayOfWeek: firstRule?.firstDayOfWeek ?? "",
    skip: firstRule?.skip ?? "",
    rscale: firstRule?.rscale ?? "",
    tags: initial?.tags ?? [],
  };
}
/**
 * Renders the create/edit task form and maps form state to JSCalendar payloads.
 */
export default function EventForm({
  mode,
  initial,
  onProcessed,
}: EventFormProps) {
  const { t } = useI18n();
  const [form, setForm] = useState<EventFormData>(() => toFormData(initial));
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">(
    "idle",
  );
  const [tagOptions, setTagOptions] = useState<TagValue[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [tagColor, setTagColor] = useState<string | null>(null);
  const [timeZoneOpen, setTimeZoneOpen] = useState(false);
  const timeZones = useMemo<readonly TimeZoneId[]>(() => JsCal.timeZones, []);
  const frequencies = useMemo<FrequencyOption[]>(
    () =>
      frequencyValues.map((value) => ({
        value,
        label:
          value === "daily"
            ? t("daily")
            : value === "weekly"
              ? t("weekly")
              : value === "monthly"
                ? t("monthly")
                : t("yearly"),
      })),
    [t],
  );
  const dayOptions = useMemo<SelectOption<DayOfWeek>[]>(
    () =>
      dayValues.map((value) => ({
        value,
        label:
          value === "mo"
            ? t("weekdayMo")
            : value === "tu"
              ? t("weekdayTu")
              : value === "we"
                ? t("weekdayWe")
                : value === "th"
                  ? t("weekdayTh")
                  : value === "fr"
                    ? t("weekdayFr")
                    : value === "sa"
                      ? t("weekdaySa")
                      : t("weekdaySu"),
      })),
    [t],
  );
  useEffect(() => {
    setForm(toFormData(initial));
    setStatus("idle");
    setTagInput("");
    setTagDropdownOpen(false);
    if (initial?.tags && initial.tags.length > 0) {
      setTagColor(initial.tags[0].color ?? null);
      setTagOptions((prev) => {
        const merged = [...prev];
        for (const tag of initial.tags ?? []) {
          if (!merged.some((item) => item.name === tag.name)) {
            merged.push(tag);
          }
        }
        return merged;
      });
    } else {
      setTagColor(null);
    }
  }, [initial]);
  useEffect(() => {
    /**
     * Loads known tags so the tag combobox can suggest existing values.
     */
    async function loadTags() {
      const res = await fetch("/api/tags");
      if (!res.ok) return;
      const data: TagResponse = await res.json();
      const tags = Array.isArray(data.tags) ? data.tags : [];
      const items = tags
        .map((tag) => {
          if (typeof tag.name !== "string") return null;
          const name = tag.name.trim();
          if (!name) return null;
          const rawColor =
            typeof tag.color === "string" ? tag.color.trim() : "";
          const color = rawColor || null;
          return { name, color };
        })
        .filter((tag): tag is TagValue => tag !== null);
      setTagOptions((prev) => {
        const merged = [...prev];
        for (const item of items) {
          if (!merged.some((tag) => tag.name === item.name)) {
            merged.push(item);
          }
        }
        return merged;
      });
      setTagColor(null);
    }
    loadTags();
  }, []);
  /**
   * Updates one field in the form state.
   */
  function updateField<K extends keyof EventFormData>(
    key: K,
    value: EventFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }
  /**
   * Adds a weekday entry to the current recurrence rule editor.
   */
  function addByDay() {
    updateField("byDay", [
      ...form.byDay,
      {
        day: "mo",
        nthOfPeriod:
          form.frequency === "monthly" && form.monthlyMode === "nthWeekday"
            ? 1
            : "",
      },
    ]);
  }
  /**
   * Replaces one weekday entry in the recurrence rule editor.
   */
  function updateByDay(index: number, next: ByDayEntry) {
    updateField(
      "byDay",
      form.byDay.map((entry, i) => (i === index ? next : entry)),
    );
  }
  /**
   * Removes one weekday entry from the recurrence rule editor.
   */
  function removeByDay(index: number) {
    updateField(
      "byDay",
      form.byDay.filter((_, i) => i !== index),
    );
  }
  /**
   * Adds a tag to the form, creating a local option when needed.
   */
  function addTag(value: string) {
    const name = value.trim();
    if (!name) return;
    if (form.tags.some((tag) => tag.name === name)) {
      setTagInput("");
      return;
    }
    const existing = tagOptions.find((tag) => tag.name === name);
    const color = tagColor ?? existing?.color ?? TAG_COLORS[0] ?? "#0f172a";
    const next = { name, color };
    updateField("tags", [...form.tags, next]);
    setTagOptions((prev) => {
      const existingTag = prev.find((tag) => tag.name === name);
      if (existingTag) {
        return prev.map((tag) => (tag.name === name ? { ...tag, color } : tag));
      }
      return [...prev, next].sort((a, b) => a.name.localeCompare(b.name, "ja"));
    });
    setTagInput("");
    setTagDropdownOpen(false);
    setTagColor(null);
  }
  /**
   * Removes a tag from the form state.
   */
  function removeTag(name: string) {
    updateField(
      "tags",
      form.tags.filter((tag) => tag.name !== name),
    );
  }
  /**
   * Submits the form to create or update the stored JSCalendar task.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = buildEventPayload(form, timeZones);
    if (!payload) {
      setStatus(form.title.trim() ? "error" : "idle");
      return;
    }
    setStatus("saving");
    const endpoint =
      mode === "edit" && initial?.id
        ? `/api/events/${initial.id}`
        : "/api/events";
    const method = mode === "edit" ? "PATCH" : "POST";
    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setStatus("done");
      if (mode === "create") {
        setForm(toFormData());
      }
    } else {
      setStatus("error");
    }
  }
  /**
   * Clears the completion modal state and runs the processed callback.
   */
  function handleDone() {
    setStatus("idle");
    onProcessed?.();
  }
  return (
    <>
      <form className="grid gap-6" onSubmit={handleSubmit}>
        <FormSection>
          <label className="">
            {t("taskName")}
            <input
              className="mt-2 w-full rounded-md bg-surface px-4 py-2 shadow-sm"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              required
            />
          </label>
          <label className="">
            {t("description")}
            <textarea
              className="mt-2 w-full rounded-md bg-surface px-4 py-2 shadow-sm"
              rows={3}
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
            />
          </label>
        </FormSection>
        <EventFormTagSection
          tags={form.tags}
          tagOptions={tagOptions}
          tagInput={tagInput}
          tagColor={tagColor}
          dropdownOpen={tagDropdownOpen}
          onTagInputChange={setTagInput}
          onTagColorChange={setTagColor}
          onDropdownOpenChange={setTagDropdownOpen}
          onAddTag={addTag}
          onRemoveTag={removeTag}
        />
        <FormSection>
          <div className="grid gap-4 md:grid-cols-2">
            <SplitDateTimeField
              label={t("startAt")}
              value={form.start}
              onChange={(value) => updateField("start", value)}
              required
            />
            <label className="">
              {t("timeZone")}
              <div className="mt-2">
                <AccessibleSelect
                  label={t("timeZone")}
                  labelClassName="sr-only"
                  value={form.timeZone}
                  options={timeZones.map((tz) => ({ value: tz, label: tz }))}
                  onChange={(value) => {
                    updateField("timeZone", value);
                    setTimeZoneOpen(false);
                  }}
                  open={timeZoneOpen}
                  onOpenChange={setTimeZoneOpen}
                  combobox
                  inputValue={form.timeZone}
                  onInputChange={(value) => updateField("timeZone", value)}
                  blurOnSelect
                  placeholder="Asia/Tokyo"
                  buttonClassName="w-full rounded-md bg-surface px-4 py-2 shadow-sm"
                  listClassName="absolute z-20 max-h-56 w-max max-w-[70vw] overflow-auto rounded-md bg-surface p-1 shadow-md focus:outline-none"
                />
              </div>
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="">
              {t("taskType")}
              <div className="mt-2 flex flex-wrap gap-2">
                <RadioButton
                  name="recurrenceType"
                  checked={form.recurrenceType == "single"}
                  label={t("oneTime")}
                  onChange={() => updateField("recurrenceType", "single")}
                />
                <RadioButton
                  name="recurrenceType"
                  checked={form.recurrenceType == "recurring"}
                  label={t("recurring")}
                  onChange={() => updateField("recurrenceType", "recurring")}
                />
              </div>
            </label>
          </div>
        </FormSection>
        {form.recurrenceType == "recurring" && (
          <FormSection>
            <div className="grid gap-3">
              <p className="font-semibold">{t("recurrenceFrequency")}</p>
              <div className="flex flex-wrap gap-2">
                {frequencies.map((freq) => (
                  <RadioButton
                    key={freq.value}
                    name="frequency"
                    checked={form.frequency == freq.value}
                    label={freq.label}
                    onChange={() => updateField("frequency", freq.value)}
                  />
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="">
                {t("interval")}
                <input
                  type="number"
                  min={1}
                  className="mt-2 w-full rounded-md bg-surface px-4 py-2 shadow-sm"
                  value={form.interval}
                  onChange={(event) =>
                    updateField("interval", Number(event.target.value))
                  }
                />
              </label>
              <label className="">
                {t("count")}
                <input
                  type="number"
                  min={1}
                  className="mt-2 w-full rounded-md bg-surface px-4 py-2 shadow-sm"
                  value={form.count}
                  onChange={(event) => updateField("count", event.target.value)}
                />
              </label>
            </div>
            <SplitDateTimeField
              label={t("until")}
              value={form.until}
              onChange={(value) => updateField("until", value)}
            />
            {form.frequency === "weekly" && (
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <p className="font-normal">{t("weekdayRule")}</p>
                  <Button
                    type="button"
                    variant="surface"
                    size="sm"
                    icon={HiOutlinePlus}
                    label={t("add")}
                    onClick={addByDay}
                  />
                </div>
                {form.byDay.length == 0 && (
                  <p className="text-[color:color-mix(in oklab,var(--ink) 60%,transparent)]">
                    {t("addWeekdayPrompt")}
                  </p>
                )}
                {form.byDay.map((entry, index) => (
                  <div
                    key={`${entry.day}-${index}`}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <AccessibleSelect
                      label={t("weekday")}
                      labelClassName="sr-only"
                      value={entry.day}
                      options={dayOptions}
                      onChange={(value) =>
                        updateByDay(index, {
                          day: value,
                          nthOfPeriod: "",
                        })
                      }
                      buttonClassName="flex w-max items-center gap-4 rounded-md bg-surface px-3 py-2 shadow-sm whitespace-nowrap"
                    />
                    <Button
                      type="button"
                      variant="danger"
                      size="md"
                      icon={HiOutlineTrash}
                      label={t("delete")}
                      onClick={() => removeByDay(index)}
                    />
                  </div>
                ))}
              </div>
            )}
            {form.frequency === "monthly" && (
              <div className="grid gap-4">
                <div className="grid gap-3">
                  <p className="font-normal">{t("monthlyRuleType")}</p>
                  <div className="flex flex-wrap gap-2">
                    <RadioButton
                      name="monthlyMode"
                      checked={form.monthlyMode === "monthDay"}
                      label={t("monthDay")}
                      onChange={() => updateField("monthlyMode", "monthDay")}
                    />
                    <RadioButton
                      name="monthlyMode"
                      checked={form.monthlyMode === "nthWeekday"}
                      label={t("nthWeekday")}
                      onChange={() => updateField("monthlyMode", "nthWeekday")}
                    />
                  </div>
                </div>
                {form.monthlyMode === "monthDay" ? (
                  <label className="">
                    {t("dayOfMonth")}
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="15"
                      className="mt-2 w-full rounded-md bg-surface px-4 py-2 shadow-sm"
                      value={form.byMonthDay}
                      onChange={(event) =>
                        updateField("byMonthDay", event.target.value)
                      }
                    />
                  </label>
                ) : (
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                      <p className="font-normal">{t("weekdayRule")}</p>
                      <Button
                        type="button"
                        variant="surface"
                        size="sm"
                        icon={HiOutlinePlus}
                        label={t("add")}
                        onClick={addByDay}
                      />
                    </div>
                    {form.byDay.length == 0 && (
                      <p className="text-[color:color-mix(in oklab,var(--ink) 60%,transparent)]">
                        {t("addNthWeekdayPrompt")}
                      </p>
                    )}
                    {form.byDay.map((entry, index) => (
                      <div
                        key={`${entry.day}-${index}`}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <span className="text-[color:color-mix(in oklab,var(--ink) 70%,transparent)]">
                          {t("nthPrefix")}
                        </span>
                        <input
                          type="number"
                          placeholder="nth"
                          className="w-24 rounded-md bg-surface px-3 py-2 shadow-sm"
                          value={entry.nthOfPeriod}
                          onChange={(event) =>
                            updateByDay(index, {
                              ...entry,
                              nthOfPeriod:
                                event.target.value === ""
                                  ? ""
                                  : Number(event.target.value),
                            })
                          }
                        />
                        <AccessibleSelect
                          label={t("weekday")}
                          labelClassName="sr-only"
                          value={entry.day}
                          options={dayOptions}
                          onChange={(value) =>
                            updateByDay(index, { ...entry, day: value })
                          }
                          buttonClassName="flex w-max items-center gap-4 rounded-md bg-surface px-3 py-2 shadow-sm whitespace-nowrap"
                        />
                        <Button
                          type="button"
                          variant="danger"
                          size="md"
                          icon={HiOutlineTrash}
                          label={t("delete")}
                          onClick={() => removeByDay(index)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {form.frequency === "yearly" && (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="">
                  {t("month")}
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="4"
                    className="mt-2 w-full rounded-md bg-surface px-4 py-2 shadow-sm"
                    value={form.byMonth}
                    onChange={(event) =>
                      updateField("byMonth", event.target.value)
                    }
                  />
                </label>
                <label className="">
                  {t("day")}
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="1"
                    className="mt-2 w-full rounded-md bg-surface px-4 py-2 shadow-sm"
                    value={form.byMonthDay}
                    onChange={(event) =>
                      updateField("byMonthDay", event.target.value)
                    }
                  />
                </label>
              </div>
            )}
          </FormSection>
        )}
        <Button
          variant="primary"
          size="lg"
          icon={status == "saving" ? HiOutlineArrowPath : HiPencilAlt}
          iconSpin={status == "saving"}
          label={
            status == "saving"
              ? t("saveInProgress")
              : mode == "edit"
                ? t("submitUpdate")
                : t("submitCreate")
          }
          type="submit"
          disabled={status == "saving"}
        />
        {status == "error" && (
          <p className="text-[color:color-mix(in oklab,var(--ink) 70%,transparent)]">
            {t("failedInput")}
          </p>
        )}
      </form>
      <ChoiceMessageModal
        open={status == "done"}
        title={mode == "edit" ? t("updated") : t("created")}
        message={
          mode == "edit" ? t("updateMessage") : t("createMessage")
        }
        choices={[{ value: "ok", label: t("ok") }]}
        onSelect={handleDone}
        onClose={handleDone}
      />
    </>
  );
}
