import { NextResponse } from "next/server";
import { markOrderPaid, setOrderStatus } from "@/lib/orders/store";
import { mercadoPagoProvider, verifyMercadoPagoSignature } from "@/lib/payments/mercadopago";
import { isMercadoPagoConfigured } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * Notificações do Mercado Pago. Nunca confiamos no corpo: buscamos o pagamento
 * na API do Mercado Pago e só então atualizamos o pedido (de forma idempotente).
 */
export async function POST(req: Request) {
  if (!isMercadoPagoConfigured) return NextResponse.json({ ok: true });
  const url = new URL(req.url);
  const body = (await req.json().catch(() => ({}))) as { type?: string; action?: string; data?: { id?: string | number } };
  const type = body.type ?? url.searchParams.get("type");
  const dataId = String(body.data?.id ?? url.searchParams.get("data.id") ?? "");
  if (type !== "payment" || !dataId) return NextResponse.json({ ignored: true });

  const valid = verifyMercadoPagoSignature({
    xSignature: req.headers.get("x-signature"),
    xRequestId: req.headers.get("x-request-id"),
    dataId: url.searchParams.get("data.id") ?? dataId,
  });
  if (!valid) return NextResponse.json({ error: "assinatura inválida" }, { status: 401 });

  try {
    const payment = await mercadoPagoProvider.getPayment(dataId);
    if (!payment.orderId) return NextResponse.json({ ignored: true });
    if (payment.status === "approved") {
      const first = await markOrderPaid(payment.orderId, payment.id);
      if (first) {
        // Próximo passo: enviar e-mail de confirmação (Resend) e emitir nota fiscal.
        console.info(`[webhook] pedido ${payment.orderId} pago`);
      }
    } else if (payment.status === "cancelled" || payment.status === "rejected") {
      await setOrderStatus(payment.orderId, "cancelled");
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook mercadopago]", err);
    // 500 faz o Mercado Pago reenviar a notificação depois.
    return NextResponse.json({ error: "erro" }, { status: 500 });
  }
}
