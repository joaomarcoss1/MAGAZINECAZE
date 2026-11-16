import { ArrowRight, BadgeCheck, Star, Users } from "lucide-react";
import type { Product } from "@/lib/catalog/types";
import { ButtonLink } from "@/components/ui/button";
import { ProductCover } from "@/components/product/product-cover";
import { formatBRL } from "@/lib/format";
import Link from "next/link";

export function Hero({ spotlight }: { spotlight: Product[] }) {
  const [main, ...rest] = spotlight;
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950">
      {/* Sol decorativo */}
      <div className="pointer-events-none absolute -right-32 -top-40 size-[34rem] rounded-full bg-gradient-to-br from-caja-300/40 via-sol-500/25 to-transparent blur-2xl" />
      <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full text-areia-50" viewBox="0 0 1440 96" preserveAspectRatio="none" aria-hidden>
        <path fill="currentColor" d="M0 64c120-21 240-32 360-21s240 43 360 43 240-32 360-43 240 0 360 21v32H0z" />
      </svg>

      <div className="container-page relative grid items-center gap-10 pb-28 pt-12 lg:grid-cols-2 lg:pb-32 lg:pt-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-caja-200 ring-1 ring-white/15">
            <span className="size-1.5 rounded-full bg-caja-400" /> Feito no Nordeste, para todo o Brasil
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
            Seu próximo passo <span className="text-caja-400">começa aqui.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-brand-100">
            Preparatórios para ENEM e concursos, cursos que dão profissão, e-books e sistemas para o seu negócio.
            Acesso imediato depois do Pix.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/produtos?ordem=mais-vendidos" variant="buy" size="lg">
              Ver mais vendidos <ArrowRight className="size-5" />
            </ButtonLink>
            <ButtonLink href="/categoria/enem-vestibulares" size="lg" className="bg-white/10 ring-1 ring-white/25 hover:bg-white/20">
              Preparatório ENEM
            </ButtonLink>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 text-white">
            {[
              { icon: Users, v: "45 mil+", l: "alunos e clientes" },
              { icon: Star, v: "4,8/5", l: "avaliação média" },
              { icon: BadgeCheck, v: "7 dias", l: "de garantia" },
            ].map(({ icon: I, v, l }) => (
              <div key={l}>
                <I className="mb-1.5 size-5 text-caja-400" />
                <dt className="font-display text-xl font-extrabold">{v}</dt>
                <dd className="text-xs text-brand-200">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        {main && (
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <Link href={`/produto/${main.slug}`} className="group block">
              <ProductCover
                product={main}
                size="hero"
                contentClassName="pb-24 sm:pb-24"
                className="aspect-[5/4] rounded-3xl shadow-2xl ring-1 ring-white/20 transition duration-300 group-hover:-rotate-1 group-hover:scale-[1.01]"
              />
            </Link>
            <div className="absolute -bottom-6 left-4 right-4 flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-[var(--shadow-lift)] sm:left-8 sm:right-auto sm:min-w-80">
              <div>
                <p className="text-xs font-semibold text-sol-600">{main.badge ?? "Destaque"}</p>
                <p className="font-bold text-ink-900">{main.title}</p>
                <p className="text-sm text-ink-500">
                  por <strong className="text-ink-900">{formatBRL(main.priceCents)}</strong>
                </p>
              </div>
              <ButtonLink href={`/produto/${main.slug}`} variant="buy" size="sm">
                Quero
              </ButtonLink>
            </div>
            {rest[0] && (
              <Link
                href={`/produto/${rest[0].slug}`}
                className="absolute -right-3 -top-6 hidden w-36 rotate-6 transition hover:rotate-3 sm:block"
              >
                <ProductCover product={rest[0]} className="aspect-[3/4] rounded-2xl shadow-xl ring-4 ring-white/10" />
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
