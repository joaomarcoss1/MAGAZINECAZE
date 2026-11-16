// Gera supabase/seed.sql a partir do catálogo de exemplo: npm run db:seed-sql
import { build } from "esbuild";
const out = await build({ entryPoints: [process.argv[2]], bundle: true, write: false, format: "esm", platform: "node" });
const mod = await import("data:text/javascript;base64," + Buffer.from(out.outputFiles[0].text).toString("base64"));
const q = (v) => v === null || v === undefined ? "null" : typeof v === "number" || typeof v === "boolean" ? String(v) : `'${String(v).replace(/'/g, "''")}'`;
let sql = "-- Catálogo de EXEMPLO (gerado de src/lib/catalog/seed.ts). Substitua pelos produtos reais.\n\n";
mod.categories.forEach((c, i) => { sql += `insert into public.categories (slug, name, description, icon, theme, position) values (${[c.slug,c.name,c.description,c.icon,c.theme,i].map(q).join(", ")});\n`; });
sql += "\n";
for (const p of mod.products) {
  const hl = `array[${p.highlights.map(q).join(", ")}]::text[]`;
  sql += `insert into public.products (slug, title, subtitle, description, type, category_slug, price_cents, compare_at_cents, rating, reviews_count, sold_count, badge, cover_theme, cover_icon, highlights, specs, stock, featured, active, created_at) values (${[p.slug,p.title,p.subtitle,p.description,p.type,p.categorySlug,p.priceCents,p.compareAtCents,p.rating,p.reviewsCount,p.soldCount,p.badge,p.coverTheme,p.coverIcon].map(q).join(", ")}, ${hl}, ${q(JSON.stringify(p.specs))}::jsonb, ${q(p.stock)}, ${p.featured}, true, ${q(p.createdAt)});\n`;
}
process.stdout.write(sql);
