"use client";

import type { ReactNode } from "react";
import { useI18n, type MessageKey } from "@/lib/i18n";

type PageLayoutProps = {
  title?: string;
  titleKey?: MessageKey;
  actions?: ReactNode;
  children: ReactNode;
};

/**
 * Renders shared page title, actions, and content spacing.
 */
export default function PageLayout({
  title,
  titleKey,
  actions,
  children,
}: PageLayoutProps) {
  const { t } = useI18n();
  const resolvedTitle = titleKey ? t(titleKey) : title;

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-semibold text-base uppercase">{resolvedTitle}</h1>
        {actions ? (
          <div className="flex items-center gap-2">{actions}</div>
        ) : null}
      </div>
      <div className="grid gap-6">{children}</div>
    </div>
  );
}
