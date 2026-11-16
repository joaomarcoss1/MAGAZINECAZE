import Link from "next/link";
import { Download, PlayCircle, Package } from "lucide-react";
import type { OrderItem, OrderStatus } from "@/lib/orders/types";
import { orderStatusLabel } from "@/lib/orders/types";
import { cn, formatBRL, formatDate } from "@/lib/format";

export type OrderSummaryDTO = {
  id: string;
  number: string;
  status: OrderStatus;
  totalCents: number;
  createdAt: string;
  items: OrderItem[];
};

const statusTone: Record<OrderStatus, string> = {
  paid: "bg-mandacaru-100 text-mandacaru-700",
  pending: "bg-caja-100 text-caja-600",
  cancelled: "bg-coral-50 text-coral-600",
  refunded: "bg-areia-200 text-ink-700",
  expired: "bg-areia-200 text-ink-500",
};

export function Library({ orders }: { orders: OrderSummaryDTO[] }) {
  const items = orders
    .filter((o) => o.status === "paid")
    .flatMap((o) => o.items.filter((i) => i.type !== "fisico").map((i) => ({ ...i, orderId: o.id })));
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-areia-300 bg-white p-8 text-center text-sm text-ink-500">
        Seus cursos, e-books e sistemas aparecem aqui depois do pagamento.{" "}
        <Link href="/produtos" className="font-semibold text-brand-600 hover:underline">Explorar a loja</Link>
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => {
        const isCourse = i.type === "curso" || i.type === "preparatorio";
        return (
          <div key={`${i.orderId}-${i.productId}`} className="flex flex-col rounded-2xl border border-areia-200 bg-white p-5 shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{isCourse ? "Curso" : i.type === "ebook" ? "E-book" : "Sistema"}</p>
            <p className="mt-1 flex-1 font-bold">{i.title}</p>
            <a
              href={`/api/download/${i.productId}?pedido=${i.orderId}`}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-mandacaru-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-mandacaru-600"
            >
              {isCourse ? <PlayCircle className="size-4" /> : <Download className="size-4" />}
              {isCourse ? "Acessar" : "Baixar"}
            </a>
          </div>
        );
      })}
    </div>
  );
}

export function OrdersList({ orders }: { orders: OrderSummaryDTO[] }) {
  if (!orders.length) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-areia-300 bg-white p-10 text-center">
        <Package className="size-10 text-ink-200" />
        <p className="mt-3 font-semibold">Você ainda não fez pedidos.</p>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-areia-200 overflow-hidden rounded-2xl border border-areia-200 bg-white">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/pedido/${o.id}`} className="flex flex-wrap items-center gap-4 p-4 transition hover:bg-areia-50">
            <div className="min-w-0 flex-1">
              <p className="font-bold">{o.number}</p>
              <p className="truncate text-sm text-ink-500">{o.items.map((i) => i.title).join(", ")}</p>
            </div>
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", statusTone[o.status])}>{orderStatusLabel[o.status]}</span>
            <div className="text-right">
              <p className="font-display font-extrabold">{formatBRL(o.totalCents)}</p>
              <p className="text-xs text-ink-400">{formatDate(o.createdAt)}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
