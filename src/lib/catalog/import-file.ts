import { parse } from "csv-parse/sync";
import { unzipSync, zipSync } from "fflate";
import { readSheet } from "read-excel-file/node";
import { z } from "zod";
import { slugify } from "../format";
import { catalogImageSource } from "./image-origins";

export const importColumns = [
  "sku", "titulo", "subtitulo", "descricao", "tipo", "categoria", "preco_centavos", "estoque", "status", "imagem_url",
] as const;
const maxRows = 5000;
const maxUploadBytes = 2 * 1024 * 1024;
type ImportColumn = typeof importColumns[number];
const optionalInteger = (min: number) => z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(min).max(2147483647)).optional();
const schema = z.object({
  sku: z.string().min(1).max(80).regex(/^[^"\\,()\u0000-\u001F]+$/),
  titulo: z.string().min(3).max(160).optional(),
  subtitulo: z.string().max(240).optional(),
  descricao: z.string().max(4000).optional(),
  tipo: z.enum(["curso", "preparatorio", "ebook", "sistema", "fisico"]).optional(),
  categoria: z.string().max(100).optional(),
  preco_centavos: optionalInteger(1),
  estoque: optionalInteger(0),
  status: z.enum(["draft", "active", "archived"]).optional(),
  imagem_url: z.string().max(1000).refine((value) => Boolean(catalogImageSource(value))).optional(),
});

type Candidate = { line: number; fields: Partial<Record<ImportColumn, string>>; parseError?: string };

function boundedXlsx(data: Buffer) {
  let size = 0;
  let files = 0;
  const entries = unzipSync(data, { filter: (entry) => {
    size += entry.originalSize;
    if (++files > 128 || size > 32 * 1024 * 1024) throw new Error("A planilha é grande demais após descompactar.");
    return true;
  } });
  for (const [name, entry] of Object.entries(entries)) {
    if (/^xl\/worksheets\/[^/]+\.xml$/.test(name) && /<(?:[\w.-]+:)?f(?:\s|>)/.test(Buffer.from(entry).toString("utf-8"))) {
      throw new Error("A planilha contém fórmulas. Cole os valores antes de enviar.");
    }
  }
  return Buffer.from(zipSync(entries, { level: 0 }));
}

export async function readImport(file: File): Promise<Candidate[]> {
  if (file.size === 0 || file.size > maxUploadBytes) throw new Error("Envie um arquivo de até 2 MB.");
  const data = Buffer.from(await file.arrayBuffer());
  const extension = file.name.toLowerCase().split(".").pop();
  let rows: unknown[][];
  if (extension === "csv") {
    const content = new TextDecoder("utf-8", { fatal: true }).decode(data);
    const delimiter = content.split(/\r?\n/, 1)[0].includes(";") ? ";" : ",";
    rows = parse(content, { bom: true, delimiter, relax_column_count: true, max_record_size: 64_000 });
  } else if (extension === "xlsx") {
    rows = await readSheet(boundedXlsx(data), 1);
  } else {
    throw new Error("Escolha um arquivo CSV ou XLSX.");
  }
  if (rows.length < 2 || rows.length > maxRows + 1) throw new Error("O arquivo deve ter de 1 a 5.000 linhas de produtos.");
  const header = rows[0].map((value) => String(value ?? "").trim().toLowerCase());
  if (!header.includes("sku") || header.length > importColumns.length || new Set(header).size !== header.length ||
    header.some((value) => !importColumns.includes(value as ImportColumn))) {
    throw new Error("Cabeçalho inválido. Baixe o modelo de planilha.");
  }
  const candidates = rows.slice(1).flatMap((row, i) => {
    if (row.every((value) => value === null || value === undefined || String(value).trim() === "")) return [];
    const fields = Object.fromEntries(header.map((name, j) => [name, String(row[j] ?? "").trim() || undefined]));
    return [{ line: i + 2, fields, parseError: row.length > header.length ? "Há colunas sem cabeçalho." : undefined }];
  });
  if (!candidates.length) throw new Error("O arquivo não contém produtos.");
  return candidates;
}

export function validateImport(candidates: Candidate[], existing: Set<string>, categories: Set<string>) {
  const seen = new Set<string>();
  return candidates.map(({ line, fields, parseError }) => {
    const sku = fields.sku?.slice(0, 80) ?? "";
    const failure = (error: string) => ({ line, sku, payload: null, error });
    if (parseError) return failure(parseError);
    const checked = schema.safeParse(fields);
    if (!checked.success) return failure(`Campos inválidos: ${checked.error.issues.map(({ path }) => path.join(".")).join(", ")}.`);
    const f = checked.data;
    if (seen.has(f.sku)) return failure("SKU repetido no arquivo.");
    seen.add(f.sku);
    if (f.categoria && !categories.has(f.categoria)) return failure("Categoria não encontrada.");
    const slug = f.titulo ? slugify(f.titulo) : "";
    if (!existing.has(f.sku) && (!slug || !f.tipo || !f.categoria || !f.preco_centavos)) {
      return failure("Novo SKU exige título, tipo, categoria e preço.");
    }
    if (Object.keys(f).every((key) => key === "sku" || f[key as ImportColumn] === undefined)) return failure("Não há campos para atualizar.");
    return {
      line, sku, error: null,
      payload: { slug: slug || undefined, title: f.titulo, subtitle: f.subtitulo, description: f.descricao,
        type: f.tipo, category_slug: f.categoria, price_cents: f.preco_centavos, stock: f.estoque,
        status: f.status, image_url: f.imagem_url },
    };
  });
}
