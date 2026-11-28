import type { MetadataRoute } from "next";
import { getCategories, getSitemapProductSlugs } from "@/lib/catalog/repository";
import { store } from "@/lib/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, categories] = await Promise.all([getSitemapProductSlugs(), getCategories()]);
  return [
    { url: store.url, priority: 1 },
    { url: `${store.url}/produtos`, priority: 0.8 },
    ...categories.map((c) => ({ url: `${store.url}/categoria/${c.slug}`, priority: 0.7 })),
    ...slugs.map((slug) => ({ url: `${store.url}/produto/${slug}`, priority: 0.9 })),
  ];
}
