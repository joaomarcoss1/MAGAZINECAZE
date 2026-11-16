import Link from "next/link";
import { ArrowRight, GraduationCap, Wrench } from "lucide-react";

export function PromoBanners() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Link
        href="/categoria/enem-vestibulares"
        className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-sol-500 to-sol-700 p-8 text-white shadow-[var(--shadow-card)]"
      >
        <GraduationCap className="absolute -bottom-6 -right-6 size-44 text-white/15 transition group-hover:scale-110" />
        <p className="text-xs font-bold uppercase tracking-widest text-caja-200">Rumo à federal</p>
        <h3 className="mt-2 max-w-xs text-3xl font-extrabold leading-tight">Preparatórios ENEM com até 50% OFF</h3>
        <span className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-sol-700">
          Aproveitar <ArrowRight className="size-4 transition group-hover:translate-x-1" />
        </span>
      </Link>
      <Link
        href="/categoria/profissionalizantes"
        className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-mandacaru-500 to-brand-900 p-8 text-white shadow-[var(--shadow-card)]"
      >
        <Wrench className="absolute -bottom-6 -right-6 size-44 text-white/15 transition group-hover:scale-110" />
        <p className="text-xs font-bold uppercase tracking-widest text-caja-300">Profissão nova em 2027</p>
        <h3 className="mt-2 max-w-xs text-3xl font-extrabold leading-tight">Cursos que viram renda, com certificado</h3>
        <span className="mt-6 inline-flex items-center gap-2 rounded-xl bg-caja-400 px-4 py-2.5 text-sm font-bold text-ink-900">
          Ver cursos <ArrowRight className="size-4 transition group-hover:translate-x-1" />
        </span>
      </Link>
    </div>
  );
}
