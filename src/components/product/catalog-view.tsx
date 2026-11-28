import Link from "next/link";
import { SearchX } from "lucide-react";
import { getCategories, getProductPage } from "@/lib/catalog/repository";
import type { ProductType } from "@/lib/catalog/types";
import { productTypeLabel } from "@/lib/catalog/types";
import { cn, formatBRL } from "@/lib/format";
import { CatalogGrid } from "./catalog-grid";
import { catalogQuery, pageSize, type CatalogParams } from "@/lib/catalog/pagination";
import { SortSelect } from "./sort-select";

export type { CatalogParams } from "@/lib/catalog/pagination";

const priceRanges = [5000, 10000, 20000, 50000];

export async function CatalogView({
  params,
  basePath,
  title,
  description,
}: {
  params: CatalogParams;
  basePath: string;
  title: string;
  description?: string;
}) {
  const query = catalogQuery(params);
  const { type, maxPrice, page = 1 } = query;
  const filters = {
    q: query.q, categoria: query.category, tipo: type, ordem: query.sort,
    ate: maxPrice === undefined ? undefined : String(maxPrice),
  };
  const [categories, { products, total }] = await Promise.all([
    getCategories(), getProductPage(query),
  ]);

  const href = (patch: Partial<CatalogParams>) => {
    const merged = { ...filters, ...patch };
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (typeof v === "string" && v && !(k === "pagina" && v === "1")) sp.set(k, v);
    // A categoria já está no caminho em /categoria/[slug]
    if (basePath.startsWith("/categoria")) sp.delete("categoria");
    const s = sp.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  const chip = (active: boolean) =>
    cn(
      "block rounded-lg px-3 py-2 text-sm transition",
      active ? "bg-brand-50 font-semibold text-brand-800" : "text-ink-700 hover:bg-areia-100",
    );

  return (
    <div className="container-page py-8">
      <nav className="mb-4 text-xs text-ink-500" aria-label="Trilha">
        <Link href="/" className="hover:text-brand-700">Início</Link> <span className="mx-1">/</span>
        <span className="text-ink-700">{title}</span>
      </nav>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-ink-900">{title}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {description ? `${description} · ` : ""}
            {total} {total === 1 ? "produto" : "produtos"}
          </p>
        </div>
        <SortSelect value={query.sort ?? "relevancia"} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-6">
          {!basePath.startsWith("/categoria") && (
            <div>
              <h2 className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-ink-400">Categorias</h2>
              <div className="scrollbar-none flex gap-1 overflow-x-auto lg:block lg:space-y-0.5">
                <Link href={href({ categoria: undefined })} className={cn(chip(!query.category), "shrink-0")}>
                  Todas
                </Link>
                {categories.map((c) => (
                  <Link key={c.slug} href={href({ categoria: c.slug })} className={cn(chip(params.categoria === c.slug), "shrink-0")}>
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div>
            <h2 className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-ink-400">Formato</h2>
            <div className="scrollbar-none flex gap-1 overflow-x-auto lg:block lg:space-y-0.5">
              <Link href={href({ tipo: undefined })} className={cn(chip(!type), "shrink-0")}>Todos</Link>
              {(Object.keys(productTypeLabel) as ProductType[]).map((t) => (
                <Link key={t} href={href({ tipo: t })} className={cn(chip(type === t), "shrink-0")}>
                  {productTypeLabel[t]}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-ink-400">Preço</h2>
            <div className="scrollbar-none flex gap-1 overflow-x-auto lg:block lg:space-y-0.5">
              <Link href={href({ ate: undefined })} className={cn(chip(!maxPrice), "shrink-0")}>Qualquer valor</Link>
              {priceRanges.map((p) => (
                <Link key={p} href={href({ ate: String(p) })} className={cn(chip(maxPrice === p), "shrink-0")}>
                  Até {formatBRL(p)}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <div>
          {query.q && (
            <p className="mb-4 text-sm text-ink-500">
              Resultados para <strong className="text-ink-900">“{query.q}”</strong>
            </p>
          )}
          {products.length ? (
            <CatalogGrid key={href({ pagina: String(page) })} page={page} total={total} filters={filters} initial={products} />
          ) : (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-areia-300 bg-white py-16 text-center">
              <SearchX className="size-12 text-ink-200" />
              <p className="mt-4 font-bold text-ink-900">Nenhum produto encontrado</p>
              <p className="mt-1 text-sm text-ink-500">Tente outros termos ou remova alguns filtros.</p>
              <Link href={basePath} className="mt-4 text-sm font-semibold text-brand-600 hover:underline">
                Limpar filtros
              </Link>
            </div>
          )}
          {(page > 1 || page * pageSize < total) && (
            <nav aria-label="Paginação do catálogo" className="mt-6 flex items-center justify-center gap-5 text-sm">
              {page > 1 && <Link href={href({ pagina: String(page - 1) })}>Anterior</Link>}
              <span>Página {page}</span>
              {page * pageSize < total && <Link className="hidden sm:inline" href={href({ pagina: String(page + 1) })}>Próxima</Link>}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
