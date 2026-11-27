import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/account/login-form";
import { isDemoMode } from "@/lib/config";
import { LogoMark } from "@/components/layout/logo";

import { safeReturnPath } from "@/lib/security/return-path";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = safeReturnPath(next);
  return (
    <div className="container-page flex justify-center py-14">
      <div className="w-full max-w-md rounded-3xl border border-areia-200 bg-white p-8 shadow-[var(--shadow-lift)]">
        <LogoMark className="mx-auto size-14" />
        <h1 className="mt-4 text-center text-2xl font-extrabold">Acesse sua conta</h1>
        <p className="mt-1 text-center text-sm text-ink-500">Seus cursos, e-books e pedidos em um só lugar.</p>
        {isDemoMode ? (
          <p className="mt-6 rounded-xl bg-caja-100 p-4 text-sm text-ink-700">
            O login funciona assim que o Supabase for configurado. No modo demonstração, seus pedidos ficam
            salvos neste navegador em <Link href="/conta" className="font-semibold text-brand-700 underline">Minha conta</Link>.
          </p>
        ) : (
          <LoginForm next={safeNext} />
        )}
      </div>
    </div>
  );
}
