import { Quote } from "lucide-react";
import { Rating } from "@/components/ui/rating";

// Depoimentos de EXEMPLO — substitua por depoimentos reais (com autorização dos clientes).
const items = [
  { name: "Ana Beatriz", city: "Caruaru – PE", text: "Estudei pelo preparatório no celular, no ônibus pra escola. Passei em Enfermagem na UFPE!" },
  { name: "José Erivaldo", city: "Mossoró – RN", text: "Fiz o curso de eletricista e hoje tenho minha própria clientela. O certificado ajudou demais." },
  { name: "Francisca Lima", city: "Teresina – PI", text: "O kit MEI organizou meu caixa. Pix aprovou na hora e já baixei tudo." },
];

export function Testimonials() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((t) => (
        <figure key={t.name} className="relative rounded-2xl border border-areia-200 bg-white p-6 shadow-[var(--shadow-card)]">
          <Quote className="absolute right-5 top-5 size-8 text-caja-300" />
          <Rating value={5} />
          <blockquote className="mt-3 text-sm leading-relaxed text-ink-700">“{t.text}”</blockquote>
          <figcaption className="mt-4 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">
              {t.name[0]}
            </span>
            <span>
              <span className="block text-sm font-bold text-ink-900">{t.name}</span>
              <span className="block text-xs text-ink-500">{t.city}</span>
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
