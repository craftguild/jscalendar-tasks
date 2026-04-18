import type { ReactNode } from "react";
import TagList from "@/components/TagList";
import { TAG_COLORS } from "@/lib/tag-colors";
type TaskTag = { name: string; color?: string };
type TaskCardProps = {
  dateText: string;
  title: string;
  notes?: string | null;
  tags?: TaskTag[];
  details?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  ribbonTone?: "overdue" | "soon" | "warning" | "notice" | "none";
};
const ribbonColors: Record<NonNullable<TaskCardProps["ribbonTone"]>, string> = {
  overdue: TAG_COLORS[7],
  soon: TAG_COLORS[6],
  warning: TAG_COLORS[5],
  notice: TAG_COLORS[11],
  none: "transparent",
};
/**
 * Renders the shared task/occurrence card surface.
 */
export default function TaskCard({
  dateText,
  title,
  notes,
  tags,
  details,
  action,
  footer,
  ribbonTone = "none",
}: TaskCardProps) {
  return (
    <article className="relative grid gap-4 overflow-hidden rounded-md bg-surface p-4 shadow-sm">
      {ribbonTone !== "none" ? (
        <span
          className="absolute left-0 top-[-1.6rem] h-8 w-8 origin-top-left rotate-45"
          style={{ backgroundColor: ribbonColors[ribbonTone] }}
        />
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="grid gap-2">
          <p className="text-[color:color-mix(in oklab,var(--ink) 55%,transparent)]">
            {dateText}
          </p>
          <h3 className="font-semibold">{title}</h3>
          {notes ? (
            <p className="text-[color:color-mix(in oklab,var(--ink) 70%,transparent)]">
              {notes}
            </p>
          ) : null}
          {details}
          {tags && tags.length > 0 ? (
            <div className="mt-1">
              <TagList tags={tags} />
            </div>
          ) : null}
        </div>
        {action ? (
          <div className="flex w-full items-center gap-2 sm:w-auto sm:justify-end">
            {action}
          </div>
        ) : null}
      </div>
      {footer ? <div>{footer}</div> : null}
    </article>
  );
}
