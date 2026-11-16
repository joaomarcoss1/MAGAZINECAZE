"use client";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { cartHasPhysical, cartSavings, cartSubtotal, useCart } from "@/store/cart";
import { productTypeLabel } from "@/lib/catalog/types";
import { formatBRL } from "@/lib/format";
import { shippingFor } from "@/lib/shipping";
import { ProductCover } from "@/components/product/product-cover";
import { ButtonLink } from "@/components/ui/button";
import { OrderSummary } from "./order-summary";
import { useHydrated } from "./use-hydrated";

export function CartView() {
  const { items, setQuantity, remove } = useCart();
  const hydrated = useHydrated();

  if (!hydrated) return <div className="h-64 animate-pulse rounded-2xl bg-areia-100" />;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-areia-300 bg-white py-20 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-areia-100">
          <ShoppingBag className="size-9 text-ink-400" />
        </span>
        <p className="mt-5 text-lg font-bold">Seu carrinho está vazio</p>
        <p className="mt-1 text-sm text-ink-500">Que tal começar pelos mais vendidos?</p>
        <ButtonLink href="/produtos?ordem=mais-vendidos" variant="buy" className="mt-6">
          Ver mais vendidos
        </ButtonLink>
      </div>
    );
  }

  const subtotal = cartSubtotal(items);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <ul className="space-y-3">
        {items.map((i) => (
          <li key={i.id} className="flex gap-4 rounded-2xl border border-areia-200 bg-white p-4">
            <Link href={`/produto/${i.slug}`} className="shrink-0">
              <ProductCover product={i} size="thumb" className="size-20 rounded-xl sm:size-24" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-xs font-medium text-ink-400">{productTypeLabel[i.type]}</span>
              <Link href={`/produto/${i.slug}`} className="font-bold leading-snug text-ink-900 hover:text-brand-700">
                {i.title}
              </Link>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                {i.type === "fisico" ? (
                  <div className="flex items-center rounded-lg border border-ink-200">
                    <button aria-label="Diminuir" className="p-2 hover:bg-areia-100" onClick={() => setQuantity(i.id, i.quantity - 1)}>
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{i.quantity}</span>
                    <button aria-label="Aumentar" className="p-2 hover:bg-areia-100" onClick={() => setQuantity(i.id, i.quantity + 1)}>
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-mandacaru-600">Acesso imediato após o pagamento</span>
                )}
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg font-extrabold">{formatBRL(i.priceCents * i.quantity)}</span>
                  <button aria-label="Remover" onClick={() => remove(i.id)} className="rounded-lg p-2 text-ink-400 hover:bg-coral-50 hover:text-coral-600">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <aside className="lg:sticky lg:top-40 lg:self-start">
        <OrderSummary
          subtotal={subtotal}
          savings={cartSavings(items)}
          shipping={cartHasPhysical(items) ? shippingFor(subtotal) : null}
        >
          <ButtonLink href="/checkout" variant="buy" size="lg" className="w-full">
            Finalizar compra
          </ButtonLink>
          <Link href="/produtos" className="mt-3 block text-center text-sm font-semibold text-brand-600 hover:underline">
            Continuar comprando
          </Link>
        </OrderSummary>
      </aside>
    </div>
  );
}
