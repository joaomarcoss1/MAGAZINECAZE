import { getCatalogSitemapIds } from "@/lib/catalog/repository";
import { store } from "@/lib/config";

export const revalidate = 300;

export async function GET() {
  const ids = await getCatalogSitemapIds();
  const entries = ids.map((id) => {
    const url = new URL(`/catalogo-sitemap/sitemap/${id}.xml`, store.url).href.replaceAll("&", "&amp;");
    return `<sitemap><loc>${url}</loc></sitemap>`;
  });
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join("")}</sitemapindex>`, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
