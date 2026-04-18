import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { AppJsonValue } from "@/lib/json-value";
import {
  PUBLIC_INPUT_LIMITS,
  normalizeMultiLineText,
  normalizeSingleLineText,
  normalizeSubmittedJsCalendar,
  normalizeTagInputs,
} from "@/lib/public-input";

export const runtime = "nodejs";

type EventRequestBody = {
  title?: AppJsonValue;
  description?: AppJsonValue;
  jscal?: AppJsonValue;
  tags?: AppJsonValue;
};

/**
 * Returns one event/task record with its tags.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: { tags: { orderBy: { position: "asc" }, include: { tag: true } } },
  });
  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const item = {
    ...event,
    tags: event.tags.map((entry) => ({
      id: entry.tag.id,
      name: entry.tag.name,
      color: entry.color,
    })),
  };
  return NextResponse.json({ event: item });
}

/**
 * Updates an existing event/task record and replaces its tag links.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body: EventRequestBody = await request.json();
  const title = normalizeSingleLineText(body.title, PUBLIC_INPUT_LIMITS.title);
  const description = normalizeMultiLineText(
    body.description,
    PUBLIC_INPUT_LIMITS.description,
  );
  const jscal = body.jscal;
  const tags = normalizeTagInputs(body.tags ?? null);
  const normalizedJsCal = jscal
    ? normalizeSubmittedJsCalendar(jscal, title, description)
    : null;

  if (!title || !normalizedJsCal) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const normalizedJson = normalizedJsCal as unknown as Prisma.InputJsonValue;

  const tagRecords = await Promise.all(
    tags.map((tag) =>
      prisma.tag.upsert({
        where: { name: tag.name },
        update: { color: tag.color },
        create: { name: tag.name, color: tag.color },
      }),
    ),
  );
  const event = await prisma.event.update({
    where: { id },
    data: {
      title,
      notes: null,
      jscal: normalizedJson,
      tags: {
        deleteMany: {},
        create: tagRecords.map((tag, index) => ({
          tag: { connect: { id: tag.id } },
          color: tags[index]?.color ?? tag.color,
          position: index,
        })),
      },
    },
    include: { tags: { orderBy: { position: "asc" }, include: { tag: true } } },
  });
  const item = {
    ...event,
    tags: event.tags.map((entry) => ({
      id: entry.tag.id,
      name: entry.tag.name,
      color: entry.color,
    })),
  };
  return NextResponse.json({ event: item });
}

/**
 * Deletes an event hard when possible, otherwise soft-deletes completed records.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const completionCount = await prisma.completion.count({
    where: { eventId: id },
  });
  if (completionCount > 0) {
    await prisma.event.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ ok: true, deleted: "soft" });
  }
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ ok: true, deleted: "hard" });
}
