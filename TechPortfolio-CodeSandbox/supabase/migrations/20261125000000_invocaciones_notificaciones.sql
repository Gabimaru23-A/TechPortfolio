create table public.invocaciones_notificaciones (
  id uuid primary key,
  peticion_id bigint not null,
  creada_en timestamptz not null default now(),
  usada_en timestamptz
);

create index invocaciones_notificaciones_creada_idx
  on public.invocaciones_notificaciones (creada_en);

alter table public.invocaciones_notificaciones enable row level security;
revoke all on public.invocaciones_notificaciones from public, anon, authenticated, service_role;

create function public.consumir_invocacion_notificaciones(p_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with consumida as (
    update public.invocaciones_notificaciones
    set usada_en = now()
    where id = p_id
      and usada_en is null
      and creada_en > now() - interval '90 seconds'
    returning id
  )
  select exists (select 1 from consumida);
$$;

revoke all on function public.consumir_invocacion_notificaciones(uuid) from public, anon, authenticated;
grant execute on function public.consumir_invocacion_notificaciones(uuid) to service_role;
