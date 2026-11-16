import { NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/orders/store";
import { isPaymentSimulated } from "@/lib/payments";

/** Aprova um pagamento simulado. Só funciona quando o Mercado Pago NÃO está configurado. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isPaymentSimulated()) return NextResponse.json({ error: "Indisponível" }, { status: 404 });
  const ok = await markOrderPaid((await params).id, null);
  return NextResponse.json({ ok });
}
