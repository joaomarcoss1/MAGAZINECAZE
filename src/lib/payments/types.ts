import type { Order } from "@/lib/orders/types";

export interface PixCharge {
  paymentId: string;
  qrCode: string; // Pix copia e cola
  qrCodeBase64: string | null;
  expiresAt: string;
}

export interface CardCheckout {
  paymentId: string;
  checkoutUrl: string;
}

export type PaymentStatus = "pending" | "approved" | "rejected" | "cancelled" | "refunded";

export interface PaymentInfo {
  id: string;
  status: PaymentStatus;
  orderId: string | null;
}

export interface PaymentProvider {
  readonly name: string;
  createPix(order: Order): Promise<PixCharge>;
  createCardCheckout(order: Order): Promise<CardCheckout>;
  getPayment(paymentId: string): Promise<PaymentInfo>;
}
