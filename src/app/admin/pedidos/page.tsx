import { listOrders } from "@/lib/orders/store";
import { orderStatusLabel } from "@/lib/orders/types";
import { formatBRL, formatDate } from "@/lib/format";
import Link from "next/link";

export default async function AdminOrders() {
  const orders = await listOrders({ limit: 200 });
  return (
    <div>
      <h1 className="mb-6 text-3xl font-extrabold">Pedidos</h1>
      <div className="overflow-x-auto rounded-2xl border border-areia-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-areia-100 text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Pagamento</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-areia-200">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-areia-50">
                <td className="px-4 py-3">
                  <Link href={`/pedido/${o.id}`} className="font-semibold text-brand-700 hover:underline">{o.number}</Link>
                  <p className="text-xs text-ink-400">{formatDate(o.createdAt)}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{o.customer.name}</p>
                  <p className="text-xs text-ink-400">{o.customer.email}</p>
                </td>
                <td className="px-4 py-3 uppercase text-ink-500">{o.paymentMethod === "pix" ? "Pix" : "Cartão"}</td>
                <td className="px-4 py-3">{orderStatusLabel[o.status]}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatBRL(o.totalCents)}</td>
              </tr>
            ))}
            {!orders.length && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-ink-400">Nenhum pedido ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
