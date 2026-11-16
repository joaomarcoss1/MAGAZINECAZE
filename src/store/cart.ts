"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/lib/catalog/types";

export type CartItem = Pick<
  Product,
  "id" | "slug" | "title" | "type" | "priceCents" | "compareAtCents" | "coverTheme" | "coverIcon" | "imageUrl"
> & { quantity: number };

type CartState = {
  items: CartItem[];
  add: (p: Product | CartItem, qty?: number) => void;
  setQuantity: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

/** Itens digitais só fazem sentido com quantidade 1. */
const maxQty = (type: Product["type"]) => (type === "fisico" ? 10 : 1);

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (p, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.id === p.id);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.id === p.id ? { ...i, quantity: Math.min(maxQty(i.type), i.quantity + qty) } : i,
              ),
            };
          }
          const item: CartItem = {
            id: p.id,
            slug: p.slug,
            title: p.title,
            type: p.type,
            priceCents: p.priceCents,
            compareAtCents: p.compareAtCents,
            coverTheme: p.coverTheme,
            coverIcon: p.coverIcon,
            imageUrl: p.imageUrl,
            quantity: Math.min(maxQty(p.type), qty),
          };
          return { items: [...s.items, item] };
        }),
      setQuantity: (id, qty) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, Math.min(maxQty(i.type), qty)) } : i)),
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    { name: "caze-cart", version: 1 },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((n, i) => n + i.priceCents * i.quantity, 0);
export const cartSavings = (items: CartItem[]) =>
  items.reduce((n, i) => n + Math.max(0, (i.compareAtCents ?? i.priceCents) - i.priceCents) * i.quantity, 0);
export const cartHasPhysical = (items: CartItem[]) => items.some((i) => i.type === "fisico");
