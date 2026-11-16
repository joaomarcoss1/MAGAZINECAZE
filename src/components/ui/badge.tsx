import { cn } from "@/lib/format";

const tones = {
  sol: "bg-sol-500 text-white",
  caja: "bg-caja-400 text-ink-900",
  mandacaru: "bg-mandacaru-100 text-mandacaru-700",
  brand: "bg-brand-100 text-brand-800",
  coral: "bg-coral-500 text-white",
  neutral: "bg-areia-200 text-ink-700",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = "brand",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function badgeTone(label: string): BadgeTone {
  const l = label.toLowerCase();
  if (l.includes("vendido")) return "sol";
  if (l.includes("oferta")) return "coral";
  if (l.includes("frete")) return "mandacaru";
  if (l.includes("novo")) return "caja";
  return "brand";
}
