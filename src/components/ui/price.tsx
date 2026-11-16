import { discountPercent, formatBRL, installments, pixPrice } from "@/lib/format";
import { cn } from "@/lib/format";

export function Price({
  priceCents,
  compareAtCents,
  size = "sm",
}: {
  priceCents: number;
  compareAtCents?: number | null;
  size?: "sm" | "lg";
}) {
  const off = discountPercent(priceCents, compareAtCents);
  const inst = installments(priceCents);
  const lg = size === "lg";
  return (
    <div>
      {compareAtCents && off ? (
        <div className={cn("flex items-center gap-2", lg ? "text-sm" : "text-xs")}>
          <span className="text-ink-400 line-through">{formatBRL(compareAtCents)}</span>
          <span className="rounded bg-mandacaru-100 px-1.5 py-0.5 font-bold text-mandacaru-700">-{off}%</span>
        </div>
      ) : null}
      <div className={cn("font-display font-extrabold text-ink-900", lg ? "text-4xl" : "text-xl")}>
        {formatBRL(priceCents)}
      </div>
      <div className={cn("text-ink-500", lg ? "text-sm" : "text-xs")}>
        {inst.count > 1 ? (
          <>
            em até <strong className="text-ink-700">{inst.count}x de {formatBRL(inst.value)}</strong> sem juros
          </>
        ) : (
          "à vista no cartão"
        )}
      </div>
      <div className={cn("font-semibold text-mandacaru-600", lg ? "mt-1 text-sm" : "text-xs")}>
        {formatBRL(pixPrice(priceCents))} no Pix
      </div>
    </div>
  );
}
