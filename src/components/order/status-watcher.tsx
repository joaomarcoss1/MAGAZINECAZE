"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Consulta o status a cada 4s e atualiza a página quando o pagamento é confirmado. */
export function StatusWatcher({ orderId }: { orderId: string }) {
  const router = useRouter();
  useEffect(() => {
    let stopped = false;
    const tick = async () => {
      try {
        const r = await fetch(`/api/pedidos/${orderId}`, { cache: "no-store" });
        const d = await r.json();
        if (!stopped && d.status && d.status !== "pending") {
          router.refresh();
          return;
        }
      } catch {}
      if (!stopped) timer = setTimeout(tick, 4000);
    };
    let timer = setTimeout(tick, 4000);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [orderId, router]);
  return null;
}
