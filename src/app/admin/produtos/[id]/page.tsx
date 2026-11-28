import { notFound } from "next/navigation";
import { getCategories, rowToProduct } from "@/lib/catalog/repository";
import { products as seedProducts } from "@/lib/catalog/seed";
import { createAdminClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/catalog/types";
import { ProductImageUpload } from "@/components/admin/product-image-upload";
import { ProductForm } from "@/components/admin/product-form";
import { isDemoMode } from "@/lib/config";

async function load(id: string): Promise<Product | null> {
  const db = createAdminClient();
  if (!db) return seedProducts.find((p) => p.id === id) ?? null;
  const { data } = await db.from("products").select("*").eq("id", id).maybeSingle();
  return data ? rowToProduct(data) : null;
}

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = id === "novo" ? null : await load(id);
  if (id !== "novo" && !product) notFound();
  const categories = await getCategories();
  return (
    <div>
      <h1 className="mb-6 text-3xl font-extrabold">{product ? "Editar produto" : "Novo produto"}</h1>
      <ProductForm product={product} categories={categories} readOnly={isDemoMode} />
      {product && !isDemoMode && <ProductImageUpload productId={product.id} />}
    </div>
  );
}
