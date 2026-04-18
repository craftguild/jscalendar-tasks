"use client";

import { useEffect, useId, type ReactNode } from "react";
import { HiOutlineXMark } from "react-icons/hi2";
import Button from "@/components/Button";
import { useI18n } from "@/lib/i18n";

type ModalProps = {
  open: boolean;
  title?: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  closeLabel?: string;
  showCloseButton?: boolean;
  size?: "md" | "lg";
};

/**
 * Renders the shared modal shell with backdrop, escape handling, and scroll lock.
 */
export default function Modal({
  open,
  title,
  eyebrow,
  children,
  footer,
  onClose,
  closeLabel,
  showCloseButton = true,
  size = "md",
}: ModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const resolvedCloseLabel = closeLabel ?? t("close");

  useEffect(() => {
    if (!open || !onClose) return;
    const handleClose = onClose;
    /**
     * Closes the modal when Escape is pressed.
     */
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center overscroll-none px-6 py-10"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={`modal-panel max-h-[calc(100vh-5rem)] w-full overflow-y-auto overscroll-contain rounded-md bg-surface p-6 shadow-md ${
          size === "lg" ? "max-w-6xl" : "max-w-lg"
        }`}
      >
        {(title || eyebrow || (showCloseButton && onClose)) && (
          <div className="flex items-start justify-between gap-4">
            <div>
              {eyebrow ? (
                <p className="text-[color:color-mix(in oklab,var(--ink) 55%,transparent)]">
                  {eyebrow}
                </p>
              ) : null}
              {title ? (
                <h3 id={titleId} className="font-semibold">
                  {title}
                </h3>
              ) : null}
            </div>
            {showCloseButton && onClose ? (
              <Button
                type="button"
                variant="surface"
                size="sm"
                icon={HiOutlineXMark}
                label={resolvedCloseLabel}
                onClick={onClose}
              />
            ) : null}
          </div>
        )}
        <div className={title || eyebrow || onClose ? "mt-4" : ""}>
          {children}
        </div>
        {footer ? <div className="mt-4">{footer}</div> : null}
      </div>
    </div>
  );
}
