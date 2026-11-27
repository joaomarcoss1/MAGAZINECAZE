import { createServerClient } from "@supabase/ssr";
import { createClient as createJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { isProduction } from "@/lib/env";
import { isSupabaseConfigured } from "@/lib/config";

/** Cliente com a sessão do usuário (respeita RLS). */
export async function createClient() {
  if (!isSupabaseConfigured) return null;
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Chamado de um Server Component: o middleware atualiza a sessão.
          }
        },
      },
    },
  );
}

/** Cliente de serviço (ignora RLS). Use SOMENTE no servidor, em rotas confiáveis. */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!isSupabaseConfigured || !key?.trim()) {
    if (isProduction(process.env)) throw new Error("Supabase indisponível.");
    return null;
  }
  return createJsClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Cliente público sem cookies, para leituras de catálogo (cacheáveis). */
export function createPublicClient() {
  if (!isSupabaseConfigured) return null;
  return createJsClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
}
