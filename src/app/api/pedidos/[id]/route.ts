import { NextResponse } from "next/server";
import { getOrder } from "@/lib/orders/store";

export const dynamic = "force-dynamic";

/**
 * Consulta de status (polling do Pix) e resumo do pedido.
 * O id é um UUID aleatório que funciona como link secreto do pedido;
 * por isso não devolvemos dados pessoais (CPF, telefone, endereço).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const order = await getOrder((await params).id);
  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  return NextResponse.json(
    {
      id: order.id,
      number: order.number,
      status: order.status,
      totalCents: order.totalCents,
      createdAt: order.createdAt,
      items: order.items,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
