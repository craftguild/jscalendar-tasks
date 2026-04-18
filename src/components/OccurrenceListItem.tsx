import type { ReactNode } from "react";
import type { OccurrenceItem } from "@/lib/occurrences-data";
import TaskCard from "@/components/TaskCard";

type OccurrenceListItemProps = {
  item: OccurrenceItem;
  dateText: string;
  ribbonTone: "overdue" | "soon" | "warning" | "notice" | "none";
  action: ReactNode;
};

/**
 * Adapts an occurrence item to the shared task card component.
 */
export default function OccurrenceListItem({
  item,
  dateText,
  ribbonTone,
  action,
}: OccurrenceListItemProps) {
  return (
    <TaskCard
      dateText={dateText}
      title={item.title}
      notes={item.description}
      tags={item.tags}
      ribbonTone={ribbonTone}
      action={action}
    />
  );
}
