import { localCatalogImageOrigin } from "../catalog/image-origins";
import { isProduction } from "../env";

export function securityHeaders(env: NodeJS.ProcessEnv) {
  const turnstile = "https://challenges.cloudflare.com";
  const analytics = "https://va.vercel-scripts.com https://vitals.vercel-insights.com";
  const supabase = env.NEXT_PUBLIC_SUPABASE_URL ? new URL(env.NEXT_PUBLIC_SUPABASE_URL).origin : "";
  const script = ["'self'", "'unsafe-inline'", turnstile, "https://va.vercel-scripts.com",
    ...(env.NODE_ENV === "development" ? ["'unsafe-eval'"] : [])];
  const directives = [
    "default-src 'self'",
    `script-src ${script.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    [ "img-src 'self' data: blob:", localCatalogImageOrigin(env.NEXT_PUBLIC_SUPABASE_URL) ].filter(Boolean).join(" "),
    "font-src 'self'",
    `connect-src 'self' ${turnstile} ${analytics} https://viacep.com.br https://api.mercadopago.com ${supabase}`.trim(),
    `frame-src ${turnstile} https://www.mercadopago.com.br`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  const headers = [
    { key: "Content-Security-Policy", value: directives.join("; ") },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ];
  if (isProduction(env)) {
    headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000" });
  }
  return headers;
}
