import { CreditCard, Download, Headset, QrCode } from "lucide-react";
import { store } from "@/lib/config";

const items = [
  { icon: QrCode, title: `${store.pixDiscountPercent}% OFF no Pix`, text: "Aprovação em segundos" },
  { icon: CreditCard, title: `Até ${store.maxInstallments}x sem juros`, text: "Em todos os cartões" },
  { icon: Download, title: "Acesso imediato", text: "Produtos digitais na hora" },
  { icon: Headset, title: "Atendimento humano", text: "Pelo WhatsApp, de seg. a sáb." },
];

export function Benefits() {
  return (
    <div className="grid grid-cols-2 divide-areia-200 rounded-2xl border border-areia-200 bg-white shadow-[var(--shadow-card)] lg:grid-cols-4 lg:divide-x">
      {items.map(({ icon: I, title, text }) => (
        <div key={title} className="flex items-center gap-3 p-4 sm:p-5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-mandacaru-50 text-mandacaru-600">
            <I className="size-5.5" />
          </span>
          <div>
            <p className="text-sm font-bold text-ink-900">{title}</p>
            <p className="text-xs text-ink-500">{text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
