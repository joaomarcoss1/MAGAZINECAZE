-- Magazine Cazé — esquema inicial
-- Rode no SQL Editor do Supabase (ou `supabase db push`).

create extension if not exists pgcrypto;

-- ───────────── Perfis ─────────────
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  cpf text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ───────────── Catálogo ─────────────
create table public.categories (
  slug text primary key,
  name text not null,
  description text not null default '',
  icon text not null default 'sparkles',
  theme text not null default 'atlantico',
  position int not null default 0
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text not null default '',
  description text not null default '',
  type text not null check (type in ('curso', 'preparatorio', 'ebook', 'sistema', 'fisico')),
  category_slug text not null references public.categories (slug) on update cascade,
  price_cents int not null check (price_cents > 0),
  compare_at_cents int check (compare_at_cents is null or compare_at_cents > 0),
  rating numeric(2, 1) not null default 5,
  reviews_count int not null default 0,
  sold_count int not null default 0,
  badge text,
  cover_theme text not null default 'atlantico',
  cover_icon text not null default 'sparkles',
  image_url text,
  highlights text[] not null default '{}',
  specs jsonb not null default '{}',
  stock int check (stock is null or stock >= 0),
  featured boolean not null default false,
  active boolean not null default true,
  delivery_path text, -- caminho no bucket privado "digital" ou URL da área do aluno
  created_at timestamptz not null default now()
);
create index products_category_idx on public.products (category_slug) where active;
create index products_sold_idx on public.products (sold_count desc) where active;

-- ───────────── Pedidos ─────────────
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'refunded', 'expired')),
  user_id uuid references auth.users on delete set null,
  customer jsonb not null,
  shipping_address jsonb,
  subtotal_cents int not null,
  discount_cents int not null default 0,
  shipping_cents int not null default 0,
  total_cents int not null,
  payment_method text not null check (payment_method in ('pix', 'card')),
  payment_id text,
  payment_data jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_email_idx on public.orders ((customer->>'email'));
create index orders_status_idx on public.orders (status, created_at desc);

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders on delete cascade,
  product_id uuid not null references public.products,
  slug text not null,
  title text not null,
  type text not null,
  unit_price_cents int not null,
  quantity int not null check (quantity > 0)
);
create index order_items_order_idx on public.order_items (order_id);

-- Acesso a produtos digitais (por usuário OU e-mail da compra — permite compra sem cadastro).
create table public.entitlements (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade,
  email text not null,
  product_id uuid not null references public.products,
  order_id uuid not null references public.orders on delete cascade,
  created_at timestamptz not null default now(),
  unique (order_id, product_id)
);
create index entitlements_email_idx on public.entitlements (email);

-- Confirmação de pagamento: atômica e idempotente (webhooks repetidos não duplicam nada).
create or replace function public.mark_order_paid(p_order uuid, p_payment text)
returns boolean language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  update public.orders
     set status = 'paid', paid_at = now(), payment_id = coalesce(p_payment, payment_id)
   where id = p_order and status = 'pending'
  returning * into o;
  if not found then return false; end if;

  insert into public.entitlements (user_id, email, product_id, order_id)
  select o.user_id, o.customer->>'email', i.product_id, o.id
    from public.order_items i where i.order_id = o.id and i.type <> 'fisico'
  on conflict do nothing;

  update public.products p
     set sold_count = p.sold_count + i.quantity,
         stock = case when p.stock is null then null else greatest(p.stock - i.quantity, 0) end
    from public.order_items i
   where i.order_id = o.id and i.product_id = p.id;

  return true;
end $$;
revoke execute on function public.mark_order_paid(uuid, text) from public, anon, authenticated;

-- ───────────── RLS ─────────────
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.entitlements enable row level security;

create policy "perfil: dono lê" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "perfil: dono edita" on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "categorias: público lê" on public.categories for select using (true);
create policy "categorias: admin gerencia" on public.categories for all using (public.is_admin()) with check (public.is_admin());

create policy "produtos: público lê ativos" on public.products for select using (active or public.is_admin());
create policy "produtos: admin gerencia" on public.products for all using (public.is_admin()) with check (public.is_admin());

create policy "pedidos: dono lê" on public.orders for select
  using (user_id = auth.uid() or customer->>'email' = auth.jwt()->>'email' or public.is_admin());
create policy "itens: dono lê" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id
         and (o.user_id = auth.uid() or o.customer->>'email' = auth.jwt()->>'email' or public.is_admin())));
create policy "acessos: dono lê" on public.entitlements for select
  using (user_id = auth.uid() or email = auth.jwt()->>'email' or public.is_admin());
-- Inserções/atualizações de pedidos acontecem só no servidor com a service role.

-- ───────────── Storage (arquivos digitais privados) ─────────────
insert into storage.buckets (id, name, public) values ('digital', 'digital', false)
on conflict (id) do nothing;
