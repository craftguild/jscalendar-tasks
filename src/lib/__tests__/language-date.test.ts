import { describe, expect, it } from "vitest";
import { formatLocalizedDateTimeValue } from "@/lib/date-format";
import {
  APP_FONT_FAMILY,
  DEFAULT_LANGUAGE,
  FALLBACK_LANGUAGE,
  getLanguageLocale,
  getLanguageProfile,
} from "@/lib/language";
import type { LanguageCode } from "@/lib/language";

describe("locale and date formatting", () => {
  it("uses English as the default and fallback language", () => {
    expect(DEFAULT_LANGUAGE).toBe("en");
    expect(FALLBACK_LANGUAGE).toBe("en");
    expect(getLanguageProfile("unknown")).toMatchObject({
      code: "en",
      htmlLang: "en",
      fontFamily: APP_FONT_FAMILY,
    });
    expect(getLanguageLocale("unknown" as LanguageCode)).toBe("en-US");
  });

  it("keeps language profiles on the shared multilingual font stack", () => {
    expect(getLanguageProfile("ja").fontFamily).toBe(APP_FONT_FAMILY);
    expect(getLanguageProfile("zh-Hant").fontFamily).toBe(APP_FONT_FAMILY);
    expect(getLanguageProfile("de").fontFamily).toBe(APP_FONT_FAMILY);
  });

  it("formats JSCalendar local date-time values with locale-specific ordering", () => {
    const value = "2026-04-18T09:30:00";

    const ja = formatLocalizedDateTimeValue(value, "ja-JP", "Asia/Tokyo");
    const en = formatLocalizedDateTimeValue(value, "en-US", "Asia/Tokyo");

    expect(ja).toContain("2026");
    expect(ja).toContain("4月");
    expect(en).toContain("2026");
    expect(en).toMatch(/Apr|April/);
  });

  it("formats empty date-time values as a stable placeholder", () => {
    expect(formatLocalizedDateTimeValue("", "en-US")).toBe("-");
  });
});
