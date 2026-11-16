import { store } from "./config";

/**
 * Frete fixo do MVP para produtos físicos.
 * Próximo passo: integrar Melhor Envio / Correios para cálculo por CEP.
 */
export const FLAT_SHIPPING_CENTS = 1990;

export function shippingFor(subtotalCents: number): number {
  return subtotalCents >= store.freeShippingFromCents ? 0 : FLAT_SHIPPING_CENTS;
}
