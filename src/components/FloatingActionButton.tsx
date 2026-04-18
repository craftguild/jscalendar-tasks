import type { ComponentType, ReactNode } from "react";
import Button from "@/components/Button";

type FloatingActionButtonProps = {
  href: string;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label?: ReactNode;
  "aria-label"?: string;
};

/**
 * Renders the shared circular floating action button.
 */
export default function FloatingActionButton(props: FloatingActionButtonProps) {
  return <Button {...props} variant="primary" size="floating" />;
}
