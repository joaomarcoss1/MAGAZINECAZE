"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { readImport, validateImport } from "@/lib/catalog/import-file";
import { createAdminClient } from "@/lib/supabase/server";

export async function previewImport(_state: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return { error: "Acesso negado." };
  const db = createAdminClient();
  if (!db) return { error: "Banco indisponível." };
  const file = form.get("catalog");
  if (!(file instanceof File)) return { error: "Selecione uma planilha." };
  let candidates;
  try {
    candidates = await readImport(file);
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    return { error: /^(Envie|Escolha|O arquivo|Cabeçalho|A planilha)/.test(message)
      ? message : "Não foi possível ler a planilha. Confira o formato." };
  }

  const { data: categories, error: categoryError } = await db.from("categories").select("slug");
  if (categoryError) return { error: "Não foi possível consultar as categorias." };
  const skus = Array.from(new Set(candidates.flatMap(({ fields }) =>
    fields.sku && fields.sku.length <= 80 && /^[^"\\,()\u0000-\u001F]+$/.test(fields.sku) ? [fields.sku] : [])));
  const existing = new Set<string>();
  for (let i = 0; i < skus.length; i += 50) {
    const result = await db.from("products").select("sku").in("sku", skus.slice(i, i + 50));
    if (result.error) return { error: "Não foi possível consultar os SKUs." };
    for (const row of result.data) existing.add(row.sku);
  }
  const rows = validateImport(candidates, existing, new Set(categories.map((row) => row.slug)));
  const { data: id, error } = await db.rpc("stage_catalog_import", { p_user: user.id, p_rows: rows });
  if (error || !id) return { error: "Não foi possível salvar a prévia." };
  redirect(`/admin/produtos/importacoes?lote=${id}`);
}

export async function enqueueImport(form: FormData) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return;
  const db = createAdminClient();
  if (!db) return;
  const id = z.guid().safeParse(form.get("id"));
  if (!id.success) return;
  const { count, error } = await db.from("catalog_import_rows").select("line", { count: "exact", head: true })
    .eq("import_id", id.data).eq("status", "ready");
  if (error) throw new Error("Não foi possível consultar o lote.");
  if (count) {
    const result = await db.from("catalog_imports").update({ status: "queued", queued_at: new Date().toISOString() })
      .eq("id", id.data).eq("created_by", user.id).eq("status", "draft");
    if (result.error) throw new Error("Não foi possível colocar o lote na fila.");
  }
  redirect(`/admin/produtos/importacoes?lote=${id.data}`);
}
