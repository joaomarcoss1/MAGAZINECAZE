"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Copy, FlaskConical } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";

function Countdown({ expiresAt }: { expiresAt: string }) {
  const [left, setLeft] = useState(() => new Date(expiresAt).getTime() - Date.now());
  useEffect(() => {
    const t = setInterval(() => setLeft(new Date(expiresAt).getTime() - Date.now()), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  if (left <= 0) return <span className="text-coral-600">Código expirado</span>;
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return (
    <span>
      Expira em <strong className="tabular-nums">{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</strong>
    </span>
  );
}

export function SimulateButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <div className="mt-5 rounded-xl border border-dashed border-caja-500 bg-caja-100 p-4 text-sm">
      <p className="flex items-center justify-center gap-2 font-semibold text-ink-900">
        <FlaskConical className="size-4" /> Modo demonstração
      </p>
      <p className="mt-1 text-ink-700">Nenhum gateway configurado. Simule a aprovação para ver o fluxo completo.</p>
      <Button
        type="button"
        variant="primary"
        size="sm"
        className="mt-3"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          await fetch(`/api/pedidos/${orderId}/simular`, { method: "POST" });
          router.refresh();
        }}
      >
        Simular pagamento aprovado
      </Button>
    </div>
  );
}

export function PixPanel({
  code,
  qrImage,
  expiresAt,
  totalCents,
  orderId,
  simulated,
}: {
  code: string;
  qrImage: string;
  expiresAt: string;
  totalCents: number;
  orderId: string;
  simulated: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <section className="mt-8 grid items-center gap-8 rounded-3xl border border-areia-200 bg-white p-6 shadow-[var(--shadow-card)] sm:p-8 md:grid-cols-[280px_1fr]">
      <div className="mx-auto rounded-2xl bg-white p-3 ring-1 ring-areia-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrImage} alt="QR Code Pix" className="size-64" />
      </div>
      <div>
        <p className="text-sm font-semibold text-mandacaru-600">Pague com Pix</p>
        <p className="font-display text-4xl font-extrabold">{formatBRL(totalCents)}</p>
        <p className="mt-1 text-sm text-ink-500"><Countdown expiresAt={expiresAt} /></p>
        <ol className="mt-5 space-y-2 text-sm text-ink-700">
          <li className="flex gap-2"><span className="w-4 text-center font-bold text-brand-500">1</span> Abra o app do seu banco e escolha&nbsp;<strong>Pix</strong>.</li>
          <li className="flex gap-2"><span className="w-4 text-center font-bold text-brand-500">2</span> Escaneie o QR Code ou cole o código abaixo.</li>
          <li className="flex gap-2"><span className="w-4 text-center font-bold text-brand-500">3</span> Pronto! Esta página atualiza sozinha.</li>
        </ol>
        <div className="mt-5 flex gap-2">
          <input readOnly value={code} aria-label="Código Pix copia e cola" className="h-11 min-w-0 flex-1 truncate rounded-xl border border-ink-200 bg-areia-50 px-3 font-mono text-xs text-ink-500" />
          <Button
            type="button"
            variant="pix"
            onClick={async () => {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>
        </div>
        {simulated && <SimulateButton orderId={orderId} />}
      </div>
    </section>
  );
}

