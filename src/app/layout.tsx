import type { Metadata } from "next";
import type { CSSProperties } from "react";
import {
  Noto_Sans,
  Noto_Sans_JP,
  Noto_Sans_KR,
  Noto_Sans_SC,
  Noto_Sans_TC,
} from "next/font/google";
import AppShell from "@/components/AppShell";
import { DEFAULT_LANGUAGE, getLanguageProfile } from "@/lib/language";
import "./globals.css";

export const metadata: Metadata = {
  title: "Task Manager",
  description: "Task Manager",
};

const notoSans = Noto_Sans({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sans",
});

const notoSansJapanese = Noto_Sans_JP({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sans-japanese",
});

const notoSansChinese = Noto_Sans_SC({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sans-sc",
});

const notoSansTraditionalChinese = Noto_Sans_TC({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sans-tc",
});

const notoSansKorean = Noto_Sans_KR({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sans-kr",
});

/**
 * Renders the root HTML shell with the default language and font variables.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const language = getLanguageProfile(DEFAULT_LANGUAGE);

  const htmlStyle = {
    "--app-font-family": language.fontFamily,
  } as CSSProperties;

  return (
    <html
      lang={language.htmlLang}
      data-language={language.code}
      style={htmlStyle}
    >
      <body
        className={`${notoSans.variable} ${notoSansJapanese.variable} ${notoSansChinese.variable} ${notoSansTraditionalChinese.variable} ${notoSansKorean.variable} min-h-screen antialiased bg-gray-50 text-sm`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
