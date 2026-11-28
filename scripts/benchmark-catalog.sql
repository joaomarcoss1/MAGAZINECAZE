-- Use somente em banco local ou staging isolado. ROLLBACK remove os produtos fictícios.
begin;

insert into public.categories (slug, name) values ('benchmark-catalogo', 'Benchmark de catálogo');
insert into public.products (slug, title, description, type, category_slug, price_cents, sold_count)
select 'bench-catalogo-' || n,
  case when n % 100 = 0 then 'Administração pública' else 'Estudo de matemática' end,
  'Material de preparação para provas', 'ebook', 'benchmark-catalogo', n * 5, n % 120
from generate_series(1, 5000) n;

analyze public.products;

explain (analyze, buffers)
select id, title, price_cents from public.products
where active and category_slug = 'benchmark-catalogo'
order by sold_count desc, id limit 24 offset 2400;

explain (analyze, buffers)
select id, title, price_cents from public.search_catalog('administracao publica')
order by price_cents, id limit 24;

rollback;
