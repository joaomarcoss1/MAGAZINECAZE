create table public.catalog_imports (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'queued', 'done')),
  created_at timestamptz not null default now(),
  queued_at timestamptz,
  finished_at timestamptz
);
create index catalog_import_queue_idx on public.catalog_imports(queued_at, id) where status = 'queued';

create table public.catalog_import_rows (
  import_id uuid not null references public.catalog_imports(id) on delete cascade,
  line int not null check (line > 1),
  sku text not null,
  payload jsonb,
  status text not null check (status in ('ready', 'invalid', 'applied', 'failed')),
  message text,
  primary key (import_id, line)
);
create index catalog_import_pending_idx on public.catalog_import_rows(import_id, line) where status = 'ready';

alter table public.catalog_imports enable row level security;
alter table public.catalog_import_rows enable row level security;
revoke all on public.catalog_imports, public.catalog_import_rows from public, anon, authenticated;
grant select, insert, update, delete on public.catalog_imports, public.catalog_import_rows to service_role;

create function public.stage_catalog_import(p_user uuid, p_rows jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare job_id uuid;
begin
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) not between 1 and 5000 then
    raise exception 'Número de linhas inválido';
  end if;
  insert into public.catalog_imports(created_by) values (p_user) returning id into job_id;
  insert into public.catalog_import_rows(import_id, line, sku, payload, status, message)
    select job_id, r.line, r.sku, r.payload,
      case when r.error is null then 'ready' else 'invalid' end, r.error
    from jsonb_to_recordset(p_rows) as r(line int, sku text, payload jsonb, error text);
  return job_id;
end;
$$;

create function public.process_catalog_import(p_limit int default 250)
returns integer language plpgsql security invoker set search_path = '' as $$
declare
  job_id uuid;
  r public.catalog_import_rows;
  item public.products;
  n integer := 0;
begin
  if not pg_try_advisory_xact_lock(873609124627) then return 0; end if;
  select id into job_id from public.catalog_imports where status = 'queued'
    order by queued_at, id limit 1 for update;
  if not found then return 0; end if;

  for r in select * from public.catalog_import_rows
    where import_id = job_id and status = 'ready'
    order by line limit greatest(1, least(coalesce(p_limit, 250), 1000))
  loop
    item := jsonb_populate_record(null::public.products, r.payload);
    begin
      update public.products set
        title = coalesce(item.title, title),
        subtitle = coalesce(item.subtitle, subtitle),
        description = coalesce(item.description, description),
        type = coalesce(item.type, type),
        category_slug = coalesce(item.category_slug, category_slug),
        price_cents = coalesce(item.price_cents, price_cents),
        stock = coalesce(item.stock, stock),
        status = coalesce(item.status, status),
        image_url = coalesce(item.image_url, image_url)
      where sku = r.sku;
      if not found then
        insert into public.products (sku, slug, title, subtitle, description, type, category_slug,
          price_cents, stock, status, image_url)
        values (r.sku, item.slug, item.title, coalesce(item.subtitle, ''), coalesce(item.description, ''),
          item.type, item.category_slug, item.price_cents, item.stock, coalesce(item.status, 'draft'), item.image_url);
      end if;
      update public.catalog_import_rows set status = 'applied'
        where import_id = job_id and line = r.line;
    exception
      when unique_violation or foreign_key_violation or check_violation or not_null_violation then
        update public.catalog_import_rows set status = 'failed',
          message = case sqlstate
            when '23505' then 'SKU ou endereço do produto em conflito.'
            when '23503' then 'Categoria não encontrada.'
            else 'Os dados não atendem às regras do catálogo.'
          end
        where import_id = job_id and line = r.line;
    end;
    n := n + 1;
  end loop;
  if not exists (select 1 from public.catalog_import_rows where import_id = job_id and status = 'ready') then
    update public.catalog_imports set status = 'done', finished_at = now() where id = job_id;
  end if;
  return n;
end;
$$;

revoke execute on function public.stage_catalog_import(uuid, jsonb), public.process_catalog_import(int)
from public, anon, authenticated;
grant execute on function public.stage_catalog_import(uuid, jsonb), public.process_catalog_import(int) to service_role;
