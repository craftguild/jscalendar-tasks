import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { AppJsonObject, AppJsonValue } from "@/lib/json-value";
import { isAppJsonObject } from "@/lib/json-value";

export const runtime = "nodejs";

type TagInput = {
  name: string;
  color: string;
};
type EventRequestBody = {
  title?: AppJsonValue;
  description?: AppJsonValue;
  jscal?: AppJsonValue;
  tags?: AppJsonValue;
};

/**
 * Narrows an app JSON value to a plain JSON object.
 */
function isJsonObject(value: AppJsonValue): value is AppJsonObject {
  return isAppJsonObject(value);
}

/**
 * Validates a tag payload received from the event form.
 */
function isTagInput(tag: AppJsonValue): tag is TagInput {
  if (!isJsonObject(tag)) return false;
  return (
    typeof tag.name === "string" &&
    typeof tag.color === "string" &&
    tag.name.trim().length > 0 &&
    tag.color.trim().length > 0
  );
}

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
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const jscal = body.jscal;
  const tags: TagInput[] = Array.isArray(body.tags)
    ? body.tags.filter(isTagInput)
    : [];

  if (!title || !jscal || !isJsonObject(jscal)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

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
      jscal,
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
