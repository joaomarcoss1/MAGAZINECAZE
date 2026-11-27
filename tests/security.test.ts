import assert from "node:assert/strict";
import { test } from "node:test";
import { securityHeaders } from "../src/lib/security/headers";
import { limitRequest } from "../src/lib/security/limits";
import { verifyCheckoutChallenge } from "../src/lib/security/turnstile";

test("CSP permite os serviços usados e HSTS se restringe à produção", () => {
  const production = securityHeaders({
    NODE_ENV: "production", VERCEL_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "https://db.example",
  });
  const csp = production.find((header) => header.key === "Content-Security-Policy")?.value ?? "";
  for (const rule of ["https://db.example", "https://challenges.cloudflare.com", "frame-ancestors 'none'", "object-src 'none'"]) {
    assert.ok(csp.includes(rule));
  }
  assert.ok(!csp.includes("'unsafe-eval'"));
  assert.ok(production.some((header) => header.key === "Strict-Transport-Security"));
  assert.ok(!securityHeaders({ NODE_ENV: "test" }).some((header) => header.key === "Strict-Transport-Security"));
});

function useEnv(t: import("node:test").TestContext, env: Partial<NodeJS.ProcessEnv>) {
  const previous = process.env;
  process.env = { ...previous, ...env };
  t.after(() => { process.env = previous; });
}

test("limite responde 429 com tempo de espera e 503 quando Redis falha", async (t) => {
  useEnv(t, { UPSTASH_REDIS_REST_URL: "https://redis.example", UPSTASH_REDIS_REST_TOKEN: "test" });
  const request = new Request("https://loja.example/api/checkout");
  const fetch = t.mock.method(globalThis, "fetch", async () => Response.json({ result: [20, 21] }));
  assert.equal(await limitRequest(request, "checkout"), null);
  fetch.mock.mockImplementationOnce(async () => Response.json({ result: [21, 21] }));
  const denied = await limitRequest(request, "checkout");
  assert.equal(denied?.status, 429);
  assert.equal(denied?.headers.get("Retry-After"), "21");
  fetch.mock.mockImplementationOnce(async () => new Response(null, { status: 503 }));
  assert.equal((await limitRequest(request, "checkout"))?.status, 503);
});

test("Turnstile rejeita token expirado ou repetido, ação errada e host divergente", async (t) => {
  useEnv(t, { TURNSTILE_SECRET_KEY: "test", NEXT_PUBLIC_SITE_URL: "https://loja.example" });
  const fetch = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ success: true, action: "checkout", hostname: "loja.example" }));
  assert.equal(await verifyCheckoutChallenge(undefined), "invalid");
  assert.equal(await verifyCheckoutChallenge("novo"), "valid");
  for (const reply of [
    { success: false, "error-codes": ["timeout-or-duplicate"] },
    { success: true, action: "auth", hostname: "loja.example" },
    { success: true, action: "checkout", hostname: "outro.example" },
  ]) {
    fetch.mock.mockImplementationOnce(async () => Response.json(reply));
    assert.equal(await verifyCheckoutChallenge("teste"), "invalid");
  }
  fetch.mock.mockImplementationOnce(async () => new Response(null, { status: 503 }));
  assert.equal(await verifyCheckoutChallenge("teste"), "unavailable");
});
