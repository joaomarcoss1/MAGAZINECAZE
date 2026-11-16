import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/catalog/repository";
import { store } from "@/lib/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return [
    { url: store.url, priority: 1 },
    { url: `${store.url}/produtos`, priority: 0.8 },
    ...categories.map((c) => ({ url: `${store.url}/categoria/${c.slug}`, priority: 0.7 })),
    ...products.map((p) => ({ url: `${store.url}/produto/${p.slug}`, priority: 0.9 })),
  ];
}
