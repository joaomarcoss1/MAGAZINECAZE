import type { Metadata } from "next";
import { CatalogView, type CatalogParams } from "@/components/product/catalog-view";

export const metadata: Metadata = { title: "Todos os produtos" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<CatalogParams> }) {
  const params = await searchParams;
  return <CatalogView params={params} basePath="/produtos" title={params.q ? "Busca" : "Todos os produtos"} />;
}
