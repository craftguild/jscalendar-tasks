import { access } from "node:fs/promises";
import { constants } from "node:fs";

type AttachmentLike = {
  completionId: string;
  filename: string;
  path: string;
};

/**
 * Normalizes an uploaded filename so it can be stored below an attachment directory.
 */
export function sanitizeAttachmentFilename(name: string): string {
  const sanitized = name
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[\\/]+/g, "_")
    .replace(/["<>|?%*:]+/g, "_")
    .replace(/\s+/g, "_")
    .trim()
    .slice(0, 120);
  return sanitized || "attachment";
}

/**
 * Joins path segments for app-managed attachment paths.
 */
function joinAttachmentPath(...parts: string[]): string {
  return parts
    .map((part, index) => (index === 0 ? part.replace(/\/+$/g, "") : part.replace(/^\/+|\/+$/g, "")))
    .filter(Boolean)
    .join("/");
}

/**
 * Returns the configured root directory used for stored completion attachments.
 */
export function getAttachmentsRoot(): string {
  if (process.env.ATTACHMENTS_DIR) return process.env.ATTACHMENTS_DIR;
  return "data/attachments";
}

/**
 * Builds the absolute storage path for a completion attachment file.
 */
export function buildAttachmentPath(completionId: string, filename: string): string {
  return joinAttachmentPath(getAttachmentsRoot(), completionId, filename);
}

/**
 * Builds the storage path persisted in the database for an attachment file.
 */
export function buildAttachmentStoragePath(completionId: string, filename: string): string {
  return buildAttachmentPath(completionId, filename);
}

/**
 * Resolves an attachment path, supporting both current and legacy persisted paths.
 */
export async function resolveAttachmentPath(attachment: AttachmentLike): Promise<string> {
  if (attachment.path) {
    const currentPath = attachment.path;
    if (await pathExists(currentPath)) {
      return currentPath;
    }
  }

  return buildAttachmentPath(attachment.completionId, attachment.filename);
}

/**
 * Checks whether a filesystem path exists.
 */
async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
