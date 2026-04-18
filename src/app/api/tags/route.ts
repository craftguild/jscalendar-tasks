import { prisma } from "@/lib/prisma";
import {
  PUBLIC_INPUT_LIMITS,
  isAllowedTagColor,
  normalizeSingleLineText,
} from "@/lib/public-input";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Lists all tags sorted by name.
 */
export async function GET() {
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ tags });
}

/**
 * Creates or updates a tag by name.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const name = normalizeSingleLineText(body.name, PUBLIC_INPUT_LIMITS.tagName);
  const color = typeof body.color === "string" ? body.color.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  if (!color || !isAllowedTagColor(color)) {
    return NextResponse.json({ error: "Invalid color" }, { status: 400 });
  }
  const tag = await prisma.tag.upsert({
    where: { name },
    update: { color },
    create: { name, color },
  });
  return NextResponse.json({ tag }, { status: 201 });
}
