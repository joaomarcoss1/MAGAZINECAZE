import { isProduction } from "../env";

export async function verifyCheckoutChallenge(token: string | undefined) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return isProduction(process.env) ? "unavailable" : "valid";
  if (!token || token.length > 2048) return "invalid";
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (!res.ok) return "unavailable";
    const result = await res.json();
    if (result["error-codes"]?.includes("internal-error")) return "unavailable";
    const hostname = new URL(process.env.NEXT_PUBLIC_SITE_URL!).hostname;
    return result.success === true && result.action === "checkout" && result.hostname === hostname
      ? "valid" : "invalid";
  } catch {
    return "unavailable";
  }
}
