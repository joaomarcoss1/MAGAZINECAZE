import Image from "next/image";
import { catalogImageSource } from "@/lib/catalog/image-origins";
import type { CoverTheme, Product } from "@/lib/catalog/types";
import { productTypeLabel } from "@/lib/catalog/types";
import { cn } from "@/lib/format";
import { Icon } from "@/components/ui/icon";

/** Gradientes das capas geradas — derivados da paleta da marca. */
export const coverThemes: Record<CoverTheme, { bg: string; accent: string; text: string }> = {
  atlantico: { bg: "from-brand-500 via-brand-700 to-brand-950", accent: "text-caja-300", text: "text-white" },
  sol: { bg: "from-caja-400 via-sol-500 to-sol-700", accent: "text-white", text: "text-white" },
  caja: { bg: "from-caja-200 via-caja-400 to-sol-400", accent: "text-sol-700", text: "text-ink-900" },
  mandacaru: { bg: "from-mandacaru-500 via-mandacaru-600 to-brand-900", accent: "text-caja-300", text: "text-white" },
  coral: { bg: "from-sol-300 via-coral-500 to-sol-800", accent: "text-caja-200", text: "text-white" },
  noite: { bg: "from-brand-800 via-brand-950 to-ink-900", accent: "text-sol-400", text: "text-white" },
};

/**
 * Capa do produto. Usa a imagem quando houver; senão gera uma capa
 * elegante e consistente com a identidade visual (sem depender de banco de imagens).
 */
export function ProductCover({
  product,
  size = "card",
  className,
  hideLabel = false,
  contentClassName,
}: {
  product: Pick<Product, "title" | "type" | "coverTheme" | "coverIcon" | "imageUrl">;
  size?: "card" | "hero" | "thumb";
  className?: string;
  /** Oculta o rótulo do tipo (ex.: quando um selo já ocupa o canto). */
  hideLabel?: boolean;
  contentClassName?: string;
}) {
  const source = catalogImageSource(product.imageUrl);
  if (source) {
    return (
      <div className={cn("relative overflow-hidden bg-areia-100", className)}>
        <Image
          src={source.url}
          unoptimized={source.local}
          alt={product.title}
          fill
          sizes={size === "hero" ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
          className="object-cover"
        />
      </div>
    );
  }

  const t = coverThemes[product.coverTheme] ?? coverThemes.atlantico;
  return (
    <div className={cn("relative isolate overflow-hidden bg-gradient-to-br", t.bg, className)}>
      {/* Motivo: sol nascente + ondas do litoral */}
      <svg className="absolute inset-0 -z-10 h-full w-full opacity-25" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <circle cx="160" cy="40" r="70" fill="none" stroke="white" strokeWidth="0.8" />
        <circle cx="160" cy="40" r="50" fill="none" stroke="white" strokeWidth="0.8" />
        <circle cx="160" cy="40" r="30" fill="white" fillOpacity="0.25" />
        <path d="M0 160 Q 25 148 50 160 T 100 160 T 150 160 T 200 160" fill="none" stroke="white" strokeWidth="1.2" />
        <path d="M0 175 Q 25 163 50 175 T 100 175 T 150 175 T 200 175" fill="none" stroke="white" strokeWidth="1.2" />
        <path d="M0 190 Q 25 178 50 190 T 100 190 T 150 190 T 200 190" fill="none" stroke="white" strokeWidth="1.2" />
      </svg>
      {size === "thumb" ? (
        <div className="flex h-full items-center justify-center">
          <Icon name={product.coverIcon} className={cn("size-1/2", t.accent)} />
        </div>
      ) : (
        <div className={cn("flex h-full flex-col justify-between", size === "hero" ? "p-8 sm:p-10" : "p-4", contentClassName)}>
          <span
            className={cn(
              hideLabel && "invisible",
              "w-fit rounded-full bg-white/20 font-semibold uppercase tracking-wider backdrop-blur-sm",
              t.text,
              size === "hero" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[10px]",
            )}
          >
            {productTypeLabel[product.type]}
          </span>
          <div>
            <Icon name={product.coverIcon} className={cn(t.accent, size === "hero" ? "mb-4 size-16" : "mb-2 size-9")} />
            <p
              className={cn(
                "font-display font-extrabold leading-tight drop-shadow-sm",
                t.text,
                size === "hero" ? "text-4xl sm:text-5xl" : "line-clamp-3 text-lg",
              )}
            >
              {product.title}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
