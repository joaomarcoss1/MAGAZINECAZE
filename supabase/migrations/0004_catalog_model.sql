alter table public.categories
  add column parent_slug text references public.categories(slug) on update cascade on delete set null,
  add constraint categories_parent_not_self check (parent_slug <> slug);
create index categories_parent_idx on public.categories(parent_slug);

alter table public.products
  add column sku text unique,
  add column seo_title text,
  add column seo_description text,
  add column status text not null default 'active' check (status in ('draft', 'active', 'archived')),
  add column publish_at timestamptz,
  add column gtin text check (gtin ~ '^([0-9]{8}|[0-9]{12,14})$'),
  add column ncm text check (ncm ~ '^[0-9]{8}$'),
  add column weight_grams integer check (weight_grams > 0),
  add column width_mm integer check (width_mm > 0),
  add column height_mm integer check (height_mm > 0),
  add column length_mm integer check (length_mm > 0);

update public.products set status = 'draft' where not active;

create function public.sync_product_visibility() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'active' and not new.active then
    if tg_op = 'INSERT' then
      new.status := 'draft';
    elsif new.status = old.status and new.active is distinct from old.active then
      new.status := 'draft';
    end if;
  elsif tg_op = 'UPDATE' then
    if old.status = 'draft' and new.status = old.status and new.active and not old.active then
      new.status := 'active';
    end if;
  end if;
  new.active := new.status = 'active';
  return new;
end
$$;
create trigger products_sync_visibility before insert or update of active, status
on public.products for each row execute function public.sync_product_visibility();

drop policy "produtos: público lê ativos" on public.products;
create policy "produtos: público lê publicados" on public.products for select
using ((active and status = 'active' and (publish_at is null or publish_at <= now())) or public.is_admin());

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique check (btrim(sku) <> ''),
  options jsonb not null default '{}' check (jsonb_typeof(options) = 'object'),
  price_cents int not null check (price_cents > 0),
  stock int not null default 0 check (stock >= 0),
  weight_grams int check (weight_grams > 0),
  width_mm int check (width_mm > 0),
  height_mm int check (height_mm > 0),
  length_mm int check (length_mm > 0),
  unique (product_id, options)
);
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null check (btrim(url) <> ''),
  alt text not null,
  position int not null default 0 check (position >= 0),
  unique (product_id, position)
);
create table public.product_attributes (
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60 and name = btrim(name)),
  value text not null check (char_length(value) between 1 and 100 and value = btrim(value)),
  primary key (product_id, name, value)
);
create index product_attributes_filter_idx on public.product_attributes(name, value, product_id);

do $$
declare relation text;
begin
  foreach relation in array array['product_variants', 'product_images', 'product_attributes'] loop
    execute format('alter table public.%I enable row level security', relation);
    execute format('create policy catalog_public_read on public.%I for select using (
      exists (select 1 from public.products p where p.id = product_id
        and p.active and p.status = ''active'' and (p.publish_at is null or p.publish_at <= now()))
    )', relation);
    execute format('create policy catalog_admin_manage on public.%I for all using (public.is_admin()) with check (public.is_admin())', relation);
    execute format('grant select on public.%I to anon', relation);
    execute format('grant select, insert, update, delete on public.%I to authenticated, service_role', relation);
  end loop;
end $$;

create function public.catalog_category_scope(root text)
returns table(slug text) language sql stable security invoker as $$
  with recursive descendants(slug) as (
    select c.slug from public.categories c where c.slug = root
    union
    select c.slug from public.categories c join descendants d on c.parent_slug = d.slug
  )
  select descendants.slug from descendants
$$;

-- Os destinos de entrega são lidos exclusivamente pela rota autenticada.
revoke select on public.products from public, anon, authenticated;
grant select (id, slug, title, subtitle, description, type, category_slug, price_cents, compare_at_cents, rating, reviews_count, sold_count, badge, cover_theme, cover_icon, image_url, highlights, specs, stock, featured, active, created_at, search_document, sku, seo_title, seo_description, status, publish_at, gtin, ncm, weight_grams, width_mm, height_mm, length_mm) on public.products to anon, authenticated;

create view public.catalog_readable_products with (security_invoker = true) as
  select id, slug, title, subtitle, description, type, category_slug, price_cents, compare_at_cents, rating, reviews_count, sold_count, badge, cover_theme, cover_icon, image_url, highlights, specs, stock, featured, active, created_at, search_document, sku, seo_title, seo_description, status, publish_at, gtin, ncm, weight_grams, width_mm, height_mm, length_mm
  from public.products;
grant select on public.catalog_readable_products to anon, authenticated, service_role;

drop function public.search_catalog(text);
create function public.search_catalog(term text)
returns setof public.catalog_readable_products language sql stable security invoker as $$
  select p.* from public.catalog_readable_products p
  where p.active and p.status = 'active' and (p.publish_at is null or p.publish_at <= now())
    and p.search_document @@ pg_catalog.websearch_to_tsquery('public.catalog_pt'::regconfig, left(term, 120))
$$;
revoke execute on function public.search_catalog(text) from public;
grant execute on function public.search_catalog(text) to anon, authenticated, service_role;

create function public.catalog_matches(term text, category text, attr_name text, attr_value text)
returns setof public.catalog_readable_products language sql stable security invoker as $$
  select p.* from public.catalog_readable_products p
  where p.active and p.status = 'active' and (p.publish_at is null or p.publish_at <= now())
    and (term is null or p.search_document @@ pg_catalog.websearch_to_tsquery('public.catalog_pt'::regconfig, left(term, 120)))
    and (category is null or p.category_slug in (select slug from public.catalog_category_scope(category)))
    and (attr_name is null or exists (
      select 1 from public.product_attributes a
      where a.product_id = p.id and a.name = attr_name and a.value = attr_value
    ))
$$;

create function public.catalog_facets(term text, category text, product_type text, max_price int, attr_name text, attr_value text)
returns table(kind text, facet text, label text, total bigint)
language sql stable security invoker as $$
  with recursive hierarchy(ancestor, descendant) as (
    select c.slug, c.slug from public.categories c
    union
    select c.parent_slug, h.descendant from hierarchy h
      join public.categories c on c.slug = h.ancestor where c.parent_slug is not null
  ),
  candidates as materialized (
    select p.id, p.category_slug, p.type, p.price_cents,
      (category is null or p.category_slug in (select slug from public.catalog_category_scope(category))) as in_category,
      (product_type is null or p.type = product_type) as in_type,
      (max_price is null or p.price_cents <= max_price) as in_price,
      (attr_name is null or exists (
        select 1 from public.product_attributes a
        where a.product_id = p.id and a.name = attr_name and a.value = attr_value
      )) as in_attribute
    from public.catalog_matches(term, null, null, null) p
  )
  select 'category', h.ancestor, '', count(*) from candidates p
    join hierarchy h on h.descendant = p.category_slug
    where p.in_type and p.in_price and p.in_attribute group by h.ancestor
  union all
  select 'type', p.type, '', count(*) from candidates p
    where p.in_category and p.in_price and p.in_attribute group by p.type
  union all
  select 'price', b.maximum::text, '', count(p.id)
    from (values (5000), (10000), (20000), (50000)) b(maximum)
    left join candidates p on p.in_category and p.in_type and p.in_attribute and p.price_cents <= b.maximum
    group by b.maximum
  union all
  select 'attribute', a.name, a.value, count(*) from candidates p
    join public.product_attributes a on a.product_id = p.id
    where p.in_category and p.in_type and p.in_price group by a.name, a.value
  order by 1, 2, 3
$$;

revoke execute on function public.catalog_category_scope(text), public.catalog_matches(text, text, text, text),
  public.catalog_facets(text, text, text, int, text, text) from public;
grant execute on function public.catalog_category_scope(text), public.catalog_matches(text, text, text, text),
  public.catalog_facets(text, text, text, int, text, text) to anon, authenticated, service_role;
