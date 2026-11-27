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
    await expect(page.locator('a[href^="/api/download/"]')).toHaveCount(1);

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const orderId = new URL(page.url()).pathname.split("/").at(-1);
      const { createClient } = await import("@supabase/supabase-js");
      const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      const { data, error } = await db.from("entitlements").select("email").eq("order_id", orderId).single();
      expect(error).toBeNull();
      expect(data?.email).toBe("comprador@example.com");
    }
  });
}
