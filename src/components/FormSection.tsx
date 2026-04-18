import type { ReactNode } from "react";

type FormSectionProps = {
  children: ReactNode;
};

/**
 * Renders a shared form section container.
 */
export default function FormSection({ children }: FormSectionProps) {
  return (
    <section className="grid gap-4 rounded-md bg-surface p-6 shadow-sm">
      {children}
    </section>
  );
}
