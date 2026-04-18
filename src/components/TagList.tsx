type TagListItem = {
  name: string;
  color?: string | null;
};

type TagListProps = {
  tags: TagListItem[];
};

/**
 * Renders a compact list of colored task tags.
 */
export default function TagList({ tags }: TagListProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <span
          key={`${tag.name}-${tag.color ?? "none"}-${index}`}
          className="rounded-md bg-gray-50 px-2 py-1"
        >
          <span
            className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle"
            style={{ backgroundColor: tag.color ?? "#0f172a" }}
          />
          {tag.name}
        </span>
      ))}
    </div>
  );
}
