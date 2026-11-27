import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

test("cadastro e login do formulário usam o Supabase local", async ({ page }) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  test.skip(!url, "Exige Supabase local");
  const db = createClient(url!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const email = `conta-${randomUUID()}@example.com`;
  const password = "senha-apenas-de-teste-92";
  await page.goto("/entrar");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await page.getByLabel("Nome completo").fill("Pessoa de Teste");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page.getByText(/Conta criada!/)).toBeVisible();
  const { data, error } = await db.auth.admin.listUsers();
  expect(error).toBeNull();
  const account = data.users.find((user) => user.email === email);
  expect(account).toBeDefined();
  const confirmed = await db.auth.admin.updateUserById(account!.id, { email_confirm: true });
  expect(confirmed.error).toBeNull();
  try {
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    const loginResponse = page.waitForResponse((res) => res.url().endsWith("/api/auth/session") && res.request().method() === "POST");
    await page.getByRole("button", { name: "Entrar", exact: true }).last().click();
    expect((await loginResponse).status()).toBe(200);
    expect((await page.context().cookies()).some((cookie) => cookie.name.includes("-auth-token"))).toBe(true);
    await expect(page).toHaveURL(/\/conta$/);
  } finally {
    await db.auth.admin.deleteUser(account!.id);
  }
});
