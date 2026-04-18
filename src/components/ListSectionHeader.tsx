type ListSectionHeaderProps = {
  label: string;
  tone?: "default" | "accent";
};

/**
 * Renders a section heading with a horizontal divider.
 */
export default function ListSectionHeader({
  label,
  tone = "default",
}: ListSectionHeaderProps) {
  const lineColor =
    tone === "accent"
      ? "bg-[color:color-mix(in oklab,var(--accent) 35%,transparent)]"
      : "bg-[color:color-mix(in oklab,var(--ink) 12%,transparent)]";
  const textColor = tone === "accent" ? "text-accent" : "";

  return (
    <div className="flex items-center gap-4">
      <h2 className={`font-semibold text-base uppercase ${textColor}`}>
        {label}
      </h2>
      <div className={`h-px flex-1 ${lineColor}`} />
    </div>
  );
}
