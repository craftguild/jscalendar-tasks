import OccurrenceFeed from "@/components/OccurrenceFeed";
import { getOccurrences, getOverdueOccurrences } from "@/lib/occurrences-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RANGE_DAYS = 60;

/**
 * Renders the SSR initial upcoming task page.
 */
export default async function Home() {
  const now = new Date();
  const rangeTo = new Date(now.getTime() + RANGE_DAYS * 86400 * 1000);
  const [initialResult, initialOverdueItems] = await Promise.all([
    getOccurrences({ from: now, to: rangeTo, limit: 24, offset: 0, now }),
    getOverdueOccurrences(now),
  ]);

  return (
    <OccurrenceFeed
      initialResult={initialResult}
      initialOverdueItems={initialOverdueItems}
    />
  );
}
