import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { CheckCircle2, Clock, Download, PlayCircle, Truck, XCircle } from "lucide-react";
import { getOrder } from "@/lib/orders/store";
import { orderStatusLabel } from "@/lib/orders/types";
import { isPaymentSimulated } from "@/lib/payments";
import { isDemoMode } from "@/lib/config";
import { getCurrentUser } from "@/lib/auth";
import { formatBRL, formatDate } from "@/lib/format";
import { PixPanel, SimulateButton } from "@/components/order/pix-panel";
import { StatusWatcher } from "@/components/order/status-watcher";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Seu pedido", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const order = await getOrder((await params).id);
  if (!order) notFound();

  const pending = order.status === "pending";
  const paid = order.status === "paid";
  const user = paid && !isDemoMode ? await getCurrentUser() : null;
  const canOpen = isDemoMode || (user && (order.userId ? order.userId === user.id : user.email.toLowerCase() === order.customer.email.toLowerCase()));
  const simulated = isPaymentSimulated();
  const qrImage =
    pending && order.pix
      ? order.pix.qrCodeBase64
        ? `data:image/png;base64,${order.pix.qrCodeBase64}`
        : await QRCode.toDataURL(order.pix.qrCode, { margin: 1, width: 320, color: { dark: "#0a2c47" } })
      : null;

  return (
    <div className="container-page max-w-4xl py-10">
      {pending && <StatusWatcher orderId={order.id} />}

      <div className="text-center">
        {paid ? (
          <CheckCircle2 className="mx-auto size-16 text-mandacaru-500" />
        ) : pending ? (
          <Clock className="mx-auto size-16 text-caja-500" />
        ) : (
          <XCircle className="mx-auto size-16 text-coral-500" />
        )}
        <h1 className="mt-4 text-3xl font-extrabold">
          {paid ? "Pagamento aprovado! 🎉" : pending ? "Quase lá! Finalize o pagamento" : orderStatusLabel[order.status]}
        </h1>
        <p className="mt-2 text-ink-500">
          Pedido <strong className="text-ink-900">{order.number}</strong> · {formatDate(order.createdAt)}
        </p>
      </div>

      {pending && order.paymentMethod === "pix" && order.pix && qrImage && (
        <PixPanel code={order.pix.qrCode} qrImage={qrImage} expiresAt={order.pix.expiresAt} totalCents={order.totalCents} orderId={order.id} simulated={simulated} />
      )}

      {pending && order.paymentMethod === "card" && (
        <div className="mt-8 rounded-2xl border border-areia-200 bg-white p-6 text-center">
          <p className="text-ink-700">Estamos aguardando a confirmação do cartão pelo Mercado Pago.</p>
          {order.checkoutUrl && !simulated && (
            <ButtonLink href={order.checkoutUrl} variant="buy" className="mt-4">Voltar ao pagamento</ButtonLink>
          )}
          {simulated && <SimulateButton orderId={order.id} />}
        </div>
      )}

      <section className="mt-8 rounded-2xl border border-areia-200 bg-white p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-extrabold">{paid ? "Seus produtos" : "Itens do pedido"}</h2>
        <ul className="mt-4 divide-y divide-areia-200">
          {order.items.map((i) => (
            <li key={i.productId} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-semibold">{i.quantity > 1 && `${i.quantity}× `}{i.title}</p>
                <p className="text-sm text-ink-500">{formatBRL(i.unitPriceCents * i.quantity)}</p>
              </div>
              {paid &&
                (i.type === "fisico" ? (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-brand-600">
                    <Truck className="size-4" /> Em separação
                  </span>
                ) : canOpen ? (
                  <a
                    href={`/api/download/${i.productId}?pedido=${order.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-mandacaru-500 px-4 py-2 text-sm font-semibold text-white hover:bg-mandacaru-600"
                  >
                    {i.type === "curso" || i.type === "preparatorio" ? <PlayCircle className="size-4" /> : <Download className="size-4" />}
                    {i.type === "curso" || i.type === "preparatorio" ? "Acessar curso" : "Baixar"}
                  </a>
                ) : (
                  <Link href="/entrar?next=/conta" className="font-semibold text-brand-700 underline">Entre na conta para acessar</Link>
                ))}
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t border-areia-200 pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-ink-500">Subtotal</dt><dd>{formatBRL(order.subtotalCents)}</dd></div>
          {order.discountCents > 0 && (
            <div className="flex justify-between text-mandacaru-600"><dt>Desconto Pix</dt><dd>-{formatBRL(order.discountCents)}</dd></div>
          )}
          {order.shippingCents > 0 && (
            <div className="flex justify-between"><dt className="text-ink-500">Frete</dt><dd>{formatBRL(order.shippingCents)}</dd></div>
          )}
          <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{formatBRL(order.totalCents)}</dd></div>
        </dl>
      </section>

      <p className="mt-6 text-center text-sm text-ink-500">
        Enviamos os detalhes para <strong>{order.customer.email}</strong>. Seus produtos também ficam em{" "}
        <Link href="/conta" className="font-semibold text-brand-600 hover:underline">Minha conta</Link>.
      </p>
    </div>
  );
}
