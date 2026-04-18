"use client";

import Button from "@/components/Button";
import Modal from "@/components/Modal";
import MessageModalLayout from "@/components/MessageModalLayout";
import { useI18n } from "@/lib/i18n";

type MessageModalProps = {
  open: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  closeLabel?: string;
};

/**
 * Renders a simple message modal with one close action.
 */
export default function MessageModal({
  open,
  title,
  message,
  onClose,
  closeLabel,
}: MessageModalProps) {
  const { t } = useI18n();
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
        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          label={closeLabel ?? t("close")}
          onClick={onClose}
        />
      }
      />
    </Modal>
  );
}
