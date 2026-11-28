import "server-only";
import { createPublicClient } from "@/lib/supabase/server";
import { categories as seedCategories, products as seedProducts } from "./seed";
import { pageSize } from "./pagination";
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
  if (q.maxPrice !== undefined) out = out.filter((p) => p.priceCents <= q.maxPrice!);
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
    "maior-preco": (a, b) => b.priceCents - a.priceCents || b.id.localeCompare(a.id),
    avaliacao: (a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount,
    novidades: (a, b) => b.createdAt.localeCompare(a.createdAt),
    relevancia: (a, b) => Number(b.featured) - Number(a.featured) || b.soldCount - a.soldCount,
  };
  const sort = sorters[q.sort ?? "relevancia"] ?? sorters.relevancia;
  return out.sort((a, b) => sort(a, b) || a.id.localeCompare(b.id));
}

const columns = "id,slug,title,subtitle,description,type,category_slug,price_cents,compare_at_cents,rating,reviews_count,sold_count,badge,cover_theme,cover_icon,image_url,highlights,specs,stock,featured,active,created_at";

export async function getProductPage(query: ProductQuery = {}) {
  return fetchProducts(query, true);
}

export async function getProducts(query: ProductQuery = {}): Promise<Product[]> {
  return (await fetchProducts(query, false)).products;
}

async function fetchProducts(query: ProductQuery, count: boolean) {
  const limit = Math.min(500, Math.max(1, query.limit ?? pageSize));
  const from = ((query.page ?? 1) - 1) * limit;
  const db = createPublicClient();
  if (!db) {
    const all = applyQuery(seedProducts, query);
    return { products: all.slice(from, from + limit), total: all.length };
  }

  const options = count ? { count: "exact" as const } : undefined;
  let request = query.q
    ? db.rpc("search_catalog", { term: query.q }, options)
    : db.from("products").select(columns, options).eq("active", true);
  if (query.category) request = request.eq("category_slug", query.category);
  if (query.type) request = request.eq("type", query.type);
  if (query.maxPrice !== undefined) request = request.lte("price_cents", query.maxPrice);

  switch (query.sort) {
    case "mais-vendidos": request = request.order("sold_count", { ascending: false }); break;
    case "menor-preco": request = request.order("price_cents"); break;
    case "maior-preco": request = request.order("price_cents", { ascending: false }).order("id", { ascending: false }); break;
    case "avaliacao": request = request.order("rating", { ascending: false }).order("reviews_count", { ascending: false }); break;
    case "novidades": request = request.order("created_at", { ascending: false }); break;
    default: request = request.order("featured", { ascending: false }).order("sold_count", { ascending: false });
  }
  if (query.sort !== "maior-preco") request = request.order("id");
  const result = await request.select(columns).range(from, from + limit - 1);
  if (result.error && result.status !== 416) {
    console.error("[catalog]", result.error.code);
    throw new Error("Não foi possível carregar o catálogo.");
  }
  const products = ((result.data ?? []) as Omit<ProductRow, "delivery_path">[])
    .map((row) => rowToProduct({ ...row, delivery_path: null }));
  return { products, total: result.count ?? 0 };
}

export async function getSitemapProductSlugs() {
  const db = createPublicClient();
  if (!db) return seedProducts.filter((p) => p.active).map((p) => p.slug);
  const slugs: string[] = [];
  for (let from = 0; from < 5000; from += 500) {
    const result = await db.from("products").select("slug").eq("active", true).order("slug").range(from, from + 499);
    if (result.status === 416) break;
    if (result.error) throw new Error("Não foi possível carregar o sitemap.");
    slugs.push(...result.data.map((row) => row.slug));
    if (result.data.length < 500) break;
  }
  return slugs;
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
  const all = await getProducts({ category: product.categorySlug, sort: "mais-vendidos", limit: limit + 1 });
  const related = all.filter((p) => p.id !== product.id);
  if (related.length >= limit) return related.slice(0, limit);
  const extra = (await getProducts({ sort: "mais-vendidos", limit: limit * 2 + 1 })).filter(
    (p) => p.id !== product.id && !related.some((r) => r.id === p.id),
  );
  return [...related, ...extra].slice(0, limit);
}
