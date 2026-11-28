insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('produtos', 'produtos', true, 2500000, array['image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Não há política de escrita para usuários do bucket. O painel usa a rota de serviço.
create function public.add_catalog_image(p_product uuid, p_url text, p_alt text)
returns text
language plpgsql security invoker set search_path = '' as $$
declare next_position int;
begin
  perform 1 from public.products where id = p_product for update;
  if not found then return 'missing'; end if;
  if (select count(*) from public.product_images where product_id = p_product) >= 12 then
    return 'limit';
  end if;

  select coalesce(max(position) + 1, 0) into next_position
  from public.product_images where product_id = p_product;
  insert into public.product_images(product_id, url, alt, position)
    values (p_product, p_url, p_alt, next_position);
  update public.products set image_url = p_url where id = p_product and image_url is null;
  return 'added';
end;
$$;
revoke execute on function public.add_catalog_image(uuid, text, text) from public, anon, authenticated;
grant execute on function public.add_catalog_image(uuid, text, text) to service_role;
