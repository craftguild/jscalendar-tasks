import { notFound } from "next/navigation";
import EventFormRedirect from "@/components/EventFormRedirect";
import PageLayout from "@/components/PageLayout";
import { fromPrismaJsonValue } from "@/lib/json-value";
import { toJsCalendarObject } from "@/lib/jscal-normalize";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type PageProps = { params: Promise<{ id: string }> };
/**
 * Renders the task edit page for the requested event id.
 */
export default async function EditEventPage({ params }: PageProps) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: { tags: { orderBy: { position: "asc" }, include: { tag: true } } },
  });
  if (!event) notFound();
  const jscal = toJsCalendarObject(fromPrismaJsonValue(event.jscal));
  if (!jscal) notFound();
  return (
    <PageLayout titleKey="pageEditTask">
      <EventFormRedirect
        mode="edit"
        initial={{
          id: event.id,
          jscal,
          tags: event.tags.map((entry) => ({
            name: entry.tag.name,
            color: entry.color,
          })),
        }}
      />
    </PageLayout>
  );
}
