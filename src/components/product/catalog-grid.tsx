"use client";

import { useState } from "react";
import { loadCatalogPage } from "@/app/produtos/catalog-actions";
import { pageSize, type CatalogParams } from "@/lib/catalog/pagination";
import type { Product } from "@/lib/catalog/types";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "./product-card";

export function CatalogGrid({ initial, page, total, filters }: {
  initial: Product[];
  page: number;
  total: number;
  filters: CatalogParams;
}) {
  const [loaded, setLoaded] = useState({ products: initial, page, total });
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function more() {
    if (loading) return;
    setLoading(true);
    setFailed(false);
    try {
      const next = loaded.page + 1;
      const result = await loadCatalogPage({ ...filters, pagina: String(next) });
      const known = new Set(loaded.products.map((product) => product.id));
      setLoaded({ products: [...loaded.products, ...result.products.filter((product) => !known.has(product.id))],
        page: next, total: result.total });
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ProductGrid products={loaded.products} />
      <div className="mt-6 space-y-2 text-center sm:hidden">
        {loaded.page * pageSize < loaded.total && (
          <Button variant="outline" disabled={loading} onClick={more}>
            {loading ? "Carregando…" : "Carregar mais"}
          </Button>
        )}
        {failed && <p role="alert" className="text-sm">Não foi possível carregar mais produtos. Tente novamente.</p>}
      </div>
    </>
  );
}
