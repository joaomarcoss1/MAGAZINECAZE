import { expect, test } from "@playwright/test";

for (const method of ["Pix", "Cartão"] as const) {
  test(`compra de produto digital com ${method} simulado`, async ({ page }) => {
    await page.goto("/produto/enem-completo-2027");
    await page.getByRole("button", { name: "Comprar agora" }).first().click();
    await page.getByLabel("Nome completo").fill("Cliente de Teste");
    await page.getByLabel("E-mail").fill("comprador@example.com");
    await page.getByLabel("Celular (WhatsApp)").fill("85912345678");
    await page.getByLabel("CPF").fill("52998224725");
    if (method === "Cartão") await page.getByText("Cartão de crédito", { exact: true }).click();
    await page.getByRole("button", { name: method === "Pix" ? /Pagar.*com Pix/ : /Pagar.*no cartão/ }).click();
    await expect(page).toHaveURL(/\/pedido\/[a-f0-9-]+/);
    await expect(page.getByRole("heading", { name: /Finalize o pagamento/ })).toBeVisible();
    await page.getByRole("button", { name: "Simular pagamento aprovado" }).click();
    await expect(page.getByRole("heading", { name: /Pagamento aprovado/ })).toBeVisible();
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      await expect(page.getByRole("link", { name: "Entre na conta para acessar" })).toBeVisible();
    } else {
      await expect(page.locator('a[href^="/api/download/"]')).toHaveCount(1);
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const orderId = new URL(page.url()).pathname.split("/").at(-1);
      const { createClient } = await import("@supabase/supabase-js");
      const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      const { data, error } = await db.from("entitlements").select("email").eq("order_id", orderId).single();
      expect(error).toBeNull();
      expect(data?.email).toBe("comprador@example.com");
      if (method === "Pix") {
        const product = await db.from("products").select("id").eq("slug", "enem-completo-2027").single();
        expect(product.error).toBeNull();
        const productId = product.data!.id;
        const path = "fixtures/entrega.txt";
        const delivery = `/api/download/${productId}?pedido=${orderId}`;
        const access = () => page.request.get(delivery, { maxRedirects: 0 });
        expect((await access()).status()).toBe(403);
        const uploaded = await db.storage.from("digital").upload(path, "Entrega de teste", { contentType: "text/plain", upsert: true });
        expect(uploaded.error).toBeNull();
        expect((await db.from("products").update({ delivery_path: path }).eq("id", productId)).error).toBeNull();

        const password = "senha-de-teste-12345";
        const outsider = await db.auth.admin.createUser({ email: "outra-conta@example.com", password, email_confirm: true });
        expect(outsider.error).toBeNull();
        const session = (mode: "entrar" | "cadastrar", email: string) => page.request.post("/api/auth/session", {
          data: { mode, email, password, name: "Pessoa de Teste" },
        });
        expect((await session("entrar", "outra-conta@example.com")).status()).toBe(200);
        expect((await access()).status()).toBe(403);
        expect((await session("cadastrar", "comprador@example.com")).status()).toBe(200);
        const users = await db.auth.admin.listUsers();
        const buyer = users.data.users.find((user) => user.email === "comprador@example.com");
        expect(buyer).toBeDefined();
        expect((await db.auth.admin.updateUserById(buyer!.id, { email_confirm: true })).error).toBeNull();
        expect((await session("entrar", "comprador@example.com")).status()).toBe(200);

        const responses = await Promise.all(Array.from({ length: 12 }, access));
        expect(responses.filter((response) => response.status() === 307)).toHaveLength(10);
        expect(responses.filter((response) => response.status() === 429)).toHaveLength(2);
        const redirect = responses.find((response) => response.status() === 307)!;
        expect(redirect.headers()["cache-control"]).toContain("no-store");
        const file = await page.request.get(redirect.headers().location);
        expect(await file.text()).toBe("Entrega de teste");
        const entries = await db.from("download_logs").select("user_id");
        expect(entries.error).toBeNull();
        expect(entries.data?.filter((entry) => entry.user_id === buyer!.id)).toHaveLength(10);
      }
    }
  });
}
