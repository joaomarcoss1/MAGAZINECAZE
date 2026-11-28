export const sitemapBlockSize = 5000;

export function sitemapIds(products: number, categories: number) {
  const ids = ["paginas"];
  for (const [prefix, total] of [["produtos", products], ["categorias", categories]] as const) {
    for (let block = 0; block < Math.ceil(total / sitemapBlockSize); block++) ids.push(`${prefix}-${block}`);
  }
  return ids;
}

export function sitemapBlock(id: string) {
  const parsed = /^(produtos|categorias)-(0|[1-9]\d{0,5})$/.exec(id);
  if (!parsed) return null;
  return {
    table: parsed[1] === "produtos" ? "products" as const : "categories" as const,
    offset: Number(parsed[2]) * sitemapBlockSize,
  };
}
