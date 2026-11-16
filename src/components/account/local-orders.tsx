"use client";
import { useEffect, useState } from "react";
import { Library, OrdersList, type OrderSummaryDTO } from "./orders-list";

/** Modo demonstração: pedidos guardados neste navegador. */
export function LocalOrders() {
  const [orders, setOrders] = useState<OrderSummaryDTO[] | null>(null);
  useEffect(() => {
    let ids: string[] = [];
    try {
      ids = JSON.parse(localStorage.getItem("caze-orders") ?? "[]");
    } catch {}
    Promise.all(
      ids.map((id) =>
        fetch(`/api/pedidos/${id}`, { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ),
    ).then((list) => setOrders(list.filter(Boolean)));
  }, []);

  if (!orders) return <div className="h-40 animate-pulse rounded-2xl bg-areia-100" />;
  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-4 text-xl font-extrabold">Meus produtos</h2>
        <Library orders={orders} />
      </section>
      <section>
        <h2 className="mb-4 text-xl font-extrabold">Meus pedidos</h2>
        <OrdersList orders={orders} />
      </section>
    </div>
  );
}
