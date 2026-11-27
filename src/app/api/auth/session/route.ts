import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { limitRequest } from "@/lib/security/limits";
import { safeReturnPath } from "@/lib/security/return-path";
import { store } from "@/lib/config";

const credentials = z.object({
  mode: z.enum(["entrar", "cadastrar"]),
  email: z.email().max(254),
  password: z.string().min(8).max(1024),
  name: z.string().trim().max(120).optional(),
  next: z.string().max(2048).optional(),
  captchaToken: z.string().min(1).max(2048).optional(),
});

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ error: "Formato inválido." }, { status: 415 });
  }
  const body = await request.json().catch(() => null);
  const signup = body?.mode === "cadastrar";
  const limited = await limitRequest(request, signup ? "cadastro" : "login");
  if (limited) return limited;
  const parsed = credentials.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Revise seus dados." }, { status: 422 });
  const { email, password, name, captchaToken, next } = parsed.data;
  if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captchaToken) {
    return NextResponse.json({ error: "Aguarde a verificação de segurança e tente novamente." }, { status: 403 });
  }
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Acesso indisponível." }, { status: 503 });
  if (signup) {
    if (!name) return NextResponse.json({ error: "Informe seu nome." }, { status: 422 });
    const redirect = new URL("/auth/callback", store.url);
    redirect.searchParams.set("next", safeReturnPath(next));
    const { error } = await supabase.auth.signUp({
      email, password, options: { captchaToken, data: { full_name: name }, emailRedirectTo: redirect.href },
    });
    if (error) return NextResponse.json({ error: "Não foi possível criar a conta. Revise os dados e tente novamente." }, { status: 400 });
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });
    if (error) return NextResponse.json({ error: "Não foi possível entrar. Confira seus dados e tente novamente." }, { status: 401 });
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
