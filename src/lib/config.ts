export const store = {
  name: "Magazine Cazé",
  shortName: "Cazé",
  tagline: "Conhecimento e oportunidades do Nordeste para o Brasil",
  description:
    "Cursos preparatórios para ENEM e concursos, cursos profissionalizantes, e-books, sistemas e achadinhos com entrega rápida. Pague com Pix ou em até 12x.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  supportEmail: "contato@magazinecaze.com.br",
  whatsapp: "5585999999999",
  cnpj: "00.000.000/0001-00",
  city: "Fortaleza – CE",
  maxInstallments: 12,
  /** Parcelas sem juros a partir deste valor por parcela (centavos). */
  minInstallmentCents: 1000,
  pixDiscountPercent: 5,
  freeShippingFromCents: 19900,
} as const;

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
);

export const isMercadoPagoConfigured = Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN?.trim());

/** Modo demonstração: sem banco nem gateway configurados, a loja roda com dados de exemplo. */
export const isDemoMode = !isSupabaseConfigured;
