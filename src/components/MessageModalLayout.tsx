import type { ReactNode } from "react";

type MessageModalLayoutProps = {
  message: string;
  actions: ReactNode;
};

/**
 * Provides shared spacing for message modals and their action area.
 */
export default function MessageModalLayout({
  message,
  actions,
}: MessageModalLayoutProps) {
  return (
    <div className="grid gap-4">
      <p className="text-[color:color-mix(in oklab,var(--ink) 70%,transparent)]">
        {message}
      </p>
      <div className="mt-1">{actions}</div>
    </div>
  );
}
