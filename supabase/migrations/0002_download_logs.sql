create table public.download_logs (
  id bigint generated always as identity primary key,
  order_item_id bigint not null references public.order_items(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  ip inet,
  created_at timestamptz not null default now()
);
create index download_logs_item_idx on public.download_logs (order_item_id);
alter table public.download_logs enable row level security;
revoke all on public.download_logs from public, anon, authenticated;

create function public.record_digital_delivery(p_order uuid, p_product uuid, p_user uuid, p_ip inet)
returns text language plpgsql security definer set search_path = '' as $$
declare
  item_id bigint;
begin
  select i.id into item_id
  from public.orders o
  join public.order_items i on i.order_id = o.id
  join public.entitlements e on e.order_id = o.id and e.product_id = i.product_id
  join auth.users u on u.id = p_user
  where o.id = p_order and i.product_id = p_product and i.type <> 'fisico'
    and o.status = 'paid'
    and (o.user_id = u.id or (o.user_id is null and u.email_confirmed_at is not null and u.confirmation_sent_at is not null
      and lower(u.email) = lower(e.email)))
  order by i.id
  limit 1
  for update of o, i;

  if not found then return 'denied'; end if;
  if (select count(*) from public.download_logs where order_item_id = item_id) >= 10 then
    return 'limit';
  end if;

  insert into public.download_logs (order_item_id, user_id, ip) values (item_id, p_user, p_ip);
  return 'allowed';
end $$;

revoke execute on function public.record_digital_delivery(uuid, uuid, uuid, inet) from public, anon, authenticated;
grant execute on function public.record_digital_delivery(uuid, uuid, uuid, inet) to service_role;
