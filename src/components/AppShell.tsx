"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { HiBars3, HiOutlineXMark } from "react-icons/hi2";
import Button from "@/components/Button";
import LanguageSelector from "@/components/LanguageSelector";
import { I18nProvider, useI18n } from "@/lib/i18n";

/**
 * Renders the fixed application header and navigation.
 */
function AppHeader() {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = [
    { href: "/tasks", label: t("navTasks") },
    { href: "/history", label: t("navHistory") },
    { href: "/api/ical", label: t("navIcal") },
  ];

  return (
    <header className="fixed left-0 right-0 top-4 z-50 flex justify-center px-4">
      <div className="flex w-full max-w-6xl items-center justify-between gap-4 rounded-md bg-[color:color-mix(in oklab,var(--surface) 80%,transparent)] px-6 py-4 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          <Link className="font-semibold text-lg" href="/">
            {t("appTitle")}
          </Link>
        </div>
        <nav className="hidden items-center gap-2 font-medium md:flex">
          {navItems.map((item) => (
            <Button
              key={item.href}
              href={item.href}
              variant="surface"
              size="md"
              label={item.label}
            />
          ))}
          <LanguageSelector />
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSelector />
          <Button
            type="button"
            variant="surface"
            size="squareMd"
            icon={HiBars3}
            aria-label="Menu"
            onClick={() => setMenuOpen(true)}
          />
        </div>
      </div>
      {menuOpen ? (
        <div
          className="modal-backdrop fixed inset-0 z-[60]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMenuOpen(false);
          }}
        >
          <div className="mobile-menu-panel flex justify-center px-4 pt-4">
            <div className="w-full max-w-6xl rounded-md bg-surface shadow-md">
              <div className="flex justify-end px-6 py-4">
                <Button
                  type="button"
                  variant="surface"
                  size="squareMd"
                  icon={HiOutlineXMark}
                  aria-label={t("close")}
                  onClick={() => setMenuOpen(false)}
                />
              </div>
              <nav className="grid gap-2 px-6 pb-6">
                {navItems.map((item) => (
                  <Button
                    key={item.href}
                    href={item.href}
                    variant="surface"
                    size="lg"
                    fullWidth
                    label={item.label}
                    onClick={() => setMenuOpen(false)}
                  />
                ))}
              </nav>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

/**
 * Wraps pages with i18n state, header, and shared page chrome.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <AppHeader />
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pb-16 pt-28">
        <main className="flex-1">{children}</main>
      </div>
    </I18nProvider>
  );
}
