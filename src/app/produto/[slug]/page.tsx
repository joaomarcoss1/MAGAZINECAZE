import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, CheckCircle2, Download, Lock, QrCode, RotateCcw, Truck, Users } from "lucide-react";
import { getCategory, getProductBySlug, getProducts, getRelatedProducts } from "@/lib/catalog/repository";
import { isDigital, productTypeLabel } from "@/lib/catalog/types";
import { store } from "@/lib/config";
import { formatBRL, pixPrice } from "@/lib/format";
import { ProductCover } from "@/components/product/product-cover";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { ProductRail } from "@/components/product/product-card";
import { Badge, badgeTone } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { Rating } from "@/components/ui/rating";
import { SectionTitle } from "@/components/ui/section-title";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return {};
  return { title: p.title, description: p.subtitle, openGraph: { title: p.title, description: p.subtitle } };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();
  const [category, related] = await Promise.all([
    getCategory(product.categorySlug),
    getRelatedProducts(product),
  ]);
  const digital = isDigital(product);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.subtitle,
    aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewsCount },
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: (product.priceCents / 100).toFixed(2),
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <div className="container-page py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="mb-6 text-xs text-ink-500" aria-label="Trilha">
        <Link href="/" className="hover:text-brand-700">Início</Link> <span className="mx-1">/</span>
        {category && (
          <>
            <Link href={`/categoria/${category.slug}`} className="hover:text-brand-700">{category.name}</Link>
            <span className="mx-1">/</span>
          </>
        )}
        <span className="text-ink-700">{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] xl:grid-cols-[1.2fr_1fr]">
        <div>
          <ProductCover product={product} size="hero" className="aspect-[4/3] rounded-3xl shadow-[var(--shadow-card)]" />
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
            {[
              { icon: Lock, t: "Compra 100% segura" },
              { icon: RotateCcw, t: "7 dias de garantia" },
              { icon: digital ? Download : Truck, t: digital ? "Acesso imediato" : "Envio com rastreio" },
            ].map(({ icon: I, t }) => (
              <div key={t} className="flex flex-col items-center gap-1.5 rounded-xl bg-white p-3 font-medium text-ink-700 ring-1 ring-areia-200">
                <I className="size-5 text-brand-500" /> {t}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{productTypeLabel[product.type]}</Badge>
            {product.badge && <Badge tone={badgeTone(product.badge)}>{product.badge}</Badge>}
          </div>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight text-ink-900 sm:text-4xl">{product.title}</h1>
          <p className="mt-2 text-lg text-ink-500">{product.subtitle}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
            <Rating value={product.rating} count={product.reviewsCount} size="md" />
            <span className="flex items-center gap-1 text-sm text-ink-500">
              <Users className="size-4" /> {product.soldCount.toLocaleString("pt-BR")} vendidos
            </span>
          </div>

          <div className="mt-6 rounded-2xl border border-areia-200 bg-white p-6 shadow-[var(--shadow-card)]">
            <Price priceCents={product.priceCents} compareAtCents={product.compareAtCents} size="lg" />
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-mandacaru-50 p-3 text-sm text-mandacaru-700">
              <QrCode className="size-5 shrink-0" />
              <span>
                Pagando com Pix você economiza{" "}
                <strong>{formatBRL(product.priceCents - pixPrice(product.priceCents))}</strong> ({store.pixDiscountPercent}% OFF).
              </span>
            </div>
            <div className="mt-5 grid gap-3">
              <AddToCartButton product={product} buyNow size="lg" className="w-full" />
              <AddToCartButton product={product} size="lg" className="w-full" />
            </div>
            {product.stock !== null && product.stock < 30 && (
              <p className="mt-3 text-center text-sm font-semibold text-coral-600">
                Restam apenas {product.stock} unidades!
              </p>
            )}
          </div>

          <ul className="mt-6 space-y-2.5">
            {product.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2.5 text-sm text-ink-700">
                <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-mandacaru-500" /> {h}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-areia-200 bg-white p-6 sm:p-8">
          <h2 className="text-xl font-extrabold">Sobre este produto</h2>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-ink-700">{product.description}</p>
        </section>
        <section className="rounded-2xl border border-areia-200 bg-white p-6 sm:p-8">
          <h2 className="text-xl font-extrabold">Ficha técnica</h2>
          <dl className="mt-4 divide-y divide-areia-200 text-sm">
            {Object.entries(product.specs).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5">
                <dt className="text-ink-500">{k}</dt>
                <dd className="text-right font-semibold text-ink-900">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex gap-3 rounded-xl bg-brand-50 p-4 text-sm text-brand-800">
            <BadgeCheck className="size-5 shrink-0" />
            <p>
              Garantia incondicional de 7 dias (art. 49 do CDC). Não gostou? Devolvemos 100% do valor.
            </p>
          </div>
        </section>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <SectionTitle title="Quem viu este, também comprou" />
          <ProductRail products={related} />
        </section>
      )}
    </div>
  );
}
