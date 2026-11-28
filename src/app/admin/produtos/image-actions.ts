"use server";

import { randomUUID } from "node:crypto";
import { invalidateProduct } from "@/lib/catalog/invalidate";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { catalogImageSource } from "@/lib/catalog/image-origins";
import { maxImageBytes, normalizeCatalogImage } from "@/lib/catalog/normalize-image";
import { createAdminClient } from "@/lib/supabase/server";

export async function uploadProductImage(productId: string, _state: { error?: string; uploaded?: boolean }, form: FormData) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return { error: "Acesso negado." };
  const alt = z.string().trim().min(1).max(160).safeParse(form.get("alt"));
  const file = form.get("image");
  if (!z.guid().safeParse(productId).success || !alt.success ||
    !(file instanceof File) || file.size === 0 || file.size > maxImageBytes) {
    return { error: "Escolha uma imagem de até 2 MB e informe o texto alternativo." };
  }
  const db = createAdminClient();
  if (!db) return { error: "Armazenamento indisponível." };
  const { data: product, error: lookupError } = await db.from("products").select("slug").eq("id", productId).maybeSingle();
  if (lookupError || !product) return { error: "Não foi possível localizar o produto." };

  let image: Buffer;
  try {
    image = await normalizeCatalogImage(Buffer.from(await file.arrayBuffer()));
  } catch {
    return { error: "Use uma imagem JPEG, PNG ou WebP válida e sem animação." };
  }
  const bucket = db.storage.from("produtos");
  const path = `${productId}/${randomUUID()}.webp`;
  const url = bucket.getPublicUrl(path).data.publicUrl;
  if (!catalogImageSource(url)) return { error: "Origem do armazenamento de imagens inválida." };
  const { error } = await bucket.upload(path, image, { contentType: "image/webp", cacheControl: "31536000" });
  if (error) return { error: "Não foi possível enviar a imagem." };

  const saved = await db.rpc("add_catalog_image", { p_product: productId, p_url: url, p_alt: alt.data });
  if (saved.error || saved.data !== "added") {
    // Um erro de rede pode ocorrer depois do commit. Nesse caso, preserve o objeto.
    if (!saved.error || saved.status >= 400 && saved.status < 500) await bucket.remove([path]);
    return { error: saved.data === "limit" ? "O produto já tem 12 imagens." : "Não foi possível registrar a imagem." };
  }

  invalidateProduct(productId, product.slug);
  return { uploaded: true };
}
