import Link from "next/link";
import type { Category } from "@/lib/catalog/types";
import { Icon } from "@/components/ui/icon";
import { coverThemes } from "@/components/product/product-cover";
import { cn } from "@/lib/format";

export function CategoryTiles({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/categoria/${c.slug}`}
          className="group flex flex-col items-center gap-3 rounded-2xl border border-areia-200 bg-white p-5 text-center shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-[var(--shadow-lift)]"
        >
          <span
            className={cn(
              "flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-inner transition group-hover:scale-110",
              coverThemes[c.theme].bg,
            )}
          >
            <Icon name={c.icon} className={cn("size-7", coverThemes[c.theme].accent)} />
          </span>
          <span className="text-sm font-bold leading-tight text-ink-900">{c.name}</span>
        </Link>
      ))}
    </div>
  );
}
