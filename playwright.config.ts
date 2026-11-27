import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:3210";

const databaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (databaseUrl && !["localhost", "127.0.0.1", "[::1]"].includes(new URL(databaseUrl).hostname)) {
  throw new Error("Os testes E2E só podem usar um Supabase local.");
}

export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  use: { baseURL, trace: "retain-on-failure" },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3210",
    url: baseURL,
    timeout: 60_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: databaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
      TURNSTILE_SECRET_KEY: "",
      UPSTASH_REDIS_REST_URL: "",
      UPSTASH_REDIS_REST_TOKEN: "",
      MERCADOPAGO_ACCESS_TOKEN: "",
      MERCADOPAGO_WEBHOOK_SECRET: "",
    },
  },
});
