import { Star } from "lucide-react";
import { cn } from "@/lib/format";

export function Rating({
  value,
  count,
  size = "sm",
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
}) {
  const s = size === "sm" ? "size-3.5" : "size-4.5";
  return (
    <div className="flex items-center gap-1" aria-label={`Nota ${value.toFixed(1)} de 5`}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(s, i <= Math.round(value) ? "fill-caja-400 text-caja-400" : "fill-ink-200 text-ink-200")}
          />
        ))}
      </div>
      <span className={cn("font-semibold text-ink-700", size === "sm" ? "text-xs" : "text-sm")}>
        {value.toFixed(1)}
      </span>
      {count !== undefined && (
        <span className={cn("text-ink-400", size === "sm" ? "text-xs" : "text-sm")}>
          ({count.toLocaleString("pt-BR")})
        </span>
      )}
    </div>
  );
}
