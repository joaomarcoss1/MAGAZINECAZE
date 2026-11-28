import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

test("admin envia imagens e cliente navega pela galeria ordenada", async ({ page }) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  test.skip(!url, "Exige Supabase local");
  const db = createClient(url!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const email = `galeria-${randomUUID()}@example.com`;
  const password = "senha-galeria-teste-123";
  const admin = await db.auth.admin.createUser({ email, password, email_confirm: true });
  expect(admin.error).toBeNull();
  const adminId = admin.data.user!.id;
  const created = await db.from("products").insert({
    title: "Produto da galeria", slug: "fixture-galeria", category_slug: "ebooks", type: "ebook", price_cents: 1000,
  }).select("id").single();
  expect(created.error).toBeNull();
  const productId = created.data!.id;
  try {
    expect((await db.from("profiles").update({ role: "admin" }).eq("id", adminId)).error).toBeNull();
    const login = await page.request.post("/api/auth/session", { data: { mode: "entrar", email, password } });
    expect(login.status()).toBe(200);
    await page.goto(`/admin/produtos/${productId}`);
    await page.getByLabel("Arquivo de imagem").setInputFiles({
      name: "invalida.png", mimeType: "image/png", buffer: Buffer.from("sem imagem"),
    });
    await page.getByLabel("Texto alternativo").fill("Imagem inválida");
    await page.getByRole("button", { name: "Adicionar à galeria" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "JPEG, PNG ou WebP" })).toBeVisible();

    for (const [alt, background] of [["Capa azul", "#1b5a99"], ["Vista laranja", "#eb7200"]]) {
      const buffer = await sharp({ create: { width: 32, height: 24, channels: 3, background } }).png().toBuffer();
      await page.getByLabel("Arquivo de imagem").setInputFiles({ name: "imagem.png", mimeType: "image/png", buffer });
      await page.getByLabel("Texto alternativo").fill(alt);
      const submitted = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes(productId));
      await page.getByRole("button", { name: "Adicionar à galeria" }).click();
      expect((await submitted).ok()).toBe(true);
      await expect(page.getByRole("status").filter({ hasText: "Imagem adicionada" })).toBeVisible();
    }
    const images = await db.from("product_images").select("url,alt,position").eq("product_id", productId).order("position");
    expect(images.error).toBeNull();
    expect(images.data?.map(({ alt, position }) => ({ alt, position }))).toEqual([
      { alt: "Capa azul", position: 0 }, { alt: "Vista laranja", position: 1 },
    ]);
    const stored = await page.request.get(images.data![0].url);
    expect(stored.headers()["content-type"]).toContain("image/webp");
    await page.goto("/produto/fixture-galeria");
    await expect(page.getByRole("img", { name: "Capa azul" })).toBeVisible();
    await page.getByRole("button", { name: "Ver imagem 2: Vista laranja" }).click();
    const second = page.getByRole("img", { name: "Vista laranja" });
    await expect(second).toBeVisible();
    await expect.poll(() => second.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  } finally {
    const objects = await db.storage.from("produtos").list(productId);
    if (objects.data?.length) await db.storage.from("produtos").remove(objects.data.map((file) => `${productId}/${file.name}`));
    await db.from("products").delete().eq("id", productId);
    await db.auth.admin.deleteUser(adminId);
  }
});
