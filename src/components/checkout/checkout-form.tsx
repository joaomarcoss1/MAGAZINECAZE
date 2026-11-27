"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreditCard, Loader2, Lock, MapPin, QrCode, UserRound } from "lucide-react";
import { cartHasPhysical, cartSavings, cartSubtotal, useCart } from "@/store/cart";
import { store } from "@/lib/config";
import { cn, formatBRL, installments, pixPrice } from "@/lib/format";
import { shippingFor } from "@/lib/shipping";
import { Field } from "@/components/ui/input";
import { Button, ButtonLink } from "@/components/ui/button";
import { ProductCover } from "@/components/product/product-cover";
import { OrderSummary } from "@/components/cart/order-summary";
import { useHydrated } from "@/components/cart/use-hydrated";
import { maskCEP, maskCPF, maskPhone } from "./masks";

import { Turnstile, challengeEnabled } from "@/components/security/turnstile";

type Errors = Record<string, string[] | undefined>;

function Step({ n, title, icon: I, children }: { n: number; title: string; icon: typeof UserRound; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-areia-200 bg-white p-6 shadow-[var(--shadow-card)]">
      <h2 className="mb-5 flex items-center gap-3 text-lg font-extrabold">
        <span className="flex size-8 items-center justify-center rounded-full bg-brand-700 text-sm text-white">{n}</span>
        {title}
        <I className="ml-auto size-5 text-ink-400" />
      </h2>
      {children}
    </section>
  );
}

export function CheckoutForm() {
  const hydrated = useHydrated();
  const router = useRouter();
  const { items, clear } = useCart();
  const [method, setMethod] = useState<"pix" | "card">("pix");
  const [captchaToken, setCaptchaToken] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [c, setC] = useState({ name: "", email: "", cpf: "", phone: "" });
  const [a, setA] = useState({ cep: "", street: "", number: "", complement: "", district: "", city: "", state: "" });

  if (!hydrated) return <div className="h-96 animate-pulse rounded-2xl bg-areia-100" />;
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-areia-300 bg-white py-16 text-center">
        <p className="font-bold">Seu carrinho está vazio.</p>
        <ButtonLink href="/produtos" variant="buy" className="mt-4">Ver produtos</ButtonLink>
      </div>
    );
  }

  const physical = cartHasPhysical(items);
  const subtotal = cartSubtotal(items);
  const shipping = physical ? shippingFor(subtotal) : 0;
  const total = (method === "pix" ? pixPrice(subtotal) : subtotal) + shipping;
  const err = (k: string) => errors[k]?.[0];

  async function lookupCep(cep: string) {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const d = await r.json();
      if (!d.erro) setA((s) => ({ ...s, street: d.logradouro || s.street, district: d.bairro || s.district, city: d.localidade, state: d.uf }));
    } catch {
      /* preenchimento manual */
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrors({});
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
          customer: c,
          address: physical ? a : undefined,
          method,
          captchaToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível finalizar.");
        if (data.fields) {
          const flat: Errors = {};
          for (const [k, v] of Object.entries(data.fields as Record<string, unknown>)) {
            if (Array.isArray(v)) flat[k] = v as string[];
          }
          setErrors(flat);
        }
        return;
      }
      try {
        const saved = JSON.parse(localStorage.getItem("caze-orders") ?? "[]") as string[];
        localStorage.setItem("caze-orders", JSON.stringify([data.orderId, ...saved].slice(0, 50)));
      } catch {}
      clear();
      if (/^https?:/.test(data.redirect)) window.location.href = data.redirect;
      else router.push(data.redirect);
    } catch {
      setError("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setCaptchaToken(undefined);
      setAttempt((value) => value + 1);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_400px]" noValidate>
      <div className="space-y-5">
        <Step n={1} title="Seus dados" icon={UserRound}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" autoComplete="name" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} error={err("name")} className="sm:col-span-2" required />
            <Field label="E-mail" type="email" autoComplete="email" value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} error={err("email")} hint="Você recebe o acesso neste e-mail" required />
            <Field label="Celular (WhatsApp)" inputMode="tel" autoComplete="tel" value={c.phone} onChange={(e) => setC({ ...c, phone: maskPhone(e.target.value) })} error={err("phone")} required />
            <Field label="CPF" inputMode="numeric" value={c.cpf} onChange={(e) => setC({ ...c, cpf: maskCPF(e.target.value) })} error={err("cpf")} hint="Necessário para a nota fiscal" required />
          </div>
        </Step>

        {physical && (
          <Step n={2} title="Endereço de entrega" icon={MapPin}>
            <div className="grid gap-4 sm:grid-cols-6">
              <Field label="CEP" inputMode="numeric" autoComplete="postal-code" value={a.cep} onChange={(e) => { const v = maskCEP(e.target.value); setA({ ...a, cep: v }); lookupCep(v); }} className="sm:col-span-2" required />
              <Field label="Rua" autoComplete="address-line1" value={a.street} onChange={(e) => setA({ ...a, street: e.target.value })} className="sm:col-span-4" required />
              <Field label="Número" value={a.number} onChange={(e) => setA({ ...a, number: e.target.value })} className="sm:col-span-2" required />
              <Field label="Complemento" value={a.complement} onChange={(e) => setA({ ...a, complement: e.target.value })} className="sm:col-span-4" />
              <Field label="Bairro" value={a.district} onChange={(e) => setA({ ...a, district: e.target.value })} className="sm:col-span-2" required />
              <Field label="Cidade" value={a.city} onChange={(e) => setA({ ...a, city: e.target.value })} className="sm:col-span-3" required />
              <Field label="UF" maxLength={2} value={a.state} onChange={(e) => setA({ ...a, state: e.target.value.toUpperCase() })} className="sm:col-span-1" required />
            </div>
          </Step>
        )}

        <Step n={physical ? 3 : 2} title="Pagamento" icon={Lock}>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              { id: "pix", icon: QrCode, title: "Pix", desc: `${store.pixDiscountPercent}% OFF · aprovação na hora`, price: formatBRL(pixPrice(subtotal) + shipping) },
              { id: "card", icon: CreditCard, title: "Cartão de crédito", desc: `Até ${installments(subtotal + shipping).count}x sem juros`, price: formatBRL(subtotal + shipping) },
            ] as const).map((m) => (
              <label
                key={m.id}
                className={cn(
                  "relative flex cursor-pointer gap-3 rounded-xl border-2 p-4 transition",
                  method === m.id ? "border-brand-500 bg-brand-50" : "border-areia-200 hover:border-brand-200",
                )}
              >
                <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} className="sr-only" />
                <m.icon className={cn("size-6 shrink-0", m.id === "pix" ? "text-mandacaru-500" : "text-brand-500")} />
                <span>
                  <span className="block font-bold">{m.title}</span>
                  <span className="block text-xs text-ink-500">{m.desc}</span>
                  <span className="mt-1 block font-display font-extrabold">{m.price}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-4 text-xs text-ink-500">
            {method === "pix"
              ? "Após confirmar, mostramos o QR Code e o código copia e cola. O acesso é liberado assim que o pagamento é aprovado."
              : "Você será levado ao ambiente seguro do Mercado Pago para digitar os dados do cartão. Não armazenamos dados de cartão."}
          </p>
        </Step>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-40 lg:self-start">
        <OrderSummary subtotal={subtotal} savings={cartSavings(items)} shipping={physical ? shipping : null}>
          <ul className="mb-5 space-y-3 border-b border-areia-200 pb-5">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 text-sm">
                <ProductCover product={i} size="thumb" className="size-12 shrink-0 rounded-lg" />
                <span className="line-clamp-2 flex-1">{i.quantity > 1 && `${i.quantity}× `}{i.title}</span>
                <span className="font-semibold">{formatBRL(i.priceCents * i.quantity)}</span>
              </li>
            ))}
          </ul>
          {error && <p className="mb-3 rounded-lg bg-coral-50 p-3 text-sm text-coral-600" role="alert">{error}</p>}
          <Turnstile action="checkout" onToken={setCaptchaToken} attempt={attempt} />
          <Button type="submit" variant={method === "pix" ? "pix" : "buy"} size="lg" className="w-full" disabled={loading || (challengeEnabled && !captchaToken)}>
            {loading ? <Loader2 className="size-5 animate-spin" /> : <Lock className="size-4" />}
            {method === "pix" ? `Pagar ${formatBRL(total)} com Pix` : `Pagar ${formatBRL(total)} no cartão`}
          </Button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-400">
            Ao finalizar, você concorda com os <Link href="/ajuda/termos" className="underline">Termos de uso</Link> e a{" "}
            <Link href="/ajuda/privacidade" className="underline">Política de privacidade</Link>.
          </p>
        </OrderSummary>
      </aside>
    </form>
  );
}
