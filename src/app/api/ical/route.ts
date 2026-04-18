import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { JsCal } from "@craftguild/jscalendar";
import type { JSCalendarObject } from "@craftguild/jscalendar";
import { fromPrismaJsonValue } from "@/lib/json-value";
import { toJsCalendarObject } from "@/lib/jscal-normalize";

export const runtime = "nodejs";

/**
 * Exports active JSCalendar events as an iCalendar feed.
 */
export async function GET() {
  const events = await prisma.event.findMany({ where: { deletedAt: null } });
  const objects = events
    .map((event) => toJsCalendarObject(fromPrismaJsonValue(event.jscal)))
    .filter((value): value is JSCalendarObject => value !== null);
  const ical = JsCal.toICal(objects, {
    includeXJSCalendar: true,
    prodId: "-//jscalendar-tasks//EN",
  });
  return new NextResponse(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
    },
  });
}
