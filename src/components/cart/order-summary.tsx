import { store } from "@/lib/config";
import { formatBRL, installments, pixPrice } from "@/lib/format";

export function OrderSummary({
  subtotal,
  savings,
  shipping,
  children,
}: {
  subtotal: number;
  savings: number;
  shipping: number | null;
  children?: React.ReactNode;
}) {
  const total = subtotal + (shipping ?? 0);
  const inst = installments(total);
  return (
    <div className="rounded-2xl border border-areia-200 bg-white p-6 shadow-[var(--shadow-card)]">
      <h2 className="text-lg font-extrabold">Resumo do pedido</h2>
      <dl className="mt-4 space-y-2.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-500">Subtotal</dt>
          <dd className="font-semibold">{formatBRL(subtotal)}</dd>
        </div>
        {savings > 0 && (
          <div className="flex justify-between text-mandacaru-600">
            <dt>Você está economizando</dt>
            <dd className="font-semibold">-{formatBRL(savings)}</dd>
          </div>
        )}
        {shipping !== null && (
          <div className="flex justify-between">
            <dt className="text-ink-500">Frete</dt>
            <dd className="font-semibold">{shipping === 0 ? <span className="text-mandacaru-600">Grátis</span> : formatBRL(shipping)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-areia-200 pt-3 text-base">
          <dt className="font-bold">Total</dt>
          <dd className="font-display text-xl font-extrabold">{formatBRL(total)}</dd>
        </div>
        <p className="text-right text-xs text-ink-500">
          ou {inst.count}x de {formatBRL(inst.value)} sem juros
        </p>
        <p className="rounded-lg bg-mandacaru-50 p-2.5 text-center text-sm font-semibold text-mandacaru-700">
          {formatBRL(pixPrice(total))} no Pix ({store.pixDiscountPercent}% OFF)
        </p>
      </dl>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
