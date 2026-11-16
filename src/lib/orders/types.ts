import type { ProductType } from "@/lib/catalog/types";
import type { Address, Customer } from "@/lib/validators";

export type OrderStatus = "pending" | "paid" | "cancelled" | "refunded" | "expired";
export type PaymentMethod = "pix" | "card";

export interface OrderItem {
  productId: string;
  slug: string;
  title: string;
  type: ProductType;
  unitPriceCents: number;
  quantity: number;
}

export interface PixData {
  qrCode: string;
  qrCodeBase64: string | null;
  expiresAt: string;
}

export interface Order {
  id: string;
  number: string;
  status: OrderStatus;
  userId: string | null;
  customer: Customer;
  shippingAddress: Address | null;
  items: OrderItem[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  paymentMethod: PaymentMethod;
  paymentId: string | null;
  pix: PixData | null;
  checkoutUrl: string | null;
  createdAt: string;
  paidAt: string | null;
}

export const orderStatusLabel: Record<OrderStatus, string> = {
  pending: "Aguardando pagamento",
  paid: "Pago",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  expired: "Expirado",
};
