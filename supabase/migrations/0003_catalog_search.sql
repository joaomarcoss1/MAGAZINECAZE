create extension if not exists unaccent with schema extensions;

create text search configuration public.catalog_pt (copy = pg_catalog.portuguese);
alter text search configuration public.catalog_pt
  alter mapping for hword, hword_part, word with extensions.unaccent, pg_catalog.portuguese_stem;

alter table public.products add column search_document tsvector
  generated always as (
    to_tsvector('public.catalog_pt'::regconfig, title || ' ' || subtitle || ' ' || description || ' ' || category_slug)
  ) stored;

create index products_active_search_idx on public.products using gin (search_document) where active;
create index products_active_category_idx on public.products (category_slug, id) where active;
create index products_active_sales_idx on public.products (sold_count desc, id) where active;
create index products_active_price_idx on public.products (price_cents, id) where active;
create index products_active_recent_idx on public.products (created_at desc, id) where active;

create function public.search_catalog(term text)
returns setof public.products
language sql stable security invoker as $$
  select p.* from public.products p
  where p.active
    and p.search_document @@ pg_catalog.websearch_to_tsquery('public.catalog_pt'::regconfig, left(term, 120))
$$;

revoke execute on function public.search_catalog(text) from public;
grant execute on function public.search_catalog(text) to anon, authenticated, service_role;
