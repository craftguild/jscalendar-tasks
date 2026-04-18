"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HiOutlinePaperClip,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from "react-icons/hi2";
import { HiPencilAlt } from "react-icons/hi";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import { useI18n } from "@/lib/i18n";
type Attachment = { id: string; filename: string };
type CompletionEditButtonProps = {
  completionId: string;
  title: string;
  memo: string | null;
  attachments: Attachment[];
  onUpdated?: () => void | Promise<void>;
};
/**
 * Renders the completion edit modal trigger and form.
 */
export default function CompletionEditButton({
  completionId,
  title,
  memo,
  attachments,
  onUpdated,
}: CompletionEditButtonProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editMemo, setEditMemo] = useState(memo ?? "");
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  /**
   * Closes the edit modal and clears transient edit state.
   */
  function close() {
    setOpen(false);
    setEditFiles([]);
    setRemovedIds(new Set());
    setError("");
  }
  /**
   * Stores selected replacement or additional attachment files.
   */
  function handleFiles(files: FileList | File[]) {
    setEditFiles(Array.from(files).filter((file) => file.size > 0));
  }
  /**
   * Submits memo and attachment edits for a completion.
   */
  async function submitEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData();
    data.append("memo", editMemo);
    for (const id of removedIds) {
      data.append("removeAttachmentIds", id);
    }
    for (const file of editFiles) {
      data.append("files", file);
    }
    const res = await fetch(`/api/completions/${completionId}`, {
      method: "PATCH",
      body: data,
    });
    if (res.ok) {
      close();
      if (onUpdated) {
        await onUpdated();
        return;
      }
      router.refresh();
      return;
    }
    const detail = await res.text();
    setError(
      detail
        ? `${t("failedInput")} (${res.status} ${res.statusText}): ${detail}`
        : `${t("failedInput")} (${res.status} ${res.statusText})`,
    );
  }
  return (
    <>
      <Button
        type="button"
        variant="surface"
        size="md"
        icon={HiOutlinePencilSquare}
        label={t("edit")}
        onClick={() => setOpen(true)}
      />
      <Modal open={open} eyebrow={t("editCompletion")} title={title} onClose={close}>
        <form className="space-y-4" onSubmit={submitEdit}>
          <label className="block ">
            {t("memo")}
            <textarea
              rows={3}
              className="mt-2 w-full rounded-md bg-surface px-4 py-2 shadow-sm"
              value={editMemo}
              onChange={(event) => setEditMemo(event.target.value)}
              placeholder={t("memoPlaceholder")}
            />
          </label>
          <div className="space-y-2 ">
            <p>{t("attachments")}</p>
            {attachments.filter((file) => !removedIds.has(file.id)).length >
            0 ? (
              <div className="flex flex-wrap gap-2">
                {attachments
                  .filter((file) => !removedIds.has(file.id))
                  .map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-2 rounded-md bg-surface px-3 py-1 shadow-sm"
                    >
                      <a href={`/api/attachments/${file.id}`}>
                        {file.filename}
                      </a>
                      <Button
                        type="button"
                        variant="accentSoft"
                        size="sm"
                        icon={HiOutlineTrash}
                        label={t("delete")}
                        onClick={() =>
                          setRemovedIds((prev) => new Set(prev).add(file.id))
                        }
                      />
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-[color:color-mix(in oklab,var(--ink) 55%,transparent)]">
                {t("noExistingAttachments")}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="surface"
                size="sm"
                icon={HiOutlinePaperClip}
                label={t("chooseAdditionalFile")}
                onClick={() => fileInputRef.current?.click()}
              />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                  if (!event.currentTarget.files) return;
                  handleFiles(event.currentTarget.files);
                }}
              />
              {editFiles.length > 0 ? (
                <span className="text-[color:color-mix(in oklab,var(--ink) 60%,transparent)]">
                  {t("addCount", { count: editFiles.length })}
                </span>
              ) : null}
            </div>
            {editFiles.length > 0 ? (
              <ul className="space-y-1 ">
                {editFiles.map((file) => (
                  <li
                    key={`${file.name}-${file.lastModified}`}
                    className="truncate"
                  >
                    {file.name}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {error ? (
            <div className="rounded-md bg-surface p-3 text-red-600 shadow-sm">
              {error}
            </div>
          ) : null}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            icon={HiPencilAlt}
            label={t("update")}
            type="submit"
          />
        </form>
      </Modal>
    </>
  );
}
