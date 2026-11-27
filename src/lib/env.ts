import { z } from "zod";

const url = z.url({ protocol: /^https?$/ });
const https = z.url({ protocol: /^https$/ });
const key = z.string().trim().min(1);
const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: url,
  NEXT_PUBLIC_SUPABASE_URL: url,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: key,
});
const protectionSchema = z.object({
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: key,
  TURNSTILE_SECRET_KEY: key,
  UPSTASH_REDIS_REST_URL: https,
  UPSTASH_REDIS_REST_TOKEN: key,
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: key,
  MERCADOPAGO_ACCESS_TOKEN: key,
  MERCADOPAGO_WEBHOOK_SECRET: key,
});

export function isProduction(env: NodeJS.ProcessEnv) {
  return env.VERCEL_ENV === "production" || env.APP_ENV === "production";
}

export function validateEnv(env: NodeJS.ProcessEnv) {
  const production = isProduction(env);
  const values = Object.fromEntries(
    Object.entries(env).filter(([, value]) => value?.trim()),
  );
  const database = Boolean(values.NEXT_PUBLIC_SUPABASE_URL ||
    values.NEXT_PUBLIC_SUPABASE_ANON_KEY || values.SUPABASE_SERVICE_ROLE_KEY);
  const payment = Boolean(values.MERCADOPAGO_ACCESS_TOKEN || values.MERCADOPAGO_WEBHOOK_SECRET);
  const publicResult = (production
    ? publicSchema.extend({ NEXT_PUBLIC_SITE_URL: https, NEXT_PUBLIC_SUPABASE_URL: https })
    : database ? publicSchema.partial({ NEXT_PUBLIC_SITE_URL: true }) : publicSchema.partial()
  ).safeParse(values);
  const serverResult = (production
    ? serverSchema
    : serverSchema.extend({
      SUPABASE_SERVICE_ROLE_KEY: database ? key : key.optional(),
      MERCADOPAGO_ACCESS_TOKEN: payment ? key : key.optional(),
      MERCADOPAGO_WEBHOOK_SECRET: payment ? key : key.optional(),
    })
  ).safeParse(values);
  const protection = production || env.APP_ENV === "staging" ||
    Object.keys(protectionSchema.shape).some((name) => values[name]);
  const protectionResult = (protection ? protectionSchema : protectionSchema.partial()).safeParse(values);
  const invalid = [publicResult, serverResult, protectionResult].flatMap((result) =>
    result.success ? [] : result.error.issues.map(({ path }) => path.join(".")),
  );
  if (protection && !values.NEXT_PUBLIC_SITE_URL && !invalid.includes("NEXT_PUBLIC_SITE_URL")) {
    invalid.push("NEXT_PUBLIC_SITE_URL");
  }
  if (!production && payment && !database) invalid.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!production && database && !payment && publicResult.success) {
    const host = new URL(publicResult.data.NEXT_PUBLIC_SUPABASE_URL!).hostname;
    if (!["localhost", "127.0.0.1", "[::1]"].includes(host)) {
      invalid.push("MERCADOPAGO_ACCESS_TOKEN", "MERCADOPAGO_WEBHOOK_SECRET");
    }
  }
  if (invalid.length) throw new Error(`Configuração inválida: ${invalid.join(", ")}`);
}
