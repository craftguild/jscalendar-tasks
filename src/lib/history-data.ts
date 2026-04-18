import type { AppJsonValue } from "@/lib/json-value";
import { fromPrismaJsonValue } from "@/lib/json-value";
import { prisma } from "@/lib/prisma";

export type CompletionHistoryItem = {
  id: string;
  occurrenceId: string;
  completedAt: string;
  memo: string | null;
  event: { title: string };
  snapshot: AppJsonValue;
  attachments: { id: string; filename: string }[];
};

export type CompletionHistoryResponse = {
  year: number;
  month: number;
  items: CompletionHistoryItem[];
};

/**
 * Builds the selectable year range for completion history filters.
 */
export function getHistoryYears(now = new Date()): number[] {
  return Array.from({ length: 6 }, (_, index) => now.getFullYear() - 3 + index);
}

/**
 * Validates history filter values and falls back to the current year/month.
 */
export function normalizeHistoryMonth(
  yearValue: number,
  monthValue: number,
  now = new Date(),
): { year: number; month: number } {
  const year =
    Number.isInteger(yearValue) && yearValue > 0
      ? yearValue
      : now.getFullYear();
  const month =
    Number.isInteger(monthValue) && monthValue >= 1 && monthValue <= 12
      ? monthValue
      : now.getMonth() + 1;
  return { year, month };
}

/**
 * Loads completion history records for a single calendar month.
 */
export async function getCompletionHistory(
  year: number,
  month: number,
): Promise<CompletionHistoryResponse> {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const completions = await prisma.completion.findMany({
    where: { completedAt: { gte: start, lt: end } },
    orderBy: { completedAt: "desc" },
    include: { event: true, attachments: true },
  });

  return {
    year,
    month,
    items: completions.map((completion) => ({
      id: completion.id,
      occurrenceId: completion.occurrenceId,
      completedAt: completion.completedAt.toISOString(),
      memo: completion.memo,
      event: { title: completion.event.title },
      snapshot: fromPrismaJsonValue(completion.snapshot),
      attachments: completion.attachments.map((attachment) => ({
        id: attachment.id,
        filename: attachment.filename,
      })),
    })),
  };
}
