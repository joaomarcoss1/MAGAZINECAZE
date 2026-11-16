import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function SectionTitle({
  title,
  subtitle,
  href,
  linkLabel = "Ver todos",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-extrabold text-ink-900 sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-brand-600 hover:text-brand-800"
        >
          {linkLabel} <ChevronRight className="size-4" />
        </Link>
      )}
    </div>
  );
}
