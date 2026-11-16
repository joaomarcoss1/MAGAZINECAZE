import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogOut, Shield } from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { isDemoMode } from "@/lib/config";
import { listOrders } from "@/lib/orders/store";
import { Library, OrdersList } from "@/components/account/orders-list";
import { LocalOrders } from "@/components/account/local-orders";

export const metadata: Metadata = { title: "Minha conta", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  if (isDemoMode) {
    return (
      <div className="container-page py-10">
        <h1 className="text-3xl font-extrabold">Minha conta</h1>
        <p className="mb-8 mt-1 text-sm text-ink-500">Modo demonstração: pedidos feitos neste navegador.</p>
        <LocalOrders />
      </div>
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/conta");
  const orders = await listOrders({ userId: user.id, email: user.email });
  const dto = orders.map(({ id, number, status, totalCents, createdAt, items }) => ({ id, number, status, totalCents, createdAt, items }));

  return (
    <div className="container-page space-y-10 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Olá, {user.name?.split(" ")[0] ?? "cliente"}!</h1>
          <p className="mt-1 text-sm text-ink-500">{user.email}</p>
        </div>
        <div className="flex gap-2">
          {user.role === "admin" && (
            <Link href="/admin" className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
              <Shield className="size-4" /> Painel admin
            </Link>
          )}
          <form action="/auth/sair" method="post">
            <button className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-areia-100">
              <LogOut className="size-4" /> Sair
            </button>
          </form>
        </div>
      </div>
      <section>
        <h2 className="mb-4 text-xl font-extrabold">Meus produtos</h2>
        <Library orders={dto} />
      </section>
      <section>
        <h2 className="mb-4 text-xl font-extrabold">Meus pedidos</h2>
        <OrdersList orders={dto} />
      </section>
    </div>
  );
}
