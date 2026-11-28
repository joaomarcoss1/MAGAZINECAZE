import "server-only";
import { unstable_cache } from "next/cache";
import { isDemoMode } from "@/lib/config";
import { catalogLifetime, catalogTag, productSlugTag, productTag } from "./cache-tags";
import { sitemapBlockSize, sitemapIds } from "./sitemap-blocks";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import { categories as seedCategories, products as seedProducts } from "./seed";
import { pageSize, priceRanges } from "./pagination";
import type { Category, Product, ProductImage, ProductQuery } from "./types";

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
  status?: Product["status"];
  publish_at?: string | null;
  sku?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
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
    status: r.status,
    publishAt: r.publish_at,
    sku: r.sku,
    seoTitle: r.seo_title,
    seoDescription: r.seo_description,
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
  if (q.attribute) return [];
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
  const standard = !query.q && !query.category && !query.attribute && query.maxPrice === undefined && !query.type && (query.page ?? 1) <= 250;
  return !isDemoMode && standard ? cachedProductPage(query, true) : fetchProducts(query, true);
}

export async function getAdminProductPage(page: number) {
  const db = await createClient();
  if (!db) return getProductPage({ sort: "novidades", page });
  const from = (page - 1) * pageSize;
  const result = await db.from("products").select(`${columns},status,publish_at`, { count: "exact" })
    .order("created_at", { ascending: false }).order("id").range(from, from + pageSize - 1);
  if (result.error && result.status !== 416) throw new Error("Não foi possível carregar os produtos.");
  const products = ((result.data ?? []) as Omit<ProductRow, "delivery_path">[])
    .map((row) => rowToProduct({ ...row, delivery_path: null }));
  return { products, total: result.count ?? 0 };
}

export async function getProducts(query: ProductQuery = {}): Promise<Product[]> {
  return (await (isDemoMode ? fetchProducts(query, false) : cachedProductPage(query, false))).products;
}

const cachedProductPage = unstable_cache(fetchProducts, ["catalog-list"], {
  tags: [catalogTag], revalidate: catalogLifetime,
});

async function fetchProducts(query: ProductQuery, count: boolean) {
  const limit = Math.min(500, Math.max(1, query.limit ?? pageSize));
  const from = ((query.page ?? 1) - 1) * limit;
  const db = createPublicClient();
  if (!db) {
    const all = applyQuery(seedProducts, query);
    return { products: all.slice(from, from + limit), total: all.length };
  }

  const options = count ? { count: "exact" as const } : undefined;
  let request = (query.q || query.category || query.attribute)
    ? db.rpc("catalog_matches", matchArgs(query), options)
    : db.from("products").select(columns, options).eq("active", true);
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

function matchArgs(query: ProductQuery) {
  return { term: query.q || null, category: query.category || null,
    attr_name: query.attribute?.name ?? null, attr_value: query.attribute?.value ?? null };
}

type Facet = { kind: "category" | "type" | "price" | "attribute"; facet: string; label: string; total: number };

export async function getCatalogFacets(query: ProductQuery): Promise<Facet[]> {
  const standard = !query.q && !query.category && !query.attribute && query.maxPrice === undefined && !query.type;
  return !isDemoMode && standard ? cachedFacets() : fetchCatalogFacets(query);
}

const cachedFacets = unstable_cache(() => fetchCatalogFacets({}), ["catalog-facets"], {
  tags: [catalogTag], revalidate: catalogLifetime,
});

async function fetchCatalogFacets(query: ProductQuery): Promise<Facet[]> {
  const db = createPublicClient();
  if (!db) {
    const count = (patch: ProductQuery) => applyQuery(seedProducts, { ...query, ...patch }).length;
    return [
      ...seedCategories.map((c) => ({ kind: "category" as const, facet: c.slug, label: "", total: count({ category: c.slug }) })),
      ...Array.from(new Set(seedProducts.map((p) => p.type)), (type) => ({
        kind: "type" as const, facet: type, label: "", total: count({ type }),
      })),
      ...priceRanges.map((maxPrice) => ({ kind: "price" as const, facet: String(maxPrice), label: "", total: count({ maxPrice }) })),
    ];
  }
  const result = await db.rpc("catalog_facets", {
    ...matchArgs(query), product_type: query.type ?? null, max_price: query.maxPrice ?? null,
  });
  if (result.error) throw new Error("Não foi possível carregar os filtros.");
  return result.data as Facet[];
}

export const getCatalogSitemapIds = unstable_cache(async () => {
  const db = createPublicClient();
  if (!db) return sitemapIds(seedProducts.filter((p) => p.active).length, seedCategories.length);
  const [products, categories] = await Promise.all([
    db.from("products").select("id", { count: "exact", head: true }).eq("active", true),
    db.from("categories").select("slug", { count: "exact", head: true }),
  ]);
  if (products.error || categories.error) throw new Error("Não foi possível contar as URLs.");
  return sitemapIds(products.count ?? 0, categories.count ?? 0);
}, ["catalog-sitemap-index"], { tags: [catalogTag], revalidate: catalogLifetime });

export const getCatalogSitemapSlugs = unstable_cache(async (table: "products" | "categories", offset: number) => {
  const db = createPublicClient();
  if (!db) {
    const rows = table === "products" ? seedProducts.filter((p) => p.active) : seedCategories;
    return rows.map((p) => p.slug).sort().slice(offset, offset + sitemapBlockSize);
  }
  const slugs: string[] = [];
  const pageLength = 500;
  for (let from = offset; from < offset + sitemapBlockSize; from += pageLength) {
    let request = db.from(table).select("slug").order("slug").range(from, from + pageLength - 1);
    if (table === "products") request = request.eq("active", true);
    const result = await request;
    if (result.status === 416) break;
    if (result.error) throw new Error("Não foi possível carregar o sitemap.");
    slugs.push(...result.data.map((row) => row.slug));
    if (result.data.length < pageLength) break;
  }
  return slugs;
}, ["catalog-sitemap-block"], { tags: [catalogTag], revalidate: catalogLifetime });

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (isDemoMode) return seedProducts.find((p) => p.slug === slug && p.active) ?? null;
  return unstable_cache(fetchProductBySlug, ["product-details", slug], {
    tags: [productSlugTag(slug)], revalidate: catalogLifetime,
  })(slug);
}

async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const db = createPublicClient();
  if (!db) return null;
  const { data, error } = await db.from("products").select(`${columns},seo_title,seo_description`).eq("slug", slug).eq("active", true).maybeSingle();
  if (error) throw new Error("Não foi possível carregar o produto.");
  return data ? rowToProduct({ ...data, delivery_path: null } as ProductRow) : null;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const db = createPublicClient();
  if (!db) return seedProducts.filter((p) => ids.includes(p.id) && p.active);
  const { data } = await db.from("products").select(columns).in("id", ids).eq("active", true);
  return ((data ?? []) as Omit<ProductRow, "delivery_path">[]).map((row) => rowToProduct({ ...row, delivery_path: null }));
}

export async function getProductImages(id: string): Promise<ProductImage[]> {
  if (isDemoMode) return [];
  return unstable_cache(fetchProductImages, ["product-images", id], {
    tags: [productTag(id)], revalidate: catalogLifetime,
  })(id);
}

async function fetchProductImages(id: string): Promise<ProductImage[]> {
  const db = createPublicClient();
  if (!db) return [];
  const { data, error } = await db.from("product_images").select("url,alt,position")
    .eq("product_id", id).order("position").limit(12);
  if (error) throw new Error("Não foi possível carregar as imagens.");
  return data ?? [];
}

export const getCategories = unstable_cache(async (): Promise<Category[]> => {
  const db = createPublicClient();
  if (!db) return seedCategories;
  const { data, error } = await db.from("categories").select("*").order("position");
  if (error) throw new Error("Não foi possível carregar as categorias.");
  return (data ?? []).map((c) => ({
    slug: c.slug,
    parentSlug: c.parent_slug,
    name: c.name,
    description: c.description,
    icon: c.icon,
    theme: c.theme,
  }));
}, ["catalog-categories"], { tags: [catalogTag], revalidate: catalogLifetime });

export async function getCategory(slug: string): Promise<Category | null> {
  const db = createPublicClient();
  if (!db) return seedCategories.find((category) => category.slug === slug) ?? null;
  const { data, error } = await db.from("categories").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error("Não foi possível carregar a categoria.");
  return data ? { slug: data.slug, parentSlug: data.parent_slug, name: data.name,
    description: data.description, icon: data.icon, theme: data.theme } : null;
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
