create table public.solicitudes (
  id uuid primary key,
  codigo uuid not null unique default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 1 and 80),
  apellidos text not null check (char_length(apellidos) between 1 and 80),
  correo text not null check (char_length(correo) between 3 and 254),
  telefono text not null check (telefono ~ '^[0-9]{1,32}$'),
  descripcion text not null check (char_length(descripcion) between 1 and 5000),
  empresa text check (char_length(empresa) <= 180),
  estado text not null default 'recibida'
    check (estado in ('recibida', 'en_revision', 'en_progreso', 'resuelta', 'cerrada')),
  creada_en timestamptz not null default now(),
  estado_actualizado_en timestamptz not null default now()
);

create index solicitudes_correo_creada_idx on public.solicitudes (lower(correo), creada_en);

create table public.notificaciones_solicitud (
  id uuid primary key default gen_random_uuid(),
  solicitud_id uuid not null references public.solicitudes(id) on delete cascade,
  estado text not null,
  creada_en timestamptz not null default now(),
  enviada_en timestamptz
);

create index notificaciones_solicitud_pendientes_idx
  on public.notificaciones_solicitud (creada_en) where enviada_en is null;

alter table public.solicitudes enable row level security;
alter table public.notificaciones_solicitud enable row level security;
revoke all on public.solicitudes, public.notificaciones_solicitud from public, anon, authenticated, service_role;
grant select, insert on public.solicitudes to service_role;
grant select, update (enviada_en) on public.notificaciones_solicitud to service_role;

create function public.registrar_solicitud(
  p_id uuid,
  p_nombre text,
  p_apellidos text,
  p_correo text,
  p_telefono text,
  p_descripcion text,
  p_empresa text
) returns uuid
language plpgsql
set search_path = ''
as $$
declare
  existente public.solicitudes%rowtype;
  nuevo_codigo uuid;
begin
  -- Serializa los reintentos y aplica el límite por correo dentro de la transacción.
  perform pg_advisory_xact_lock(1, hashtext(p_id::text));
  select * into existente from public.solicitudes where id = p_id;
  if found then
    if row(existente.nombre, existente.apellidos, existente.correo, existente.telefono, existente.descripcion, existente.empresa)
        is distinct from row(p_nombre, p_apellidos, p_correo, p_telefono, p_descripcion, p_empresa) then
      raise exception 'solicitud_distinta';
    end if;
    return existente.codigo;
  end if;

  perform pg_advisory_xact_lock(2, hashtext(lower(p_correo)));
  if (select count(*) from public.solicitudes
      where lower(correo) = lower(p_correo) and creada_en >= now() - interval '1 hour') >= 5 then
    raise exception 'limite_solicitudes';
  end if;

  insert into public.solicitudes (id, nombre, apellidos, correo, telefono, descripcion, empresa)
  values (p_id, p_nombre, p_apellidos, p_correo, p_telefono, p_descripcion, p_empresa)
  returning codigo into nuevo_codigo;
  return nuevo_codigo;
end;
$$;

revoke all on function public.registrar_solicitud(uuid, text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.registrar_solicitud(uuid, text, text, text, text, text, text) to service_role;

create function public.preparar_notificacion_estado() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.estado_actualizado_en := now();
  insert into public.notificaciones_solicitud (solicitud_id, estado)
  values (new.id, new.estado);
  return new;
end;
$$;

revoke all on function public.preparar_notificacion_estado() from public, anon, authenticated, service_role;
create trigger solicitudes_cambio_estado
  before update of estado on public.solicitudes
  for each row
  when (old.estado is distinct from new.estado)
  execute function public.preparar_notificacion_estado();
