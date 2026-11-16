import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, Store } from "lucide-react";
import { canAccessAdmin } from "@/lib/auth";
import { isDemoMode } from "@/lib/config";

export const metadata: Metadata = { title: "Painel", robots: { index: false } };
export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await canAccessAdmin())) notFound();
  return (
    <div className="container-page grid gap-8 py-8 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-40 lg:self-start">
        <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-ink-400">Painel da loja</p>
        <nav className="scrollbar-none flex gap-1 overflow-x-auto lg:flex-col">
          {nav.map(({ href, label, icon: I }) => (
            <Link key={href} href={href} className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-brand-50 hover:text-brand-800">
              <I className="size-4.5" /> {label}
            </Link>
          ))}
          <Link href="/" className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-500 hover:bg-areia-100">
            <Store className="size-4.5" /> Ver loja
          </Link>
        </nav>
        {isDemoMode && (
          <p className="mt-4 rounded-xl bg-caja-100 p-3 text-xs text-ink-700">
            Demonstração: painel aberto e somente leitura. Com o Supabase configurado, só administradores acessam.
          </p>
        )}
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
