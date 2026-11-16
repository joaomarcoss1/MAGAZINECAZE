import Link from "next/link";
import { Plus } from "lucide-react";
import { getProducts } from "@/lib/catalog/repository";
import { productTypeLabel } from "@/lib/catalog/types";
import { formatBRL } from "@/lib/format";
import { ProductCover } from "@/components/product/product-cover";
import { ButtonLink } from "@/components/ui/button";

export default async function AdminProducts() {
  const products = await getProducts({ sort: "novidades" });
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Produtos</h1>
        <ButtonLink href="/admin/produtos/novo" variant="buy" size="sm"><Plus className="size-4" /> Novo produto</ButtonLink>
      </div>
      <ul className="divide-y divide-areia-200 overflow-hidden rounded-2xl border border-areia-200 bg-white">
        {products.map((p) => (
          <li key={p.id}>
            <Link href={`/admin/produtos/${p.id}`} className="flex items-center gap-4 p-3 hover:bg-areia-50">
              <ProductCover product={p} size="thumb" className="size-14 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.title}</p>
                <p className="text-xs text-ink-400">{productTypeLabel[p.type]} · {p.soldCount.toLocaleString("pt-BR")} vendidos{p.stock !== null && ` · estoque ${p.stock}`}</p>
              </div>
              <span className="font-display font-extrabold">{formatBRL(p.priceCents)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
