"use client";

import AccessibleSelect, {
  type SelectOption,
} from "@/components/AccessibleSelect";
import {
  LANGUAGE_PROFILES,
  type LanguageCode,
} from "@/lib/language";
import { useI18n } from "@/lib/i18n";

/**
 * Checks whether a select value is a supported language code.
 */
function isLanguageCode(value: string): value is LanguageCode {
  return LANGUAGE_PROFILES.some((profile) => profile.code === value);
}

/**
 * Renders the language selector using the shared accessible select.
 */
export default function LanguageSelector() {
  const { language, setLanguage, t } = useI18n();
  const languageOptions: SelectOption<LanguageCode>[] = [
    { value: "en", label: "English" },
    { value: "zh", label: "简体中文" },
    { value: "es", label: "Español" },
    { value: "fr", label: "Français" },
    { value: "de", label: "Deutsch" },
    { value: "ja", label: "日本語" },
    { value: "ko", label: "한국어" },
    { value: "zh-Hant", label: "繁體中文" },
  ];

  /**
   * Applies a validated language selection.
   */
  function handleChange(value: string) {
    if (!isLanguageCode(value)) return;
    setLanguage(value);
  }

  return (
    <AccessibleSelect
      label={t("language")}
      labelClassName="sr-only"
      value={language}
      options={languageOptions}
      onChange={handleChange}
      listAlign="right"
      buttonClassName="flex w-max items-center gap-4 rounded-md bg-surface px-3 py-2 shadow-sm whitespace-nowrap"
      listClassName="absolute z-20 max-h-[80vh] w-max max-w-[70vw] overflow-auto rounded-md bg-surface p-1 shadow-md focus:outline-none"
    />
  );
}
