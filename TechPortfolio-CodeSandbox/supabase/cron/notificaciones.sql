do $configuracion$
declare
  trabajo bigint;
begin
  select jobid into strict trabajo
  from cron.job
  where jobname = 'techportfolio-notificaciones';

  perform cron.alter_job(
    trabajo,
    schedule := '* * * * *',
    active := true,
    command := $comando$
      do $despacho$
      declare
        token text;
        invocacion uuid;
        firma text;
        peticion bigint;
      begin
        select decrypted_secret into token
        from vault.decrypted_secrets
        where name = 'techportfolio_notificaciones_job_token';

        if token is null or char_length(token) < 32 then
          raise exception 'Falta el token del despachador en Vault';
        end if;

        delete from public.invocaciones_notificaciones
        where creada_en < now() - interval '1 day';

        invocacion := gen_random_uuid();
        firma := encode(extensions.hmac('techportfolio:notificar-solicitudes:' || invocacion::text, token, 'sha256'), 'hex');
        peticion := net.http_post(
          url := 'https://zuezuzibfkodtjnvlhzw.supabase.co/functions/v1/notificar-solicitudes',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'X-Notificaciones-Id', invocacion,
            'X-Notificaciones-Firma', firma
          ),
          body := '{}'::jsonb,
          timeout_milliseconds := 20000
        );

        insert into public.invocaciones_notificaciones (id, peticion_id)
        values (invocacion, peticion);
      end;
      $despacho$;
    $comando$
  );
end;
$configuracion$;
