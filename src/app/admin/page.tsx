import Link from "next/link";
import { Clock, DollarSign, Receipt, ShoppingBag } from "lucide-react";
import { getProducts } from "@/lib/catalog/repository";
import { listOrders } from "@/lib/orders/store";
import { formatBRL } from "@/lib/format";
import { OrdersList } from "@/components/account/orders-list";

export default async function AdminDashboard() {
  const [orders, top] = await Promise.all([listOrders({ limit: 500 }), getProducts({ sort: "mais-vendidos", limit: 5 })]);
  const paid = orders.filter((o) => o.status === "paid");
  const revenue = paid.reduce((n, o) => n + o.totalCents, 0);
  const kpis = [
    { label: "Faturamento", value: formatBRL(revenue), icon: DollarSign, tone: "bg-mandacaru-50 text-mandacaru-600" },
    { label: "Pedidos pagos", value: paid.length.toString(), icon: ShoppingBag, tone: "bg-brand-50 text-brand-600" },
    { label: "Ticket médio", value: formatBRL(paid.length ? Math.round(revenue / paid.length) : 0), icon: Receipt, tone: "bg-sol-50 text-sol-600" },
    { label: "Aguardando pagamento", value: orders.filter((o) => o.status === "pending").length.toString(), icon: Clock, tone: "bg-caja-100 text-caja-600" },
  ];
  const topMax = Math.max(1, ...top.map((p) => p.soldCount));

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold">Visão geral</h1>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpis.map(({ label, value, icon: I, tone }) => (
          <div key={label} className="rounded-2xl border border-areia-200 bg-white p-5 shadow-[var(--shadow-card)]">
            <span className={`flex size-10 items-center justify-center rounded-xl ${tone}`}><I className="size-5" /></span>
            <p className="mt-4 text-sm text-ink-500">{label}</p>
            <p className="font-display text-2xl font-extrabold">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Últimos pedidos</h2>
            <Link href="/admin/pedidos" className="text-sm font-semibold text-brand-600 hover:underline">Ver todos</Link>
          </div>
          <OrdersList orders={orders.slice(0, 6)} />
        </section>
        <section className="rounded-2xl border border-areia-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-extrabold">Mais vendidos</h2>
          <ul className="space-y-4">
            {top.map((p) => (
              <li key={p.id}>
                <div className="flex justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{p.title}</span>
                  <span className="shrink-0 tabular-nums text-ink-500">{p.soldCount.toLocaleString("pt-BR")}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-areia-100">
                  <div className="h-2 rounded-full bg-gradient-to-r from-sol-400 to-sol-600" style={{ width: `${(p.soldCount / topMax) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
