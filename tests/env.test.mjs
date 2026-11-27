import assert from "node:assert/strict";
import { test } from "node:test";
import { validateEnv } from "../src/lib/env.ts";

const configured = {
  VERCEL_ENV: "production",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "widget-test",
  TURNSTILE_SECRET_KEY: "secret-test",
  UPSTASH_REDIS_REST_URL: "https://redis.example",
  UPSTASH_REDIS_REST_TOKEN: "redis-test",
  NEXT_PUBLIC_SITE_URL: "https://loja.example",
  NEXT_PUBLIC_SUPABASE_URL: "https://db.example",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-test-key",
  SUPABASE_SERVICE_ROLE_KEY: "private-test-key",
  MERCADOPAGO_ACCESS_TOKEN: "private-test-token",
  MERCADOPAGO_WEBHOOK_SECRET: "private-test-secret",
};

test("permite demonstração local sem credenciais", () => validateEnv({}));
test("aceita configuração completa em produção", () => validateEnv(configured));
for (const name of Object.keys(configured).filter((name) => name !== "VERCEL_ENV")) {
  test(`produção recusa ausência de ${name}`, () => {
    assert.throws(() => validateEnv({ ...configured, [name]: " " }), new RegExp(name));
  });
}
test("rejeita configuração parcial do banco", () => {
  assert.throws(() => validateEnv({ NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321" }),
    /SUPABASE_SERVICE_ROLE_KEY/);
});
test("permite simulação com Supabase na própria máquina", () => validateEnv({
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-public",
  SUPABASE_SERVICE_ROLE_KEY: "local-private",
}));
test("rejeita banco remoto com gateway ausente", () => {
  assert.throws(() => validateEnv({
    NEXT_PUBLIC_SUPABASE_URL: configured.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: configured.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: configured.SUPABASE_SERVICE_ROLE_KEY,
  }), /MERCADOPAGO_ACCESS_TOKEN/);
});
test("produção fora da Vercel também exige HTTPS", () => {
  assert.throws(() => validateEnv({
    ...configured, VERCEL_ENV: undefined, APP_ENV: "production",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  }), /NEXT_PUBLIC_SITE_URL/);
});
