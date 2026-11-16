import "server-only";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { products as seedProducts } from "@/lib/catalog/seed";
import type { Order, OrderItem } from "./types";

/**
 * Persistência de pedidos.
 * - Com Supabase: tabelas orders / order_items e a função SQL mark_order_paid (atômica e idempotente).
 * - Modo demonstração: memória do processo (some ao reiniciar o servidor).
 */

type Mem = { orders: Map<string, Order> };
const g = globalThis as unknown as { __cazeMem?: Mem };
const mem: Mem = (g.__cazeMem ??= { orders: new Map() });

export function newOrderNumber(): string {
  const t = Date.now().toString(36).toUpperCase().slice(-5);
  const r = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `CZ-${t}${r}`;
}

type OrderRow = {
  id: string;
  number: string;
  status: Order["status"];
  user_id: string | null;
  customer: Order["customer"];
  shipping_address: Order["shippingAddress"];
  subtotal_cents: number;
  discount_cents: number;
  shipping_cents: number;
  total_cents: number;
  payment_method: Order["paymentMethod"];
  payment_id: string | null;
  payment_data: { pix?: Order["pix"]; checkoutUrl?: string } | null;
  created_at: string;
  paid_at: string | null;
  order_items?: Array<{
    product_id: string;
    slug: string;
    title: string;
    type: OrderItem["type"];
    unit_price_cents: number;
    quantity: number;
  }>;
};

function rowToOrder(r: OrderRow): Order {
  return {
    id: r.id,
    number: r.number,
    status: r.status,
    userId: r.user_id,
    customer: r.customer,
    shippingAddress: r.shipping_address,
    items: (r.order_items ?? []).map((i) => ({
      productId: i.product_id,
      slug: i.slug,
      title: i.title,
      type: i.type,
      unitPriceCents: i.unit_price_cents,
      quantity: i.quantity,
    })),
    subtotalCents: r.subtotal_cents,
    discountCents: r.discount_cents,
    shippingCents: r.shipping_cents,
    totalCents: r.total_cents,
    paymentMethod: r.payment_method,
    paymentId: r.payment_id,
    pix: r.payment_data?.pix ?? null,
    checkoutUrl: r.payment_data?.checkoutUrl ?? null,
    createdAt: r.created_at,
    paidAt: r.paid_at,
  };
}

export async function createOrder(
  data: Omit<Order, "id" | "number" | "createdAt" | "paidAt" | "status" | "paymentId" | "pix" | "checkoutUrl">,
): Promise<Order> {
  const db = createAdminClient();
  if (!db) {
    const order: Order = {
      ...data,
      id: randomUUID(),
      number: newOrderNumber(),
      status: "pending",
      paymentId: null,
      pix: null,
      checkoutUrl: null,
      createdAt: new Date().toISOString(),
      paidAt: null,
    };
    mem.orders.set(order.id, order);
    return order;
  }

  const { data: row, error } = await db
    .from("orders")
    .insert({
      number: newOrderNumber(),
      status: "pending",
      user_id: data.userId,
      customer: data.customer,
      shipping_address: data.shippingAddress,
      subtotal_cents: data.subtotalCents,
      discount_cents: data.discountCents,
      shipping_cents: data.shippingCents,
      total_cents: data.totalCents,
      payment_method: data.paymentMethod,
    })
    .select("*")
    .single();
  if (error || !row) throw new Error(`Falha ao criar pedido: ${error?.message}`);

  const { error: itemsError } = await db.from("order_items").insert(
    data.items.map((i) => ({
      order_id: row.id,
      product_id: i.productId,
      slug: i.slug,
      title: i.title,
      type: i.type,
      unit_price_cents: i.unitPriceCents,
      quantity: i.quantity,
    })),
  );
  if (itemsError) throw new Error(`Falha ao salvar itens: ${itemsError.message}`);
  return { ...rowToOrder(row as OrderRow), items: data.items };
}

export async function attachPayment(
  orderId: string,
  payment: { paymentId: string; pix?: Order["pix"]; checkoutUrl?: string },
): Promise<void> {
  const db = createAdminClient();
  if (!db) {
    const o = mem.orders.get(orderId);
    if (o) mem.orders.set(orderId, { ...o, paymentId: payment.paymentId, pix: payment.pix ?? null, checkoutUrl: payment.checkoutUrl ?? null });
    return;
  }
  await db
    .from("orders")
    .update({ payment_id: payment.paymentId, payment_data: { pix: payment.pix, checkoutUrl: payment.checkoutUrl } })
    .eq("id", orderId);
}

export async function getOrder(id: string): Promise<Order | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = createAdminClient();
  if (!db) return mem.orders.get(id) ?? null;
  const { data } = await db.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  return data ? rowToOrder(data as OrderRow) : null;
}

export async function listOrders(opts: { userId?: string; email?: string; limit?: number } = {}): Promise<Order[]> {
  const db = createAdminClient();
  if (!db) {
    return [...mem.orders.values()]
      .filter((o) => (!opts.email || o.customer.email === opts.email))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, opts.limit ?? 100);
  }
  let q = db.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(opts.limit ?? 100);
  if (opts.userId && opts.email) q = q.or(`user_id.eq.${opts.userId},customer->>email.eq.${opts.email}`);
  else if (opts.userId) q = q.eq("user_id", opts.userId);
  const { data } = await q;
  return ((data ?? []) as OrderRow[]).map(rowToOrder);
}

/**
 * Marca como pago de forma idempotente (webhooks podem chegar repetidos),
 * libera os produtos digitais e atualiza vendas/estoque.
 * Retorna true apenas na primeira confirmação.
 */
export async function markOrderPaid(orderId: string, paymentId: string | null): Promise<boolean> {
  const db = createAdminClient();
  if (!db) {
    const o = mem.orders.get(orderId);
    if (!o || o.status !== "pending") return false;
    mem.orders.set(orderId, { ...o, status: "paid", paidAt: new Date().toISOString(), paymentId: paymentId ?? o.paymentId });
    for (const item of o.items) {
      const p = seedProducts.find((s) => s.id === item.productId);
      if (p) {
        p.soldCount += item.quantity;
        if (p.stock !== null) p.stock = Math.max(0, p.stock - item.quantity);
      }
    }
    return true;
  }
  const { data, error } = await db.rpc("mark_order_paid", { p_order: orderId, p_payment: paymentId });
  if (error) throw new Error(`mark_order_paid: ${error.message}`);
  return Boolean(data);
}

export async function setOrderStatus(orderId: string, status: Order["status"]): Promise<void> {
  const db = createAdminClient();
  if (!db) {
    const o = mem.orders.get(orderId);
    if (o && o.status === "pending") mem.orders.set(orderId, { ...o, status });
    return;
  }
  await db.from("orders").update({ status }).eq("id", orderId).eq("status", "pending");
}
