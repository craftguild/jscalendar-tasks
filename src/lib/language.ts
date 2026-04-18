export type LanguageCode = "en" | "ja" | "zh" | "zh-Hant" | "ko" | "fr" | "de" | "es";

export type LanguageProfile = {
  code: LanguageCode;
  htmlLang: string;
  fontFamily: string;
};

export const DEFAULT_LANGUAGE: LanguageCode = "en";
export const FALLBACK_LANGUAGE: LanguageCode = "en";
export const APP_FONT_FAMILY =
  'var(--font-noto-sans), var(--font-noto-sans-japanese), var(--font-noto-sans-sc), var(--font-noto-sans-kr), "Noto Sans", "Noto Sans JP", "Noto Sans SC", "Noto Sans KR", sans-serif';

export const LANGUAGE_PROFILES: LanguageProfile[] = [
  {
    code: "en",
    htmlLang: "en",
    fontFamily: APP_FONT_FAMILY,
  },
  {
    code: "ja",
    htmlLang: "ja",
    fontFamily: APP_FONT_FAMILY,
  },
  {
    code: "zh",
    htmlLang: "zh",
    fontFamily: APP_FONT_FAMILY,
  },
  {
    code: "zh-Hant",
    htmlLang: "zh-Hant",
    fontFamily: APP_FONT_FAMILY,
  },
  {
    code: "ko",
    htmlLang: "ko",
    fontFamily: APP_FONT_FAMILY,
  },
  {
    code: "fr",
    htmlLang: "fr",
    fontFamily: APP_FONT_FAMILY,
  },
  {
    code: "de",
    htmlLang: "de",
    fontFamily: APP_FONT_FAMILY,
  },
  {
    code: "es",
    htmlLang: "es",
    fontFamily: APP_FONT_FAMILY,
  },
];

export const LANGUAGE_LOCALES: Record<LanguageCode, string> = {
  en: "en-US",
  ja: "ja-JP",
  zh: "zh-CN",
  "zh-Hant": "zh-TW",
  ko: "ko-KR",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
};

/**
 * Returns the Intl locale string for a supported UI language.
 */
export function getLanguageLocale(code: LanguageCode): string {
  return LANGUAGE_LOCALES[code] ?? LANGUAGE_LOCALES[FALLBACK_LANGUAGE];
}

/**
 * Resolves a language profile, falling back to the configured fallback language.
 */
export function getLanguageProfile(code: string | null | undefined): LanguageProfile {
  return (
    LANGUAGE_PROFILES.find((profile) => profile.code === code) ??
    LANGUAGE_PROFILES.find((profile) => profile.code === FALLBACK_LANGUAGE) ??
    LANGUAGE_PROFILES[0]
  );
}
