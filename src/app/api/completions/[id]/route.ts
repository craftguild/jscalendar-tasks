import { NextResponse } from "next/server";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  buildAttachmentPath,
  buildAttachmentStoragePath,
  resolveAttachmentPath,
  sanitizeAttachmentFilename,
} from "@/lib/attachments";
import {
  PUBLIC_INPUT_LIMITS,
  normalizeMultiLineText,
} from "@/lib/public-input";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Updates completion memo and attachment changes for one completion record.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const completion = await prisma.completion.findUnique({
    where: { id },
    include: { attachments: true },
  });
  if (!completion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const form = await request.formData();
  const memoRaw = form.has("memo") ? String(form.get("memo") ?? "") : null;
  const memo =
    memoRaw !== null
      ? normalizeMultiLineText(memoRaw, PUBLIC_INPUT_LIMITS.memo) || null
      : null;
  const removeIds = form
    .getAll("removeAttachmentIds")
    .map((value) => String(value))
    .filter((value) => value);
  const files = form
    .getAll("files")
    .filter((f): f is File => f instanceof File)
    .filter((file) => file.size > 0 && file.name.trim().length > 0)
    .slice(0, PUBLIC_INPUT_LIMITS.attachments);

  if (removeIds.length > 0) {
    const attachments = await prisma.attachment.findMany({
      where: { id: { in: removeIds }, completionId: completion.id },
    });
    for (const attachment of attachments) {
      try {
        const path = await resolveAttachmentPath(attachment);
        await unlink(path);
      } catch {
        // Ignore missing files.
      }
    }
    if (attachments.length > 0) {
      await prisma.attachment.deleteMany({
        where: { id: { in: attachments.map((attachment) => attachment.id) } },
      });
    }
  }

  if (files.length > 0) {
    for (const file of files) {
      if (file.size > PUBLIC_INPUT_LIMITS.attachmentBytes) {
        return NextResponse.json({ error: "Attachment too large" }, { status: 413 });
      }
      const safeName = sanitizeAttachmentFilename(file.name || "attachment");
      const filePath = buildAttachmentPath(completion.id, safeName);
      const storedPath = buildAttachmentStoragePath(completion.id, safeName);
      await mkdir(dirname(filePath), { recursive: true });
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);
      await prisma.attachment.create({
        data: {
          completionId: completion.id,
          filename: safeName,
          path: storedPath,
          contentType: file.type || null,
          size: buffer.length,
        },
      });
    }
  }

  const updated = await prisma.completion.update({
    where: { id: completion.id },
    data: memoRaw !== null ? { memo } : {},
    include: { attachments: true },
  });

  return NextResponse.json({ completion: updated });
}
