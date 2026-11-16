import "server-only";
import { createPublicClient } from "@/lib/supabase/server";
import { categories as seedCategories, products as seedProducts } from "./seed";
import type { Category, Product, ProductQuery } from "./types";

/**
 * Camada de acesso ao catálogo. Lê do Supabase quando configurado;
 * caso contrário, usa o catálogo de exemplo (modo demonstração).
 */

type ProductRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  type: Product["type"];
  category_slug: string;
  price_cents: number;
  compare_at_cents: number | null;
  rating: number;
  reviews_count: number;
  sold_count: number;
  badge: string | null;
  cover_theme: Product["coverTheme"];
  cover_icon: string;
  image_url: string | null;
  highlights: string[];
  specs: Record<string, string>;
  stock: number | null;
  featured: boolean;
  active: boolean;
  delivery_path: string | null;
  created_at: string;
};

export function rowToProduct(r: ProductRow): Product {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    subtitle: r.subtitle,
    description: r.description,
    type: r.type,
    categorySlug: r.category_slug,
    priceCents: r.price_cents,
    compareAtCents: r.compare_at_cents,
    rating: Number(r.rating),
    reviewsCount: r.reviews_count,
    soldCount: r.sold_count,
    badge: r.badge,
    coverTheme: r.cover_theme,
    coverIcon: r.cover_icon,
    imageUrl: r.image_url,
    highlights: r.highlights ?? [],
    specs: r.specs ?? {},
    stock: r.stock,
    featured: r.featured,
    active: r.active,
    deliveryPath: r.delivery_path,
    createdAt: r.created_at,
  };
}

export function productToRow(p: Omit<Product, "id" | "createdAt">): Omit<ProductRow, "id" | "created_at"> {
  return {
    slug: p.slug,
    title: p.title,
    subtitle: p.subtitle,
    description: p.description,
    type: p.type,
    category_slug: p.categorySlug,
    price_cents: p.priceCents,
    compare_at_cents: p.compareAtCents,
    rating: p.rating,
    reviews_count: p.reviewsCount,
    sold_count: p.soldCount,
    badge: p.badge,
    cover_theme: p.coverTheme,
    cover_icon: p.coverIcon,
    image_url: p.imageUrl,
    highlights: p.highlights,
    specs: p.specs,
    stock: p.stock,
    featured: p.featured,
    active: p.active,
    delivery_path: p.deliveryPath,
  };
}

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function applyQuery(list: Product[], q: ProductQuery): Product[] {
  let out = list.filter((p) => p.active);
  if (q.category) out = out.filter((p) => p.categorySlug === q.category);
  if (q.type) out = out.filter((p) => p.type === q.type);
  if (q.maxPrice) out = out.filter((p) => p.priceCents <= q.maxPrice!);
  if (q.q) {
    const terms = normalize(q.q).split(/\s+/).filter(Boolean);
    out = out.filter((p) => {
      const hay = normalize(`${p.title} ${p.subtitle} ${p.description} ${p.categorySlug}`);
      return terms.every((t) => hay.includes(t));
    });
  }
  const sorters: Record<string, (a: Product, b: Product) => number> = {
    "mais-vendidos": (a, b) => b.soldCount - a.soldCount,
    "menor-preco": (a, b) => a.priceCents - b.priceCents,
    "maior-preco": (a, b) => b.priceCents - a.priceCents,
    avaliacao: (a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount,
    novidades: (a, b) => b.createdAt.localeCompare(a.createdAt),
    relevancia: (a, b) => Number(b.featured) - Number(a.featured) || b.soldCount - a.soldCount,
  };
  out = [...out].sort(sorters[q.sort ?? "relevancia"] ?? sorters.relevancia);
  return q.limit ? out.slice(0, q.limit) : out;
}

async function loadAllProducts(): Promise<Product[]> {
  const db = createPublicClient();
  if (!db) return seedProducts;
  const { data, error } = await db.from("products").select("*").eq("active", true);
  if (error) {
    console.error("[catalog] erro ao carregar produtos:", error.message);
    return [];
  }
  return (data as ProductRow[]).map(rowToProduct);
}

export async function getProducts(query: ProductQuery = {}): Promise<Product[]> {
  return applyQuery(await loadAllProducts(), query);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const db = createPublicClient();
  if (!db) return seedProducts.find((p) => p.slug === slug && p.active) ?? null;
  const { data } = await db.from("products").select("*").eq("slug", slug).eq("active", true).maybeSingle();
  return data ? rowToProduct(data as ProductRow) : null;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const db = createPublicClient();
  if (!db) return seedProducts.filter((p) => ids.includes(p.id) && p.active);
  const { data } = await db.from("products").select("*").in("id", ids).eq("active", true);
  return ((data ?? []) as ProductRow[]).map(rowToProduct);
}

export async function getCategories(): Promise<Category[]> {
  const db = createPublicClient();
  if (!db) return seedCategories;
  const { data } = await db.from("categories").select("*").order("position");
  return (data ?? []).map((c) => ({
    slug: c.slug,
    name: c.name,
    description: c.description,
    icon: c.icon,
    theme: c.theme,
  }));
}

export async function getCategory(slug: string): Promise<Category | null> {
  return (await getCategories()).find((c) => c.slug === slug) ?? null;
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const all = await getProducts({ category: product.categorySlug, sort: "mais-vendidos" });
  const related = all.filter((p) => p.id !== product.id);
  if (related.length >= limit) return related.slice(0, limit);
  const extra = (await getProducts({ sort: "mais-vendidos" })).filter(
    (p) => p.id !== product.id && !related.some((r) => r.id === p.id),
  );
  return [...related, ...extra].slice(0, limit);
}
