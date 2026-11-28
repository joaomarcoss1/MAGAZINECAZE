import { expect, test } from "@playwright/test";

test("robots aponta para índice de sitemaps e o bloco lista produtos", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("/sitemap.xml");
  const index = await request.get("/sitemap.xml");
  expect(index.ok()).toBe(true);
  expect(index.headers()["content-type"]).toContain("application/xml");
  const xml = await index.text();
  expect(xml).toContain("<sitemapindex");
  expect(xml).toContain("/catalogo-sitemap/sitemap/paginas.xml");
  expect(xml).toContain("/catalogo-sitemap/sitemap/produtos-0.xml");
  expect(xml).toContain("/catalogo-sitemap/sitemap/categorias-0.xml");

  const products = await request.get("/catalogo-sitemap/sitemap/produtos-0.xml");
  expect(products.ok()).toBe(true);
  expect(await products.text()).toContain("/produto/enem-completo-2027");
  const absent = await request.get("/catalogo-sitemap/sitemap/produtos-999.xml");
  expect(absent.status()).toBe(404);
});
