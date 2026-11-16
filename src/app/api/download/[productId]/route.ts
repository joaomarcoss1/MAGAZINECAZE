import { NextResponse } from "next/server";
import { getProductsByIds } from "@/lib/catalog/repository";
import { getOrder } from "@/lib/orders/store";
import { createAdminClient } from "@/lib/supabase/server";
import { store } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * Entrega digital protegida. Exige um pedido PAGO que contenha o produto.
 * - Cursos com URL de área do aluno → redireciona.
 * - Arquivos (e-books/sistemas) → link assinado do Supabase Storage válido por 2 minutos.
 */
export async function GET(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const orderId = new URL(req.url).searchParams.get("pedido") ?? "";
  const order = await getOrder(orderId);
  if (!order || order.status !== "paid" || !order.items.some((i) => i.productId === productId)) {
    return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 });
  }
  const [product] = await getProductsByIds([productId]);
  if (!product?.deliveryPath) return NextResponse.json({ error: "Produto sem entrega digital" }, { status: 404 });

  if (/^https?:\/\//.test(product.deliveryPath)) return NextResponse.redirect(product.deliveryPath);

  const db = createAdminClient();
  if (!db) {
    const text = `${store.name}\n\nArquivo de DEMONSTRAÇÃO de "${product.title}".\nPedido ${order.number} — licenciado para ${order.customer.name} (${order.customer.email}).\n\nEm produção, aqui seria entregue o arquivo real guardado no Supabase Storage.`;
    return new NextResponse(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${product.slug}-demo.txt"`,
      },
    });
  }
  const { data, error } = await db.storage.from("digital").createSignedUrl(product.deliveryPath, 120, { download: true });
  if (error || !data) return NextResponse.json({ error: "Arquivo indisponível" }, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
