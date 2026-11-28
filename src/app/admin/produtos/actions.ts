"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { productToRow } from "@/lib/catalog/repository";
import { createAdminClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/format";

const toCents = (v: string) => Math.round(Number(v.replace(/\./g, "").replace(",", ".")) * 100);

const schema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(3),
  subtitle: z.string().trim().min(3),
  description: z.string().trim().min(10),
  type: z.enum(["curso", "preparatorio", "ebook", "sistema", "fisico"]),
  categorySlug: z.string().min(1),
  price: z.string().min(1),
  compareAt: z.string().optional(),
  badge: z.string().optional(),
  coverTheme: z.enum(["atlantico", "sol", "caja", "mandacaru", "coral", "noite"]),
  coverIcon: z.string().min(1),
  imageUrl: z.url({ protocol: /^https?$/ }).or(z.literal("")).optional(),
  highlights: z.string().optional(),
  specs: z.string().optional(),
  stock: z.string().optional(),
  deliveryPath: z.string().optional(),
  featured: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]),
  publishAt: z.string().refine((value) => value === "" || (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) && z.iso.datetime({ local: true, precision: -1 }).safeParse(value).success)),
  sku: z.string().trim().max(80),
  seoTitle: z.string().trim().max(120),
  seoDescription: z.string().trim().max(320),
});

export type SaveState = { error?: string };

export async function saveProduct(_prev: SaveState, form: FormData): Promise<SaveState> {
  const db = createAdminClient();
  if (!db) return { error: "Modo demonstração: configure o Supabase para editar produtos." };
  const user = await getCurrentUser();
  if (user?.role !== "admin") return { error: "Acesso negado." };

  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Revise os campos obrigatórios." };
  const f = parsed.data;
  const priceCents = toCents(f.price);
  if (!Number.isFinite(priceCents) || priceCents <= 0) return { error: "Preço inválido." };
  const compare = f.compareAt ? toCents(f.compareAt) : null;

  const row = { ...productToRow({
    slug: slugify(f.title),
    title: f.title,
    subtitle: f.subtitle,
    description: f.description,
    type: f.type,
    categorySlug: f.categorySlug,
    priceCents,
    compareAtCents: compare && compare > priceCents ? compare : null,
    rating: 5,
    reviewsCount: 0,
    soldCount: 0,
    badge: f.badge || null,
    coverTheme: f.coverTheme,
    coverIcon: f.coverIcon,
    imageUrl: f.imageUrl || null,
    highlights: (f.highlights ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
    specs: Object.fromEntries(
      (f.specs ?? "")
        .split("\n")
        .map((l) => l.split(":").map((s) => s.trim()))
        .filter(([k, v]) => k && v),
    ),
    stock: f.type === "fisico" && f.stock ? Math.max(0, Number(f.stock)) : null,
    featured: f.featured === "on",
    active: f.status === "active",
    deliveryPath: f.deliveryPath || null,
  }),
    status: f.status,
    publish_at: f.publishAt ? f.publishAt + "Z" : null,
    sku: f.sku || null,
    seo_title: f.seoTitle || null,
    seo_description: f.seoDescription || null,
  };

  if (f.id) {
    // Não sobrescreve métricas (avaliação, vendas) na edição.
    const { rating: _r, reviews_count: _rc, sold_count: _s, ...updatable } = row;
    void _r; void _rc; void _s;
    const { error } = await db.from("products").update(updatable).eq("id", f.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await db.from("products").insert(row);
    if (error) return { error: error.code === "23505" ? "Já existe um produto com esse nome." : error.message };
  }
  revalidatePath("/", "layout");
  redirect("/admin/produtos");
}
