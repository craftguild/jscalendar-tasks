import HistoryClient from "@/components/HistoryClient";
import PageLayout from "@/components/PageLayout";
import {
  getCompletionHistory,
  getHistoryYears,
  normalizeHistoryMonth,
} from "@/lib/history-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    year?: string | string[];
    month?: string | string[];
  }>;
};

/**
 * Returns the first query parameter value when Next.js supplies an array.
 */
function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Renders the SSR completion history page for the selected month.
 */
export default async function HistoryPage({ searchParams }: PageProps) {
  const now = new Date();
  const params = (await searchParams) ?? {};
  const { year, month } = normalizeHistoryMonth(
    Number(firstParam(params.year)),
    Number(firstParam(params.month)),
    now,
  );
  const history = await getCompletionHistory(year, month);

  return (
    <PageLayout titleKey="pageHistory">
      <HistoryClient
        initialYear={history.year}
        initialMonth={history.month}
        years={getHistoryYears(now)}
        initialItems={history.items}
      />
    </PageLayout>
  );
}
