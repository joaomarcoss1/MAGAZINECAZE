import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { importColumns } from "@/lib/catalog/import-file";
import { z } from "zod";
import writeXlsxFile from "write-excel-file/node";

const columns = ["sku", "title", "subtitle", "description", "type", "category_slug", "price_cents", "stock", "status", "image_url"] as const;
type Cell = string | number | null;

function csvCell(value: Cell) {
  const text = String(value ?? "");
  const escaped = typeof value === "string" && /^[\s]*[=+@-]/.test(text) ? "'" + text : text;
  return '"' + escaped.replaceAll('"', '""') + '"';
}

async function file(rows: Cell[][], name: string, xlsx = false) {
  const format = xlsx ? "xlsx" : "csv";
  const bytes = xlsx ? new Uint8Array(await writeXlsxFile(rows).toBuffer())
    : "\ufeff" + rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
  return new Response(bytes, { headers: {
    "Content-Type": xlsx ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${name}.${format}"`,
    "Cache-Control": "private, no-store",
  } });
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return new Response(null, { status: 403 });
  const db = createAdminClient();
  if (!db) return new Response(null, { status: 503 });
  const params = new URL(request.url).searchParams;
  const rawId = params.get("lote");
  if (rawId !== null) {
    const id = z.guid().safeParse(rawId);
    if (!id.success) return new Response(null, { status: 404 });
    const job = await db.from("catalog_imports").select("id").eq("id", id.data).eq("created_by", user.id).maybeSingle();
    if (job.error) return new Response(null, { status: 503 });
    if (!job.data) return new Response(null, { status: 404 });
    const rows: Cell[][] = [["linha", "sku", "status", "mensagem"]];
    for (let from = 0; from < 5000; from += 500) {
      const result = await db.from("catalog_import_rows").select("line,sku,status,message")
        .eq("import_id", id.data).order("line").range(from, from + 499);
      if (result.status === 416) break;
      if (result.error) return new Response(null, { status: 503 });
      rows.push(...result.data.map((row) => [row.line, row.sku, row.status, row.message]));
      if (result.data.length < 500) break;
    }
    return file(rows, "relatorio-importacao");
  }

  const rows: Cell[][] = [[...importColumns]];
  if (params.get("tipo") === "modelo") return file(rows, "modelo-catalogo", params.get("formato") === "xlsx");
  let cursor: string | undefined;
  while (true) {
    let batch = db.from("products").select(`id,${columns.join(",")}`).order("id").limit(500);
    if (cursor) batch = batch.gt("id", cursor);
    const result = await batch;
    if (result.error) return new Response(null, { status: 503 });
    for (const raw of result.data) {
      const row = raw as unknown as Record<typeof columns[number] | "id", Cell>;
      rows.push(columns.map((column) => row[column]));
      cursor = String(row.id);
    }
    if (result.data.length < 500) break;
  }
  return file(rows, "catalogo", params.get("formato") === "xlsx");
}
