import { store } from "@/lib/config";
import type { Order } from "@/lib/orders/types";
import { buildBrCode } from "./brcode";
import type { PaymentProvider } from "./types";

/**
 * Provedor SIMULADO: gera Pix de demonstração e permite aprovar o pagamento
 * pelo botão "Simular pagamento" na página do pedido. Nunca use em produção.
 */
export const mockProvider: PaymentProvider = {
  name: "demo",
  async createPix(order: Order) {
    return {
      paymentId: `demo-pix-${order.number}`,
      qrCode: buildBrCode({
        key: "demo@magazinecaze.com.br",
        name: store.name,
        city: "Fortaleza",
        amountCents: order.totalCents,
        txid: order.number,
      }),
      qrCodeBase64: null,
      expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
    };
  },
  async createCardCheckout(order: Order) {
    return { paymentId: `demo-card-${order.number}`, checkoutUrl: `/pedido/${order.id}?cartao=demo` };
  },
  async getPayment(id: string) {
    return { id, status: "pending", orderId: null };
  },
};
