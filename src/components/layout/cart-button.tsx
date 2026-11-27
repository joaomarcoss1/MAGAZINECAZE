"use client";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useHydrated } from "@/components/cart/use-hydrated";
import { cartCount, useCart } from "@/store/cart";

export function CartButton() {
  const items = useCart((s) => s.items);
  const mounted = useHydrated();
  const count = mounted ? cartCount(items) : 0;

  return (
    <Link
      href="/carrinho"
      className="relative flex items-center gap-2 rounded-xl px-2 py-2 text-white transition hover:bg-white/10"
      aria-label={`Carrinho com ${count} ${count === 1 ? "item" : "itens"}`}
    >
      <ShoppingCart className="size-6" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-sol-500 text-[11px] font-bold text-white ring-2 ring-brand-700">
          {count}
        </span>
      )}
      <span className="hidden text-sm font-semibold lg:inline">Carrinho</span>
    </Link>
  );
}
