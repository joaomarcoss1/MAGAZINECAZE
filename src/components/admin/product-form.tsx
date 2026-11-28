"use client";
import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Category, CoverTheme, Product, ProductType } from "@/lib/catalog/types";
import { productTypeLabel } from "@/lib/catalog/types";
import { saveProduct, type SaveState } from "@/app/admin/produtos/actions";
import { inputClass } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductCover } from "@/components/product/product-cover";
import { iconNames } from "@/components/ui/icon";

const themes: CoverTheme[] = ["atlantico", "sol", "caja", "mandacaru", "coral", "noite"];
const money = (c: number | null | undefined) => (c ? (c / 100).toFixed(2).replace(".", ",") : "");

function L({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>
      {children}
    </label>
  );
}

export function ProductForm({ product, categories, readOnly }: { product: Product | null; categories: Category[]; readOnly: boolean }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveProduct, {});
  const [preview, setPreview] = useState({
    title: product?.title ?? "Novo produto",
    type: (product?.type ?? "curso") as ProductType,
    coverTheme: (product?.coverTheme ?? "atlantico") as CoverTheme,
    coverIcon: product?.coverIcon ?? "graduation-cap",
    imageUrl: product?.imageUrl ?? null,
  });

  return (
    <form action={action} className="grid gap-8 xl:grid-cols-[1fr_300px]">
      {product && <input type="hidden" name="id" value={product.id} />}
      <fieldset disabled={readOnly || pending} className="grid gap-5 rounded-2xl border border-areia-200 bg-white p-6 sm:grid-cols-2">
        <L label="Título" className="sm:col-span-2">
          <input name="title" defaultValue={product?.title} required className={inputClass} onChange={(e) => setPreview({ ...preview, title: e.target.value })} />
        </L>
        <L label="Subtítulo" className="sm:col-span-2"><input name="subtitle" defaultValue={product?.subtitle} required className={inputClass} /></L>
        <L label="Descrição" className="sm:col-span-2">
          <textarea name="description" defaultValue={product?.description} required rows={5} className={`${inputClass} h-auto py-3`} />
        </L>
        <L label="Tipo">
          <select name="type" defaultValue={product?.type ?? "curso"} className={inputClass} onChange={(e) => setPreview({ ...preview, type: e.target.value as ProductType })}>
            {Object.entries(productTypeLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </L>
        <L label="Categoria">
          <select name="categorySlug" defaultValue={product?.categorySlug} className={inputClass}>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </L>
        <L label="Preço (R$)"><input name="price" inputMode="decimal" defaultValue={money(product?.priceCents)} required placeholder="97,00" className={inputClass} /></L>
        <L label="Preço “de” (opcional)"><input name="compareAt" inputMode="decimal" defaultValue={money(product?.compareAtCents)} placeholder="197,00" className={inputClass} /></L>
        <L label="Selo (opcional)"><input name="badge" defaultValue={product?.badge ?? ""} placeholder="Mais vendido, Oferta, Novo..." className={inputClass} /></L>
        <L label="Estoque (só físicos)"><input name="stock" type="number" min={0} defaultValue={product?.stock ?? ""} className={inputClass} /></L>
        <L label="Tema da capa">
          <select name="coverTheme" defaultValue={preview.coverTheme} className={inputClass} onChange={(e) => setPreview({ ...preview, coverTheme: e.target.value as CoverTheme })}>
            {themes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </L>
        <L label="Ícone da capa">
          <select name="coverIcon" defaultValue={preview.coverIcon} className={inputClass} onChange={(e) => setPreview({ ...preview, coverIcon: e.target.value })}>
            {iconNames.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </L>
        <L label="URL da imagem (opcional — substitui a capa gerada)" className="sm:col-span-2">
          <input name="imageUrl" type="url" defaultValue={product?.imageUrl ?? ""} className={inputClass} onChange={(e) => setPreview({ ...preview, imageUrl: e.target.value || null })} />
        </L>
        <L label="Destaques (um por linha)"><textarea name="highlights" rows={4} defaultValue={product?.highlights.join("\n")} className={`${inputClass} h-auto py-3`} /></L>
        <L label="Ficha técnica (Campo: valor, um por linha)">
          <textarea name="specs" rows={4} defaultValue={Object.entries(product?.specs ?? {}).map(([k, v]) => `${k}: ${v}`).join("\n")} className={`${inputClass} h-auto py-3`} />
        </L>
        <L label="Entrega digital: caminho no Storage (bucket “digital”) ou URL da área do aluno" className="sm:col-span-2">
          <input name="deliveryPath" defaultValue={product?.deliveryPath ?? ""} placeholder="ebooks/renda-extra.pdf  ou  https://alunos.seudominio.com/curso" className={inputClass} />
        </L>
        <L label="Status">
          <select name="status" defaultValue={product?.status ?? (product?.active ? "active" : "draft")} className={inputClass}>
            <option value="draft">Rascunho</option><option value="active">Ativo</option><option value="archived">Arquivado</option>
          </select>
        </L>
        <L label="Publicar a partir de (UTC)">
          <input name="publishAt" type="datetime-local" defaultValue={product?.publishAt ? new Date(product.publishAt).toISOString().slice(0, 16) : ""} className={inputClass} />
        </L>
        <L label="SKU"><input name="sku" maxLength={80} defaultValue={product?.sku ?? ""} className={inputClass} /></L>
        <L label="Título para buscadores"><input name="seoTitle" maxLength={120} defaultValue={product?.seoTitle ?? ""} className={inputClass} /></L>
        <L label="Descrição para buscadores" className="sm:col-span-2">
          <textarea name="seoDescription" maxLength={320} rows={3} defaultValue={product?.seoDescription ?? ""} className={`${inputClass} h-auto py-3`} />
        </L>
        <div className="flex gap-6 text-sm font-medium sm:col-span-2">
          <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={product?.featured} className="size-4 accent-brand-600" /> Destaque na home</label>
        </div>
      </fieldset>
      <aside className="space-y-4">
        <p className="text-sm font-semibold text-ink-500">Prévia da capa</p>
        <ProductCover product={preview} className="aspect-[4/3] rounded-2xl" />
        {state.error && <p className="rounded-lg bg-coral-50 p-3 text-sm text-coral-600">{state.error}</p>}
        {readOnly ? (
          <p className="rounded-xl bg-caja-100 p-3 text-sm">Configure o Supabase para salvar produtos.</p>
        ) : (
          <Button type="submit" variant="buy" className="w-full" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />} Salvar produto
          </Button>
        )}
      </aside>
    </form>
  );
}
