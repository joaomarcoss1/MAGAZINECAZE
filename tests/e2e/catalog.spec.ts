import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

test("busca em português pagina resultados e carrega mais no celular", async ({ page }) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  test.skip(!url, "Exige Supabase local");
  const db = createClient(url!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const rows = Array.from({ length: 30 }, (_, n) => ({
    slug: `fixture-busca-${n}`, title: `Administração pública ${n}`,
    type: "ebook", category_slug: "ebooks", price_cents: 1000,
  }));
  const inserted = await db.from("products").insert(rows);
  expect(inserted.error).toBeNull();
  try {
    await page.goto("/produtos?q=administracao+publica&tipo=ebook&ate=1000&ordem=menor-preco");
    await expect(page.getByText("30 produtos", { exact: true })).toBeVisible();
    const cards = page.locator("article");
    await expect(cards).toHaveCount(24);
    const firstPage = await cards.locator("h3").allTextContents();
    await page.getByRole("link", { name: "Próxima" }).click();
    await expect(page).toHaveURL(/pagina=2/);
    await expect(cards).toHaveCount(6);
    expect((await cards.locator("h3").allTextContents()).every((title) => !firstPage.includes(title))).toBe(true);
    await page.getByLabel("Ordenar por").selectOption("maior-preco");
    await expect(cards).toHaveCount(24);
    await expect(page).not.toHaveURL(/pagina=/);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Carregar mais" }).click();
    await expect(cards).toHaveCount(30);
    await expect(page.getByRole("button", { name: "Carregar mais" })).toHaveCount(0);
  } finally {
    const removed = await db.from("products").delete().in("slug", rows.map((row) => row.slug));
    expect(removed.error).toBeNull();
  }
});

test("categorias, atributos e publicação governam a vitrine", async ({ page }) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  test.skip(!url, "Exige Supabase local");
  const db = createClient(url!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const parent = "fixture-parent";
  const child = "fixture-child";
  const categories = await db.from("categories").insert([
    { slug: parent, name: "Coleção de teste" },
    { slug: child, name: "Subcoleção de teste", parent_slug: parent },
  ]);
  expect(categories.error).toBeNull();
  const rows = [
    { slug: "fixture-facet-visible", title: "Material Linux", stock: null },
    { slug: "fixture-facet-other", title: "Material Windows" },
    { slug: "fixture-facet-draft", title: "Rascunho oculto", status: "draft" },
    { slug: "fixture-facet-future", title: "Agendado oculto", publish_at: "2099-01-01T00:00:00Z" },
  ];
  try {
    const inserted = await db.from("products").insert(rows.map((row) => ({
      status: "active", stock: null, publish_at: null, ...row, category_slug: child, type: "ebook", price_cents: 4900,
      delivery_path: "privado/fixture.pdf", seo_title: "Título SEO de teste",
    }))).select("id,slug");
    expect(inserted.error).toBeNull();
    const visible = inserted.data!.find((row) => row.slug === rows[0].slug)!;
    const hidden = inserted.data!.find((row) => row.slug === rows[2].slug)!;
    expect((await db.from("product_attributes").insert([
      { product_id: visible.id, name: "Sistema", value: "Linux" },
      { product_id: hidden.id, name: "Sistema", value: "Invisível" },
    ])).error).toBeNull();
    expect((await db.from("product_variants").insert({
      product_id: visible.id, sku: "fixture-sku", options: { cor: "azul" }, price_cents: 4900,
    })).error).toBeNull();
    expect((await db.from("product_images").insert({
      product_id: visible.id, url: "https://example.com/capa.png", alt: "Capa",
    })).error).toBeNull();

    await page.goto(`/categoria/${parent}`);
    await expect(page.locator("article")).toHaveCount(2);
    await expect(page.getByRole("link", { name: "E-book (2)", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Invisível/ })).toHaveCount(0);
    await page.getByRole("link", { name: "Sistema: Linux (1)" }).click();
    await expect(page.locator("article")).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Material Linux" })).toBeVisible();
    await page.goto(`/produto/${visible.slug}`);
    await expect(page).toHaveTitle(/Título SEO de teste/);
  } finally {
    await db.from("products").delete().in("slug", rows.map((row) => row.slug));
    await db.from("categories").delete().in("slug", [parent, child]);
  }
});
