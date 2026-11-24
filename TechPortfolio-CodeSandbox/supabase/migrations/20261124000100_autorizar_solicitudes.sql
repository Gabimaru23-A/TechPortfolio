alter table public.solicitudes add column solicitante_id uuid;

alter table public.notificaciones_solicitud
  add column tipo text not null default 'estado' check (tipo in ('confirmacion', 'estado')),
  add column intentos integer not null default 0 check (intentos >= 0),
  add column disponible_en timestamptz,
  add column reserva uuid,
  add column ultimo_resultado text check (ultimo_resultado in ('enviada', 'rechazada', 'indeterminada'));

-- Las filas anteriores a la verificación quedan fuera del despacho automático.
alter table public.notificaciones_solicitud alter column disponible_en set default now();

create unique index notificaciones_solicitud_confirmacion_idx
  on public.notificaciones_solicitud (solicitud_id) where tipo = 'confirmacion';

create index notificaciones_solicitud_despacho_idx
  on public.notificaciones_solicitud (disponible_en, creada_en)
  where enviada_en is null and reserva is null and disponible_en is not null;

revoke all on public.solicitudes, public.notificaciones_solicitud from service_role;
revoke update (enviada_en) on public.notificaciones_solicitud from service_role;
revoke execute on function public.registrar_solicitud(uuid, text, text, text, text, text, text) from service_role;

create function public.registrar_solicitud_verificada(
  p_solicitante_id uuid,
  p_id uuid,
  p_nombre text,
  p_apellidos text,
  p_correo text,
  p_telefono text,
  p_descripcion text,
  p_empresa text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  nuevo_codigo uuid;
begin
  if p_solicitante_id is null then
    raise exception 'solicitud_distinta';
  end if;

  nuevo_codigo := public.registrar_solicitud(p_id, p_nombre, p_apellidos, p_correo, p_telefono, p_descripcion, p_empresa);

  update public.solicitudes
  set solicitante_id = p_solicitante_id
  where id = p_id and solicitante_id is null;

  if not exists (select 1 from public.solicitudes where id = p_id and solicitante_id = p_solicitante_id) then
    raise exception 'solicitud_distinta';
  end if;

  insert into public.notificaciones_solicitud (solicitud_id, tipo, estado)
  values (p_id, 'confirmacion', 'recibida')
  on conflict (solicitud_id) where tipo = 'confirmacion' do nothing;

  return nuevo_codigo;
end;
$$;

create function public.consultar_solicitud_verificada(p_codigo uuid, p_solicitante_id uuid, p_correo text)
returns table (estado text, estado_actualizado_en timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select s.estado, s.estado_actualizado_en
  from public.solicitudes s
  where s.codigo = p_codigo and p_solicitante_id is not null
    and lower(s.correo) = lower(p_correo)
    and (s.solicitante_id is null or s.solicitante_id = p_solicitante_id);
$$;

create or replace function public.preparar_notificacion_estado() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.estado_actualizado_en := now();
  if new.solicitante_id is not null then
    insert into public.notificaciones_solicitud (solicitud_id, estado)
    values (new.id, new.estado);
  end if;
  return new;
end;
$$;

create function public.reservar_notificacion(p_reserva uuid)
returns table (id uuid, tipo text, estado text, codigo uuid, nombre text, apellidos text, correo text,
  telefono text, descripcion text, empresa text)
language sql
security definer
set search_path = ''
as $$
  with siguiente as (
    select n.id
    from public.notificaciones_solicitud n
    join public.solicitudes s on s.id = n.solicitud_id
    where p_reserva is not null and s.solicitante_id is not null
      and n.enviada_en is null and n.reserva is null and n.disponible_en <= now()
    order by n.disponible_en, n.creada_en, n.id
    limit 1 for update of n skip locked
  ), reservada as (
    update public.notificaciones_solicitud n
    set reserva = p_reserva, intentos = n.intentos + 1
    from siguiente
    where n.id = siguiente.id
    returning n.id, n.tipo, n.estado, n.solicitud_id
  )
  select r.id, r.tipo, r.estado, s.codigo, s.nombre, s.apellidos, s.correo,
    case when r.tipo = 'confirmacion' then s.telefono end,
    case when r.tipo = 'confirmacion' then s.descripcion end,
    case when r.tipo = 'confirmacion' then s.empresa end
  from reservada r join public.solicitudes s on s.id = r.solicitud_id;
$$;

create function public.finalizar_notificacion(p_id uuid, p_reserva uuid, p_resultado text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with actualizada as (
    update public.notificaciones_solicitud n
    set reserva = null,
      ultimo_resultado = p_resultado,
      enviada_en = case when p_resultado = 'enviada' then now() end,
      disponible_en = case when p_resultado = 'rechazada' and n.intentos < 6
        then now() + make_interval(mins => 1 << (n.intentos - 1)) end
    where n.id = p_id and n.reserva = p_reserva and n.enviada_en is null
      and p_resultado in ('enviada', 'rechazada', 'indeterminada')
    returning n.id
  )
  select exists (select 1 from actualizada);
$$;

revoke all on function public.registrar_solicitud_verificada(uuid, uuid, text, text, text, text, text, text),
  public.consultar_solicitud_verificada(uuid, uuid, text), public.reservar_notificacion(uuid),
  public.finalizar_notificacion(uuid, uuid, text) from public, anon, authenticated;

grant execute on function public.registrar_solicitud_verificada(uuid, uuid, text, text, text, text, text, text),
  public.consultar_solicitud_verificada(uuid, uuid, text), public.reservar_notificacion(uuid),
  public.finalizar_notificacion(uuid, uuid, text) to service_role;
