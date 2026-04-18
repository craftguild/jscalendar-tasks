type CompletionStatusBadgeProps = {
  label: string;
};

/**
 * Renders the visual badge used for completed occurrences.
 */
export default function CompletionStatusBadge({
  label,
}: CompletionStatusBadgeProps) {
  return (
    <span className="rounded-md bg-[color:color-mix(in oklab,var(--accent) 18%,transparent)] px-4 py-2 font-semibold text-accent shadow-sm">
      {label}
    </span>
  );
}
