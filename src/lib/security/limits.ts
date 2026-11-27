import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { isProduction } from "../env";

const limits = { checkout: 20, pedidos: 120, download: 30, login: 15, cadastro: 8 };
type Scope = keyof typeof limits;
const windowSeconds = 60;
const increment = "local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end; return {n, redis.call('TTL', KEYS[1])}";

export async function limitRequest(request: Request, scope: Scope) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return isProduction(process.env) ? unavailable() : null;
  const source = process.env.VERCEL === "1" ? "x-vercel-forwarded-for" : "x-real-ip";
  const address = request.headers.get(source)?.split(",")[0].trim() ?? "";
  const identifier = isIP(address) ? address : "desconhecido";
  const hash = createHash("sha256").update(identifier).digest("hex");
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(["EVAL", increment, 1, `caze:${scope}:${hash}`, windowSeconds]),
      signal: AbortSignal.timeout(2000),
      cache: "no-store",
    });
    if (!response.ok) return unavailable();
    const { result } = await response.json();
    if (!Array.isArray(result) || result.length !== 2 || !result.every(Number.isInteger)
      || result[0] < 1 || result[1] < 0) return unavailable();
    if (result[0] <= limits[scope]) return null;
    return NextResponse.json({ error: "Muitas tentativas. Aguarde e tente novamente." }, {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, result[1])), "Cache-Control": "no-store" },
    });
  } catch {
    return unavailable();
  }
}

function unavailable() {
  return NextResponse.json({ error: "Serviço temporariamente indisponível. Tente novamente." }, {
    status: 503, headers: { "Retry-After": "5", "Cache-Control": "no-store" },
  });
}
