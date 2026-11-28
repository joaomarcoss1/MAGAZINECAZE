import { productTypeLabel, type ProductQuery, type ProductType, type SortOption } from "./types";

export const pageSize = 24;
export type CatalogParams = Partial<Record<"q" | "categoria" | "tipo" | "ordem" | "ate" | "pagina", string | string[]>>;
const sorts = new Set(["relevancia", "mais-vendidos", "menor-preco", "maior-preco", "avaliacao", "novidades"]);

export function pageNumber(value: unknown): number {
  if (typeof value !== "string" || !/^[1-9]\d{0,5}$/.test(value)) return 1;
  return Number(value);
}

export function catalogQuery(params: CatalogParams): ProductQuery {
  const value = (input: string | string[] | undefined) => typeof input === "string" ? input : undefined;
  const type = value(params.tipo);
  const sort = value(params.ordem);
  const rawPrice = value(params.ate);
  return {
    q: value(params.q)?.trim().slice(0, 120),
    category: value(params.categoria)?.slice(0, 100),
    type: type && Object.hasOwn(productTypeLabel, type) ? type as ProductType : undefined,
    maxPrice: rawPrice && /^\d{1,10}$/.test(rawPrice) && Number(rawPrice) <= 2147483647 ? Number(rawPrice) : undefined,
    sort: sort && sorts.has(sort) ? sort as SortOption : "relevancia",
    page: pageNumber(params.pagina),
  };
}
