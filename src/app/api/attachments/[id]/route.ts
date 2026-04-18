import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { resolveAttachmentPath } from "@/lib/attachments";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Builds a Content-Disposition header that supports Unicode filenames.
 */
function buildContentDisposition(filename: string): string {
  const fallback = filename
    .replace(/[/\\?%*:|"<>]/g, "_")
    .replace(/[^\x20-\x7E]+/g, "_")
    .trim();
  const safeFallback = fallback || "attachment";
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${safeFallback}"; filename*=UTF-8''${encoded}`;
}

/**
 * Returns the binary data for a stored completion attachment.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const path = await resolveAttachmentPath(attachment);
  const data = await readFile(path);
  return new NextResponse(data, {
    headers: {
      "Content-Type": attachment.contentType ?? "application/octet-stream",
      "Content-Disposition": buildContentDisposition(attachment.filename),
    },
  });
}
