import Link from "next/link";
import { Headset, UserRound } from "lucide-react";
import { getCategories } from "@/lib/catalog/repository";
import { store } from "@/lib/config";
import { formatBRL } from "@/lib/format";
import { Logo } from "./logo";
import { SearchBar } from "./search-bar";
import { CartButton } from "./cart-button";
import { Icon } from "@/components/ui/icon";

export async function Header() {
  const categories = await getCategories();
  return (
    <header className="sticky top-0 z-40">
      <div className="bg-brand-950 text-center text-xs font-medium text-brand-100">
        <div className="container-page flex h-8 items-center justify-center gap-2">
          <span className="text-caja-300">☀</span>
          <span>
            <strong className="text-white">{store.pixDiscountPercent}% OFF no Pix</strong> · Parcele em até{" "}
            {store.maxInstallments}x sem juros · Frete grátis acima de {formatBRL(store.freeShippingFromCents)}
          </span>
        </div>
      </div>

      <div className="bg-brand-700 shadow-md">
        <div className="container-page flex flex-wrap items-center gap-x-6 gap-y-3 py-3 lg:flex-nowrap">
          <Logo light />
          <SearchBar className="order-last w-full lg:order-none lg:flex-1" />
          <nav className="ml-auto flex items-center gap-1 lg:ml-0">
            <a
              href={`https://wa.me/${store.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-2 rounded-xl px-2 py-2 text-white transition hover:bg-white/10 xl:flex"
            >
              <Headset className="size-6" />
              <span className="text-left text-xs leading-tight">
                Atendimento
                <br />
                <strong className="text-sm">WhatsApp</strong>
              </span>
            </a>
            <Link
              href="/conta"
              className="flex items-center gap-2 rounded-xl px-2 py-2 text-white transition hover:bg-white/10"
            >
              <UserRound className="size-6" />
              <span className="hidden text-left text-xs leading-tight sm:block">
                Olá! Entre
                <br />
                <strong className="text-sm">Minha conta</strong>
              </span>
            </Link>
            <CartButton />
          </nav>
        </div>
      </div>

      <nav className="border-b border-areia-200 bg-white" aria-label="Categorias">
        <div className="container-page scrollbar-none flex h-11 items-center gap-1 overflow-x-auto">
          <Link
            href="/produtos?ordem=mais-vendidos"
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold text-sol-600 hover:bg-sol-50"
          >
            🔥 Mais vendidos
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/categoria/${c.slug}`}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-brand-50 hover:text-brand-800"
            >
              <Icon name={c.icon} className="size-4 text-brand-500" />
              {c.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
