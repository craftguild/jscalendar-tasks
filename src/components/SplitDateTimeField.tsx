"use client";

import { useId, useState } from "react";
import { useI18n } from "@/lib/i18n";

type SplitDateTimeFieldProps = {
  label: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
};

/**
 * Splits a combined local date-time value into date and time fields.
 */
function splitDateTime(value?: string): { date: string; time: string } {
  if (!value) return { date: "", time: "" };
  const [date = "", timeValue = ""] = value.split("T");
  return { date, time: timeValue.slice(0, 5) };
}

/**
 * Renders separate date and time inputs while preserving one combined value.
 */
export default function SplitDateTimeField({
  label,
  name,
  value: valueProp,
  defaultValue,
  onChange,
  required,
}: SplitDateTimeFieldProps) {
  const { t } = useI18n();
  const dateId = useId();
  const timeId = useId();
  const initial = splitDateTime(valueProp ?? defaultValue);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const value = date || time ? `${date}T${time}` : "";

  /**
   * Combines date and time parts and notifies the parent form.
   */
  function updateValue(nextDate: string, nextTime: string) {
    const nextValue = nextDate || nextTime ? `${nextDate}T${nextTime}` : "";
    onChange?.(nextValue);
  }

  return (
    <fieldset>
      <legend>{label}</legend>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label htmlFor={dateId}>
          <span className="sr-only">{t("dateInput")}</span>
          <input
            id={dateId}
            type="date"
            className="w-full rounded-md bg-surface px-4 py-2 shadow-sm focus:outline-none"
            value={date}
            onChange={(event) => {
              const nextDate = event.target.value;
              setDate(nextDate);
              updateValue(nextDate, time);
            }}
            required={required}
          />
        </label>
        <label htmlFor={timeId}>
          <span className="sr-only">{t("timeInput")}</span>
          <input
            id={timeId}
            type="time"
            className="w-full rounded-md bg-surface px-4 py-2 shadow-sm focus:outline-none"
            value={time}
            onChange={(event) => {
              const nextTime = event.target.value;
              setTime(nextTime);
              updateValue(date, nextTime);
            }}
            required={required}
          />
        </label>
      </div>
    </fieldset>
  );
}
