"use client";
import { useMemo } from "react";
import AccessibleSelect, {
  type SelectOption,
} from "@/components/AccessibleSelect";
import { useI18n } from "@/lib/i18n";
import { getLanguageLocale } from "@/lib/language";
type HistoryMonthSelectorProps = {
  year: number;
  month: number;
  years: number[];
  onChange: (year: number, month: number) => void;
};
/**
 * Renders localized year/month controls for the history filter.
 */
export default function HistoryMonthSelector({
  year,
  month,
  years,
  onChange,
}: HistoryMonthSelectorProps) {
  const { language, t } = useI18n();
  const locale = getLanguageLocale(language);
  const usesSuffixLabels =
    language === "ja" ||
    language === "zh" ||
    language === "zh-Hant" ||
    language === "ko";
  const yearOptions = useMemo<SelectOption<number>[]>(
    () => years.map((value) => ({ value, label: `${value}` })),
    [years],
  );
  const monthOptions = useMemo<SelectOption<number>[]>(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        value: index + 1,
        label: usesSuffixLabels
          ? `${index + 1}`
          : new Date(2000, index, 1).toLocaleDateString(locale, {
              month: "long",
            }),
      })),
    [locale, usesSuffixLabels],
  );
  /**
   * Emits the selected history filter values to the parent client island.
   */
  function navigate(nextYear: number, nextMonth: number) {
    onChange(nextYear, nextMonth);
  }
  return (
    <section className="flex flex-wrap items-center gap-6">
      {usesSuffixLabels ? (
        <>
          <div className="flex items-center gap-2">
            <AccessibleSelect
              label={t("selectYear")}
              labelClassName="sr-only"
              value={year}
              options={yearOptions}
              onChange={(value) => navigate(value, month)}
              buttonClassName="flex w-max items-center gap-4 rounded-md bg-surface px-3 py-2 shadow-sm whitespace-nowrap"
            />
            <span>{t("selectYear")}</span>
          </div>
          <div className="flex items-center gap-2">
            <AccessibleSelect
              label={t("selectMonth")}
              labelClassName="sr-only"
              value={month}
              options={monthOptions}
              onChange={(value) => navigate(year, value)}
              buttonClassName="flex w-max items-center gap-4 rounded-md bg-surface px-3 py-2 shadow-sm whitespace-nowrap"
            />
            <span>{t("selectMonth")}</span>
          </div>
        </>
      ) : (
        <>
          <AccessibleSelect
            label={t("selectMonth")}
            value={month}
            options={monthOptions}
            onChange={(value) => navigate(year, value)}
            buttonClassName="flex w-max items-center gap-4 rounded-md bg-surface px-3 py-2 shadow-sm whitespace-nowrap"
          />
          <AccessibleSelect
            label={t("selectYear")}
            value={year}
            options={yearOptions}
            onChange={(value) => navigate(value, month)}
            buttonClassName="flex w-max items-center gap-4 rounded-md bg-surface px-3 py-2 shadow-sm whitespace-nowrap"
          />
        </>
      )}
    </section>
  );
}
