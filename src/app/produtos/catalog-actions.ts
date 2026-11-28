"use server";

import { z } from "zod";
import { catalogQuery } from "@/lib/catalog/pagination";
import { getProductPage } from "@/lib/catalog/repository";

const filters = z.object({
  q: z.string().max(120).optional(),
  categoria: z.string().max(100).optional(),
  tipo: z.string().max(24).optional(),
  ordem: z.string().max(24).optional(),
  ate: z.string().max(10).optional(),
  pagina: z.string().regex(/^[1-9]\d{0,5}$/),
});

export async function loadCatalogPage(input: unknown) {
  const parsed = filters.safeParse(input);
  if (!parsed.success) throw new Error("Filtros inválidos.");
  const { products, total } = await getProductPage(catalogQuery(parsed.data));
  return { products: products.map((p) => ({ ...p, deliveryPath: null })), total };
}
