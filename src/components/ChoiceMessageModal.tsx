"use client";

import Button from "@/components/Button";
import Modal from "@/components/Modal";
import MessageModalLayout from "@/components/MessageModalLayout";

export type MessageModalChoice<T extends string = string> = {
  value: T;
  label: string;
  variant?: "primary" | "normal" | "danger";
};

type ChoiceMessageModalProps<T extends string = string> = {
  open: boolean;
  title?: string;
  message: string;
  choices: MessageModalChoice<T>[];
  onSelect: (value: T) => void;
  onClose: () => void;
  closeLabel?: string;
};

/**
 * Renders a message modal with caller-defined action choices.
 */
export default function ChoiceMessageModal<T extends string = string>({
  open,
  title,
  message,
  choices,
  onSelect,
  onClose,
  closeLabel,
}: ChoiceMessageModalProps<T>) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      closeLabel={closeLabel}
      showCloseButton={false}
    >
      <MessageModalLayout
        message={message}
        actions={
          choices.length > 0 ? (
          <div className="grid gap-2">
            {choices.map((choice) => (
              <Button
                key={choice.value}
                type="button"
                variant={
                  choice.variant === "danger"
                    ? "danger"
                    : choice.variant === "normal"
                      ? "surface"
                      : "primary"
                }
                size="lg"
                fullWidth
                label={choice.label}
                onClick={() => onSelect(choice.value)}
              />
            ))}
          </div>
          ) : null
        }
      />
    </Modal>
  );
}
