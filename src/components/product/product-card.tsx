import Link from "next/link";
import type { Product } from "@/lib/catalog/types";
import { isDigital } from "@/lib/catalog/types";
import { Badge, badgeTone } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { Rating } from "@/components/ui/rating";
import { ProductCover } from "./product-cover";
import { AddToCartButton } from "./add-to-cart-button";
import { Download, Truck } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-areia-200 bg-white shadow-[var(--shadow-card)] transition duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
      <Link href={`/produto/${product.slug}`} className="relative block" aria-label={product.title}>
        <ProductCover product={product} hideLabel={Boolean(product.badge)} className="aspect-[4/3] transition duration-300 group-hover:brightness-105" />
        {product.badge && (
          <Badge tone={badgeTone(product.badge)} className="absolute left-3 top-3 shadow-sm">
            {product.badge}
          </Badge>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Rating value={product.rating} count={product.reviewsCount} />
        <Link href={`/produto/${product.slug}`} className="after:absolute after:inset-0 after:content-['']">
          <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-ink-900 group-hover:text-brand-700">
            {product.title}
          </h3>
        </Link>
        <p className="line-clamp-2 text-xs text-ink-500">{product.subtitle}</p>
        <div className="mt-auto pt-2">
          <Price priceCents={product.priceCents} compareAtCents={product.compareAtCents} />
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-mandacaru-600">
          {isDigital(product) ? (
            <>
              <Download className="size-3.5" /> Acesso imediato
            </>
          ) : (
            <>
              <Truck className="size-3.5" /> Envio com rastreio
            </>
          )}
        </div>
        <AddToCartButton product={product} className="relative z-10 mt-1 w-full" size="sm" />
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export function ProductRail({ products }: { products: Product[] }) {
  return (
    <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
      {products.map((p) => (
        <div key={p.id} className="w-[72%] shrink-0 snap-start sm:w-[42%] lg:w-auto">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
}
