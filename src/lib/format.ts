import { store } from "./config";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(cents: number): string {
  return brl.format(cents / 100);
}

export function pixPrice(cents: number): number {
  return Math.round(cents * (1 - store.pixDiscountPercent / 100));
}

export function discountPercent(price: number, compareAt?: number | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round((1 - price / compareAt) * 100);
}

/** Maior nº de parcelas sem juros respeitando a parcela mínima. */
export function installments(cents: number): { count: number; value: number } {
  const count = Math.max(
    1,
    Math.min(store.maxInstallments, Math.floor(cents / store.minInstallmentCents)),
  );
  return { count, value: Math.ceil(cents / count) };
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
