import { prisma } from "@/lib/prisma";
import type { AppJsonObject, AppJsonValue } from "@/lib/json-value";
import { isAppJsonObject } from "@/lib/json-value";
import { NextResponse } from "next/server";

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
 * Lists active events with their display tags.
 */
export async function GET() {
  const events = await prisma.event.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { tags: { orderBy: { position: "asc" }, include: { tag: true } } },
  });
  const items = events.map((event) => ({
    ...event,
    tags: event.tags.map((entry) => ({
      id: entry.tag.id,
      name: entry.tag.name,
      color: entry.color,
    })),
  }));
  return NextResponse.json({ events: items });
}

/**
 * Creates a new event/task record from a JSCalendar payload.
 */
export async function POST(request: Request) {
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
  const event = await prisma.event.create({
    data: {
      title,
      notes: null,
      jscal,
      tags: {
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
  return NextResponse.json({ event: item }, { status: 201 });
}
