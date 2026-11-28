import Link from "next/link";
import { z } from "zod";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { CatalogImportForm } from "@/components/admin/catalog-import-form";
import { Button } from "@/components/ui/button";
import { enqueueImport } from "./actions";

const labels = { ready: "Válida", invalid: "Inválida", applied: "Aplicada", failed: "Falhou" } as const;
const states = { draft: "Prévia", queued: "Na fila", done: "Concluído" } as const;

export default async function ImportPage({ searchParams }: { searchParams: Promise<{ lote?: string }> }) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") notFound();
  const db = createAdminClient();
  if (!db) notFound();
  const requested = z.guid().safeParse((await searchParams).lote);
  const { data: jobs, error } = await db.from("catalog_imports").select("id,status,created_at")
    .eq("created_by", user.id).order("created_at", { ascending: false }).limit(12);
  if (error) throw new Error("Não foi possível consultar as importações.");
  const job = requested.success
    ? (await db.from("catalog_imports").select("id,status").eq("id", requested.data).eq("created_by", user.id).maybeSingle()).data
    : null;
  const [rows, counts] = job ? await Promise.all([
    db.from("catalog_import_rows").select("line,sku,status,message,payload").eq("import_id", job.id).order("line").limit(25),
    Promise.all(Object.keys(labels).map((status) =>
      db.from("catalog_import_rows").select("line", { count: "exact", head: true })
        .eq("import_id", job.id).eq("status", status))),
  ]) : [null, null];
  if (rows?.error || counts?.some((result) => result.error)) throw new Error("Não foi possível consultar o relatório.");

  return (
    <div className="space-y-7">
      <h1 className="text-3xl font-extrabold">Importar e exportar catálogo</h1>
      <div className="flex flex-wrap gap-4 text-sm font-semibold text-brand-700">
        <a className="underline" href="/api/admin/catalogo/arquivo?tipo=modelo">Baixar modelo CSV</a>
        <a className="underline" href="/api/admin/catalogo/arquivo">Exportar CSV</a>
        <a className="underline" href="/api/admin/catalogo/arquivo?formato=xlsx">Exportar XLSX</a>
      </div>
      <p className="text-sm text-ink-600">Envie até 5.000 linhas e 2 MB. Use o SKU para localizar o produto e valores em centavos para o preço.</p>
      <CatalogImportForm />
      {job && (
        <section className="space-y-4 rounded-2xl border border-areia-200 p-5">
          <h2 className="text-xl font-bold">{states[job.status as keyof typeof states]}</h2>
          <p className="text-sm">Válidas: {counts?.[0].count ?? 0} · Inválidas: {counts?.[1].count ?? 0} · Aplicadas: {counts?.[2].count ?? 0} · Falhas: {counts?.[3].count ?? 0}</p>
          {job.status === "draft" && Boolean(counts?.[0].count) && (
            <form action={enqueueImport}>
              <input type="hidden" name="id" value={job.id} />
              <Button type="submit" variant="outline">Confirmar importação das linhas válidas</Button>
            </form>
          )}
          <a className="text-sm font-semibold text-brand-700 underline" href={`/api/admin/catalogo/arquivo?lote=${job.id}`}>Baixar relatório completo</a>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Primeiras 25 linhas do lote</caption>
              <thead><tr><th>Linha</th><th>SKU</th><th>Alterações</th><th>Situação</th><th>Mensagem</th></tr></thead>
              <tbody>{rows?.data?.map((row) => <tr key={row.line} className="border-t border-areia-200">
                <td className="py-2">{row.line}</td><td>{row.sku}</td>
                <td className="max-w-44 whitespace-normal px-2">{row.payload ? Object.keys(row.payload).filter((field) => field !== "slug").length + " campo(s)" : "—"}{row.payload?.title && <div>{row.payload.title}</div>}{typeof row.payload?.price_cents === "number" && <div>{row.payload.price_cents} centavos</div>}{typeof row.payload?.stock === "number" && <div>Estoque: {row.payload.stock}</div>}</td>
                <td>{labels[row.status as keyof typeof labels]}</td><td>{row.message ?? "—"}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </section>
      )}
      {jobs.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold">Lotes recentes</h2>
          <ul className="space-y-2 text-sm">
            {jobs.map((item) => <li key={item.id}><Link prefetch={false}
              href={`?lote=${item.id}`} className="text-brand-700 underline">
              {item.id.slice(0, 8)} · {states[item.status as keyof typeof states]}
            </Link></li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
