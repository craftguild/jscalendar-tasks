import TasksClient from "@/components/TasksClient";
import { fromPrismaJsonValue } from "@/lib/json-value";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Renders the SSR task list page with initial event data.
 */
export default async function TasksPage() {
  const events = await prisma.event.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { tags: { orderBy: { position: "asc" }, include: { tag: true } } },
  });

  return (
    <TasksClient
      initialEvents={events.map((event) => ({
        id: event.id,
        title: event.title,
        jscal: fromPrismaJsonValue(event.jscal),
        tags: event.tags.map((entry) => ({
          id: entry.tag.id,
          name: entry.tag.name,
          color: entry.color,
        })),
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
      }))}
    />
  );
}
