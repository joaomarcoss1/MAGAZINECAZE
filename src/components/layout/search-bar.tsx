"use client";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      role="search"
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const term = q.trim();
        router.push(term ? `/produtos?q=${encodeURIComponent(term)}` : "/produtos");
      }}
    >
      <div className="flex h-11 w-full items-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 focus-within:ring-4 focus-within:ring-caja-300">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          placeholder="Busque por ENEM, concursos, e-books, cursos..."
          aria-label="Buscar produtos"
          className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Buscar"
          className="flex h-full w-12 items-center justify-center bg-caja-400 text-ink-900 transition hover:bg-caja-500"
        >
          <Search className="size-5" />
        </button>
      </div>
    </form>
  );
}
