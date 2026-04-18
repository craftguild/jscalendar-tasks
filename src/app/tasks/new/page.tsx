import EventFormRedirect from "@/components/EventFormRedirect";
import PageLayout from "@/components/PageLayout";
export const dynamic = "force-dynamic";
/**
 * Renders the task creation page.
 */
export default function TaskNewPage() {
  return (
    <PageLayout titleKey="pageNewTask">
      <EventFormRedirect mode="create" />
    </PageLayout>
  );
}
