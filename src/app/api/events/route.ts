import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { AppJsonValue } from "@/lib/json-value";
import {
  PUBLIC_INPUT_LIMITS,
  normalizeMultiLineText,
  normalizeSingleLineText,
  normalizeSubmittedJsCalendar,
  normalizeTagInputs,
} from "@/lib/public-input";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type EventRequestBody = {
  title?: AppJsonValue;
  description?: AppJsonValue;
  jscal?: AppJsonValue;
  tags?: AppJsonValue;
};

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
  const event = await prisma.event.create({
    data: {
      title,
      notes: null,
      jscal: normalizedJson,
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
