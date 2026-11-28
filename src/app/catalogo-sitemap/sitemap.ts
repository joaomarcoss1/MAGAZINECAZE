import type { MetadataRoute } from "next";
import { notFound } from "next/navigation";
import { getCatalogSitemapIds, getCatalogSitemapSlugs } from "@/lib/catalog/repository";
import { sitemapBlock } from "@/lib/catalog/sitemap-blocks";
import { store } from "@/lib/config";

export const revalidate = 300;

export async function generateSitemaps() {
  return (await getCatalogSitemapIds()).map((id) => ({ id }));
}

export default async function sitemap({ id }: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const name = await id;
  if (name === "paginas") return [
    { url: new URL("/", store.url).href, priority: 1 },
    { url: new URL("/produtos", store.url).href, priority: 0.8 },
  ];
  const block = sitemapBlock(name);
  if (!block || !(await getCatalogSitemapIds()).includes(name)) notFound();
  const slugs = await getCatalogSitemapSlugs(block.table, block.offset);
  if (!slugs.length) notFound();
  const path = block.table === "products" ? "produto" : "categoria";
  return slugs.map((slug) => ({ url: new URL(`/${path}/${encodeURIComponent(slug)}`, store.url).href }));
}
