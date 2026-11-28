import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readSheet } from "read-excel-file/node";
import writeXlsxFile from "write-excel-file/node";

test("admin revisa CSV e XLSX, confirma e consulta o resultado por SKU", async ({ page }) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  test.skip(!url, "Exige Supabase local");
  const db = createClient(url!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const email = `catalogo-${randomUUID()}@example.com`;
  const password = "senha-catalogo-teste-123";
  const user = await db.auth.admin.createUser({ email, password, email_confirm: true });
  expect(user.error).toBeNull();
  const adminId = user.data.user!.id;
  const sku = "IMPORT-E2E";
  try {
    expect((await db.from("profiles").update({ role: "admin" }).eq("id", adminId)).error).toBeNull();
    expect((await page.request.post("/api/auth/session", { data: { mode: "entrar", email, password } })).status()).toBe(200);
    await page.goto("/admin/produtos/importacoes");
    await page.getByLabel("Planilha do catálogo").setInputFiles({
      name: "catalogo.csv", mimeType: "text/csv",
      buffer: Buffer.from(`sku;titulo;tipo;categoria;preco_centavos;estoque\n${sku};Livro da importação;ebook;ebooks;1990;15\nINVALIDO;Produto inválido;ebook;ebooks;-1;0\n`),
    });
    await page.getByRole("button", { name: "Ver prévia" }).click();
    await expect(page.getByRole("heading", { name: "Prévia" })).toBeVisible();
    await expect(page.getByText("Campos inválidos: preco_centavos.")).toBeVisible();
    const before = await db.from("products").select("id").eq("sku", sku).maybeSingle();
    expect(before.data).toBeNull();

    await page.getByRole("button", { name: "Confirmar importação das linhas válidas" }).click();
    await expect(page.getByRole("heading", { name: "Na fila" })).toBeVisible();
    const batch = await db.rpc("process_catalog_import", { p_limit: 1000 });
    expect(batch.error).toBeNull();
    expect(batch.data).toBe(1);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Concluído" })).toBeVisible();
    const report = await page.request.get(await page.getByRole("link", { name: "Baixar relatório completo" }).getAttribute("href") ?? "");
    expect(await report.text()).toContain('"INVALIDO";"invalid"');

    const file = await writeXlsxFile([["sku", "preco_centavos", "estoque"], [sku, 3490, 0]]).toBuffer();
    await page.getByLabel("Planilha do catálogo").setInputFiles({
      name: "atualizacao.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: file,
    });
    await page.getByRole("button", { name: "Ver prévia" }).click();
    await expect(page.getByRole("heading", { name: "Prévia" })).toBeVisible();
    await page.getByRole("button", { name: "Confirmar importação das linhas válidas" }).click();
    await expect(page.getByRole("heading", { name: "Na fila" })).toBeVisible();
    const update = await db.rpc("process_catalog_import", { p_limit: 1000 });
    expect(update.error).toBeNull();
    expect(update.data).toBe(1);
    const product = await db.from("products").select("title,price_cents,stock,status").eq("sku", sku).single();
    expect(product.data).toEqual({ title: "Livro da importação", price_cents: 3490, stock: 0, status: "draft" });

    const exported = await page.request.get("/api/admin/catalogo/arquivo?formato=xlsx");
    expect(exported.ok()).toBe(true);
    const sheet = await readSheet(await exported.body(), 1);
    expect(sheet.find((row) => row[0] === sku)?.slice(6, 9)).toEqual([3490, 0, "draft"]);
    const csv = await page.request.get("/api/admin/catalogo/arquivo");
    expect(await csv.text()).toContain('"IMPORT-E2E";"Livro da importação"');
  } finally {
    await db.from("catalog_imports").delete().eq("created_by", adminId);
    await db.from("products").delete().eq("sku", sku);
    await db.auth.admin.deleteUser(adminId);
  }
});
