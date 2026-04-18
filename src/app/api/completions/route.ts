import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { Prisma } from "@/generated/prisma/client";
import {
  buildAttachmentPath,
  buildAttachmentStoragePath,
  sanitizeAttachmentFilename,
} from "@/lib/attachments";
import {
  getCompletionHistory,
  normalizeHistoryMonth,
} from "@/lib/history-data";
import {
  PUBLIC_INPUT_LIMITS,
  normalizeMultiLineText,
} from "@/lib/public-input";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Returns completion history for the requested year and month.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const yearParam = Number(searchParams.get("year"));
  const monthParam = Number(searchParams.get("month"));

  if (
    !Number.isInteger(yearParam) ||
    !Number.isInteger(monthParam) ||
    yearParam <= 0 ||
    monthParam < 1 ||
    monthParam > 12
  ) {
    return NextResponse.json({ error: "Invalid year/month" }, { status: 400 });
  }

  const { year, month } = normalizeHistoryMonth(yearParam, monthParam);
  const history = await getCompletionHistory(year, month);
  return NextResponse.json(history);
}

/**
 * Registers a completion for one occurrence and stores optional attachments.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const eventId = String(form.get("eventId") ?? "");
  const occurrenceId = String(form.get("occurrenceId") ?? "");
  const completedAtRaw = String(form.get("completedAt") ?? "");
  const memo = form.get("memo");

  if (!eventId || !occurrenceId) {
    return NextResponse.json(
      { error: "Missing eventId/occurrenceId" },
      { status: 400 },
    );
  }

  const completedAt = completedAtRaw ? new Date(completedAtRaw) : new Date();
  if (Number.isNaN(completedAt.getTime())) {
    return NextResponse.json({ error: "Invalid completedAt" }, { status: 400 });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tags: { orderBy: { position: "asc" }, include: { tag: true } },
      },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    const snapshot = {
      id: event.id,
      title: event.title,
      notes: event.notes,
      jscal: event.jscal,
      deletedAt: event.deletedAt,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      tags: event.tags.map((entry) => ({
        id: entry.tag.id,
        name: entry.tag.name,
        color: entry.color,
      })),
    };
    const completion = await prisma.completion.create({
      data: {
        eventId,
        occurrenceId,
        completedAt,
        memo:
          typeof memo === "string"
            ? normalizeMultiLineText(memo, PUBLIC_INPUT_LIMITS.memo) || null
            : null,
        snapshot,
      },
    });

    const files = form
      .getAll("files")
      .filter((f): f is File => f instanceof File)
      .filter((file) => file.size > 0 && file.name.trim().length > 0)
      .slice(0, PUBLIC_INPUT_LIMITS.attachments);
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

    return NextResponse.json({ completion }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "Already completed" }, { status: 409 });
    }
    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Failed to create completion", detail: error.message },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create completion" },
      { status: 500 },
    );
  }
}
