"use client";

import Image from "next/image";
import { useState } from "react";
import { catalogImageSource } from "@/lib/catalog/image-origins";
import type { Product, ProductImage } from "@/lib/catalog/types";
import { cn } from "@/lib/format";
import { ProductCover } from "./product-cover";

const hero = "aspect-[4/3] rounded-3xl shadow-[var(--shadow-card)]";

export function ProductGallery({ product, images }: {
  product: Pick<Product, "title" | "type" | "coverTheme" | "coverIcon" | "imageUrl">;
  images: ProductImage[];
}) {
  const [selected, setSelected] = useState(0);
  const byUrl = new Map(images.map((image) => [image.url, image]));
  const primary = product.imageUrl ? byUrl.get(product.imageUrl) ?? { url: product.imageUrl, alt: product.title } : null;
  const ordered = primary ? [primary, ...images.filter((image) => image.url !== primary.url)] : images;
  const valid = ordered.flatMap((image) => {
    const source = catalogImageSource(image.url);
    return source ? [{ ...source, alt: image.alt }] : [];
  });
  const current = valid[selected] ?? valid[0];
  if (!current) return <ProductCover product={product} size="hero" className={hero} />;

  return (
    <section aria-label="Galeria do produto">
      <div className={cn("relative overflow-hidden bg-areia-100", hero)}>
        <Image src={current.url} alt={current.alt} fill unoptimized={current.local}
          sizes="(min-width: 1024px) 50vw, 100vw" className="object-contain" />
      </div>
      {valid.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {valid.map((image, i) => (
            <button type="button" key={image.url} aria-label={`Ver imagem ${i + 1}: ${image.alt}`}
              aria-pressed={current === image} onClick={() => setSelected(i)}
              className="relative size-16 overflow-hidden rounded-lg border border-areia-200 aria-pressed:border-brand-700 aria-pressed:ring-1 aria-pressed:ring-brand-700">
              <Image src={image.url} alt="" fill unoptimized={image.local} sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
