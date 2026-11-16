"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const options = [
  ["relevancia", "Mais relevantes"],
  ["mais-vendidos", "Mais vendidos"],
  ["menor-preco", "Menor preço"],
  ["maior-preco", "Maior preço"],
  ["avaliacao", "Melhor avaliados"],
  ["novidades", "Novidades"],
] as const;

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <label className="flex items-center gap-2 text-sm text-ink-500">
      Ordenar por
      <select
        value={value}
        onChange={(e) => {
          const sp = new URLSearchParams(params);
          sp.set("ordem", e.target.value);
          router.push(`${pathname}?${sp}`);
        }}
        className="h-10 rounded-xl border border-ink-200 bg-white px-3 font-medium text-ink-900 focus:border-brand-500 focus:outline-none"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
