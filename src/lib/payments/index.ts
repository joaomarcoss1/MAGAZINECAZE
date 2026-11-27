import "server-only";
import { isProduction } from "@/lib/env";
import { mercadoPagoProvider } from "./mercadopago";
import { mockProvider } from "./mock";
import type { PaymentProvider } from "./types";

export function getPaymentProvider(): PaymentProvider {
  if (isPaymentSimulated()) return mockProvider;
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN?.trim()) throw new Error("Mercado Pago indisponível.");
  return mercadoPagoProvider;
}

export const isPaymentSimulated = () => !isProduction(process.env) && !process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
