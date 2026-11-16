import { NextResponse } from "next/server";
import { getProductsByIds } from "@/lib/catalog/repository";
import { store } from "@/lib/config";
import { pixPrice } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth";
import { attachPayment, createOrder } from "@/lib/orders/store";
import type { OrderItem } from "@/lib/orders/types";
import { getPaymentProvider } from "@/lib/payments";
import { shippingFor } from "@/lib/shipping";
import { checkoutSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const parsed = checkoutSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", fields: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  const input = parsed.data;

  // Preços SEMPRE recalculados no servidor a partir do catálogo — nunca confie no carrinho do navegador.
  const products = await getProductsByIds(input.items.map((i) => i.id));
  const items: OrderItem[] = [];
  for (const line of input.items) {
    const p = products.find((x) => x.id === line.id);
    if (!p) return NextResponse.json({ error: "Um dos produtos não está mais disponível." }, { status: 409 });
    const quantity = p.type === "fisico" ? line.quantity : 1;
    if (p.stock !== null && p.stock < quantity) {
      return NextResponse.json({ error: `Estoque insuficiente para ${p.title}.` }, { status: 409 });
    }
    items.push({ productId: p.id, slug: p.slug, title: p.title, type: p.type, unitPriceCents: p.priceCents, quantity });
  }

  const hasPhysical = items.some((i) => i.type === "fisico");
  if (hasPhysical && !input.address) {
    return NextResponse.json({ error: "Informe o endereço de entrega." }, { status: 422 });
  }

  const subtotal = items.reduce((n, i) => n + i.unitPriceCents * i.quantity, 0);
  const shipping = hasPhysical ? shippingFor(subtotal) : 0;
  const discount = input.method === "pix" ? subtotal - pixPrice(subtotal) : 0;
  const total = subtotal - discount + shipping;
  const user = await getCurrentUser();

  try {
    const order = await createOrder({
      userId: user?.id ?? null,
      customer: input.customer,
      shippingAddress: hasPhysical ? input.address! : null,
      items,
      subtotalCents: subtotal,
      discountCents: discount,
      shippingCents: shipping,
      totalCents: total,
      paymentMethod: input.method,
    });

    const provider = getPaymentProvider();
    if (input.method === "pix") {
      const pix = await provider.createPix(order);
      await attachPayment(order.id, { paymentId: pix.paymentId, pix });
      return NextResponse.json({ orderId: order.id, redirect: `/pedido/${order.id}` });
    }
    const card = await provider.createCardCheckout(order);
    await attachPayment(order.id, { paymentId: card.paymentId, checkoutUrl: card.checkoutUrl });
    return NextResponse.json({ orderId: order.id, redirect: card.checkoutUrl });
  } catch (err) {
    console.error("[checkout]", err);
    return NextResponse.json(
      { error: `Não foi possível processar o pagamento agora. Tente novamente ou fale com ${store.supportEmail}.` },
      { status: 502 },
    );
  }
}
