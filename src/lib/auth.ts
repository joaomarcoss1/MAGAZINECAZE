import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/config";

export type SessionUser = { id: string; email: string; name: string | null; role: "customer" | "admin" };

export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle();
  return {
    id: user.id,
    email: user.email ?? "",
    name: profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? null,
    role: profile?.role === "admin" ? "admin" : "customer",
  };
}

/** No modo demonstração o painel fica aberto (somente leitura) para você conhecer o sistema. */
export async function canAccessAdmin(): Promise<boolean> {
  if (isDemoMode) return true;
  return (await getCurrentUser())?.role === "admin";
}
