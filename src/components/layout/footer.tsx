import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import { store } from "@/lib/config";
import { Logo } from "./logo";

const groups = [
  {
    title: "Institucional",
    links: [
      { href: "/ajuda/sobre", label: "Sobre a Cazé" },
      { href: "/ajuda/termos", label: "Termos de uso" },
      { href: "/ajuda/privacidade", label: "Privacidade (LGPD)" },
    ],
  },
  {
    title: "Ajuda",
    links: [
      { href: "/ajuda/trocas-e-reembolso", label: "Trocas e reembolso" },
      { href: "/ajuda/entrega-digital", label: "Como recebo meu produto?" },
      { href: "/conta", label: "Meus pedidos" },
    ],
  },
  {
    title: "Categorias",
    links: [
      { href: "/categoria/enem-vestibulares", label: "ENEM e Vestibulares" },
      { href: "/categoria/concursos", label: "Concursos" },
      { href: "/categoria/profissionalizantes", label: "Profissionalizantes" },
      { href: "/categoria/ebooks", label: "E-books" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-20 bg-brand-950 text-brand-100">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <Logo light />
          <p className="max-w-xs text-sm text-brand-200">{store.tagline}.</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {["Pix", "Visa", "Master", "Elo", "Hipercard", "Boleto"].map((m) => (
              <span key={m} className="rounded-md bg-white/10 px-2 py-1 font-semibold text-white">
                {m}
              </span>
            ))}
          </div>
        </div>
        {groups.map((g) => (
          <div key={g.title}>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">{g.title}</h3>
            <ul className="space-y-2.5 text-sm">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-brand-200 transition hover:text-caja-300">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-3 py-6 text-xs text-brand-300 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {store.name} · CNPJ {store.cnpj} · {store.city}
          </p>
          <p className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Lock className="size-3.5" /> Site seguro (SSL)
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" /> 7 dias de garantia
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
