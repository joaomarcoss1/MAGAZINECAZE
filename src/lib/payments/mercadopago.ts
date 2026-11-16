import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { store } from "@/lib/config";
import type { Order } from "@/lib/orders/types";
import type { PaymentInfo, PaymentProvider, PaymentStatus } from "./types";

/**
 * Integração com o Mercado Pago via API REST (sem SDK):
 *  - Pix: pagamento transparente (QR Code exibido na nossa página).
 *  - Cartão: Checkout Pro (página segura do Mercado Pago, parcelamento em até 12x).
 * Docs: https://www.mercadopago.com.br/developers/pt/reference
 */
const API = "https://api.mercadopago.com";

async function mp<T>(path: string, init: RequestInit & { idempotencyKey?: string } = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      ...(init.idempotencyKey ? { "X-Idempotency-Key": init.idempotencyKey } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Mercado Pago ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
  }
  return body as T;
}

function mapStatus(s: string): PaymentStatus {
  switch (s) {
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "cancelled":
      return "cancelled";
    case "refunded":
    case "charged_back":
      return "refunded";
    default:
      return "pending";
  }
}

const notificationUrl = () => `${store.url}/api/webhooks/mercadopago`;

export const mercadoPagoProvider: PaymentProvider = {
  name: "mercadopago",

  async createPix(order: Order) {
    const [first, ...rest] = order.customer.name.split(" ");
    const expires = new Date(Date.now() + 30 * 60_000);
    const p = await mp<{
      id: number;
      point_of_interaction: { transaction_data: { qr_code: string; qr_code_base64: string } };
    }>("/v1/payments", {
      method: "POST",
      idempotencyKey: `pix-${order.id}`,
      body: JSON.stringify({
        transaction_amount: order.totalCents / 100,
        description: `Pedido ${order.number} — ${store.name}`,
        payment_method_id: "pix",
        external_reference: order.id,
        notification_url: notificationUrl(),
        date_of_expiration: expires.toISOString().replace("Z", "-00:00"),
        payer: {
          email: order.customer.email,
          first_name: first,
          last_name: rest.join(" ") || first,
          identification: { type: "CPF", number: order.customer.cpf },
        },
      }),
    });
    return {
      paymentId: String(p.id),
      qrCode: p.point_of_interaction.transaction_data.qr_code,
      qrCodeBase64: p.point_of_interaction.transaction_data.qr_code_base64,
      expiresAt: expires.toISOString(),
    };
  },

  async createCardCheckout(order: Order) {
    const pref = await mp<{ id: string; init_point: string }>("/checkout/preferences", {
      method: "POST",
      idempotencyKey: `pref-${order.id}`,
      body: JSON.stringify({
        external_reference: order.id,
        notification_url: notificationUrl(),
        statement_descriptor: "MAGAZINECAZE",
        items: order.items.map((i) => ({
          id: i.productId,
          title: i.title,
          quantity: i.quantity,
          unit_price: i.unitPriceCents / 100,
          currency_id: "BRL",
        })),
        shipments: order.shippingCents ? { cost: order.shippingCents / 100, mode: "not_specified" } : undefined,
        payer: { email: order.customer.email, name: order.customer.name },
        payment_methods: {
          installments: store.maxInstallments,
          excluded_payment_types: [{ id: "ticket" }],
        },
        back_urls: {
          success: `${store.url}/pedido/${order.id}`,
          pending: `${store.url}/pedido/${order.id}`,
          failure: `${store.url}/pedido/${order.id}?falha=1`,
        },
        auto_return: "approved",
      }),
    });
    return { paymentId: pref.id, checkoutUrl: pref.init_point };
  },

  async getPayment(paymentId: string): Promise<PaymentInfo> {
    const p = await mp<{ id: number; status: string; external_reference: string | null }>(
      `/v1/payments/${encodeURIComponent(paymentId)}`,
    );
    return { id: String(p.id), status: mapStatus(p.status), orderId: p.external_reference };
  },
};

/**
 * Valida a assinatura do webhook (cabeçalho x-signature).
 * https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
export function verifyMercadoPagoSignature(opts: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string;
}): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production"; // em produção, o segredo é obrigatório
  if (!opts.xSignature) return false;
  const parts = Object.fromEntries(
    opts.xSignature.split(",").map((kv) => kv.split("=").map((s) => s.trim()) as [string, string]),
  );
  if (!parts.ts || !parts.v1) return false;
  const manifest = `id:${opts.dataId.toLowerCase()};request-id:${opts.xRequestId ?? ""};ts:${parts.ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v1);
  return a.length === b.length && timingSafeEqual(a, b);
}
