import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getProductsByIds } from "@/lib/catalog/repository";
import { getOrder } from "@/lib/orders/store";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { isDemoMode, store } from "@/lib/config";
import { isProduction } from "@/lib/env";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };
const uuid = z.guid();
const denied = () => NextResponse.json({ error: "Acesso não autorizado." }, { status: 403, headers });

export async function GET(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const orderId = new URL(req.url).searchParams.get("pedido") ?? "";
  const demo = isDemoMode && !isProduction(process.env);
  const db = createAdminClient();

  if (!demo) {
    if (!uuid.safeParse(orderId).success || !uuid.safeParse(productId).success || !db) return denied();
    const session = await createClient();
    const user = session && (await session.auth.getUser()).data.user;
    if (!user) return denied();

    const order = await getOrder(orderId);
    const guestEmail = user.email_confirmed_at && user.confirmation_sent_at && user.email?.toLowerCase();
    if (order?.status !== "paid" ||
      (order.userId ? order.userId !== user.id : !guestEmail || guestEmail !== order.customer.email.toLowerCase()) ||
      !order.items.some((item) => item.productId === productId && item.type !== "fisico")) return denied();

    const [product] = await getProductsByIds([productId]);
    if (!product?.deliveryPath) return unavailable(404);
    let destination: string;
    if (/^https?:\/\//i.test(product.deliveryPath)) {
      destination = product.deliveryPath;
    } else {
      const { data, error } = await db.storage.from("digital").createSignedUrl(product.deliveryPath, 120, { download: true });
      if (error || !data) return unavailable(error?.message.toLowerCase().includes("not found") ? 404 : 503);
      destination = data.signedUrl;
    }

    const source = process.env.VERCEL === "1" ? "x-vercel-forwarded-for" : "x-real-ip";
    const ip = req.headers.get(source)?.split(",")[0].trim() ?? "";
    const { data, error } = await db.rpc("record_digital_delivery", {
      p_order: orderId, p_product: productId, p_user: user.id, p_ip: isIP(ip) ? ip : null,
    });
    if (error) return unavailable(503);
    if (data === "limit") return NextResponse.json({ error: "Limite de 10 acessos atingido. Fale com o suporte." }, { status: 429, headers });
    if (data !== "allowed") return denied();
    return NextResponse.redirect(destination, { headers });
  }

  const order = await getOrder(orderId);
  if (order?.status !== "paid" || !order.items.some((item) => item.productId === productId && item.type !== "fisico")) return denied();
  const [product] = await getProductsByIds([productId]);
  if (!product?.deliveryPath) return unavailable(404);
  return new NextResponse(`${store.name}\n\nArquivo de demonstração de "${product.title}".\nPedido ${order.number}.`, {
    headers: { ...headers, "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${product.slug}-demo.txt"` },
  });
}

function unavailable(status: number) {
  return NextResponse.json({ error: "Entrega indisponível." }, { status, headers });
}
