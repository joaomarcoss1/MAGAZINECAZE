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
