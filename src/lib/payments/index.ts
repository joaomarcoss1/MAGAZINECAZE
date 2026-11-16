import "server-only";
import { isMercadoPagoConfigured } from "@/lib/config";
import { mercadoPagoProvider } from "./mercadopago";
import { mockProvider } from "./mock";
import type { PaymentProvider } from "./types";

export function getPaymentProvider(): PaymentProvider {
  return isMercadoPagoConfigured ? mercadoPagoProvider : mockProvider;
}

export const isPaymentSimulated = () => !isMercadoPagoConfigured;
