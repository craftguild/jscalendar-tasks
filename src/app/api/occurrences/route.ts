import { NextResponse } from "next/server";
import { getOccurrences } from "@/lib/occurrences-data";

export const runtime = "nodejs";

/**
 * Returns a paged occurrence expansion for the supplied date range.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const limit = Math.min(Number(searchParams.get("limit") ?? 24), 200);
  const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);

  const now = new Date();
  const from = fromParam ? new Date(fromParam) : now;
  const to = toParam
    ? new Date(toParam)
    : new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  return NextResponse.json(
    await getOccurrences({ from, to, limit, offset, now }),
  );
}
