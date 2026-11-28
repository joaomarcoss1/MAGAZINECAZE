import assert from "node:assert/strict";
import { test } from "node:test";
import { sitemapBlock, sitemapIds } from "../src/lib/catalog/sitemap-blocks";

test("sitemap abre outro bloco após 5.000 produtos sem misturar categorias", () => {
  assert.deepEqual(sitemapIds(0, 0), ["paginas"]);
  assert.deepEqual(sitemapIds(5000, 1), ["paginas", "produtos-0", "categorias-0"]);
  assert.deepEqual(sitemapIds(5001, 1), ["paginas", "produtos-0", "produtos-1", "categorias-0"]);
  assert.deepEqual(sitemapBlock("produtos-1"), { table: "products", offset: 5000 });
  assert.equal(sitemapBlock("produtos-01"), null);
});
