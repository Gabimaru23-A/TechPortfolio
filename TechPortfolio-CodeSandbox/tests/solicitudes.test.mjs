import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { manejarSolicitud } from '../supabase/functions/solicitudes/manejador.mjs';
import { procesarNotificacion } from '../supabase/functions/notificar-solicitudes/manejador.mjs';
import { uuidV4 } from '../supabase/functions/_shared/validar-contacto.mjs';

const origen = 'https://gabimaru23-a.github.io';
const claveCliente = 'sb_publishable_solo_pruebas';
const tokenTarea = 'token-dedicado-exclusivo-para-pruebas-locales';
const correo = 'formulario+prueba@example.test';
const rpc = {
  registrar_solicitud_verificada: ['p_solicitante_id', 'p_id', 'p_nombre', 'p_apellidos', 'p_correo',
    'p_telefono', 'p_descripcion', 'p_empresa'],
  consultar_solicitud_verificada: ['p_codigo', 'p_solicitante_id', 'p_correo'],
  consumir_invocacion_notificaciones: ['p_id'],
  reservar_notificacion: ['p_reserva'],
  finalizar_notificacion: ['p_id', 'p_reserva', 'p_resultado']
};
const retornaFila = new Set(['consultar_solicitud_verificada', 'reservar_notificacion']);

function comoRol(db, rol, sql, parametros) {
  return db.transaction(async tx => {
    await tx.exec(`set local role ${rol}`);
    return tx.query(sql, parametros);
  });
}

function clienteLocal(db, sesiones) {
  return {
    auth: {
      getUser: async token => ({ data: { user: sesiones.get(token)?.user } }),
      getClaims: async token => ({ data: { claims: sesiones.get(token)?.claims } })
    },
    async rpc(nombre, parametros) {
      const orden = rpc[nombre];
      assert.ok(orden);
      const entradas = orden.map(campo => parametros[campo]);
      const variables = orden.map((_, indice) => `$${indice + 1}`).join(',');
      const llamada = `public.${nombre}(${variables})`;
      const query = retornaFila.has(nombre) ? `select * from ${llamada}` : `select ${llamada} as resultado`;
      try {
        const { rows } = await comoRol(db, 'service_role', query, entradas);
        return { data: retornaFila.has(nombre) ? rows : rows[0].resultado };
      } catch (error) {
        return { error };
      }
    }
  };
}

function identidad(correo, metodo = 'otp') {
  const id = randomUUID();
  return {
    user: { id, email: correo, email_confirmed_at: '2026-11-24T18:00:00Z' },
    claims: { sub: id, role: 'authenticated', email: correo, amr: [{ method: metodo }] }
  };
}

async function configurarCronLocal(db) {
  await db.exec(`
    create schema extensions;
    create extension pgcrypto with schema extensions;
    create schema vault;
    create table vault.decrypted_secrets (name text primary key, decrypted_secret text not null);
    create schema cron;
    create table cron.job (jobid bigint primary key, jobname text, schedule text, active boolean, command text);
    insert into cron.job values (1, 'techportfolio-notificaciones', '0 * * * *', false, '');
    create function cron.alter_job(job_id bigint, schedule text, active boolean, command text)
    returns void language sql as $$
      update cron.job set schedule = $2, active = $3, command = $4 where jobid = $1;
    $$;
    create schema net;
    create table net.peticiones (
      id bigint generated always as identity primary key, url text, headers jsonb, body jsonb, timeout_millis integer
    );
    create function net.http_post(url text, headers jsonb, body jsonb, timeout_milliseconds integer)
    returns bigint language sql as $$
      insert into net.peticiones (url, headers, body, timeout_millis)
      values ($1, $2, $3, $4) returning id;
    $$;
  `);
  await db.exec(await readFile(new URL('../supabase/cron/notificaciones.sql', import.meta.url), 'utf8'));
  const { rows: [trabajo] } = await db.query('select * from cron.job');
  assert.equal(trabajo.jobid, 1);
  assert.equal(trabajo.schedule, '* * * * *');
  assert.equal(trabajo.active, true);
  await assert.rejects(db.exec(trabajo.command), /Falta el token del despachador en Vault/);
  await db.query('insert into vault.decrypted_secrets values ($1, $2)', ['techportfolio_notificaciones_job_token', tokenTarea]);

  return async () => {
    await db.exec(trabajo.command);
    const { rows: [peticion] } = await db.query(`
      select p.headers, p.url, p.timeout_millis, i.id
      from net.peticiones p join public.invocaciones_notificaciones i on p.id = i.peticion_id
      order by p.id desc limit 1
    `);
    assert.equal(new URL(peticion.url).pathname, '/functions/v1/notificar-solicitudes');
    assert.equal(peticion.timeout_millis, 20_000);
    assert.equal(peticion.headers['X-Notificaciones-Id'], peticion.id);
    assert.equal(JSON.stringify(peticion.headers).includes(tokenTarea), false);
    return peticion.headers;
  };
}

test('registro y entrega usan PostgreSQL real, verifican al titular y protegen la cola', async t => {
  const db = new PGlite({ extensions: { pgcrypto } });
  t.after(() => db.close());
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
  const aplicar = async archivo => db.exec(await readFile(new URL(`../supabase/migrations/${archivo}`, import.meta.url), 'utf8'));
  await aplicar('20261124000000_solicitudes.sql');
  const correoAnterior = 'solicitud-anterior@example.test';
  const anterior = await db.query('select public.registrar_solicitud($1,$2,$3,$4,$5,$6,null) as codigo',
    [randomUUID(), 'Ana', 'Osorio', correoAnterior, '2025550123', 'Solicitud previa a la verificación.']);
  const codigoAnterior = anterior.rows[0].codigo;
  await db.query("update public.solicitudes set estado = 'en_revision' where codigo = $1", [codigoAnterior]);
  await aplicar('20261124000100_autorizar_solicitudes.sql');
  await aplicar('20261125000000_invocaciones_notificaciones.sql');
  const encolarDespacho = await configurarCronLocal(db);
  assert.deepEqual((await db.query('select estado, disponible_en from public.notificaciones_solicitud')).rows,
    [{ estado: 'en_revision', disponible_en: null }]);
  for (const rol of ['anon', 'authenticated', 'service_role']) {
    await assert.rejects(comoRol(db, rol, 'select * from public.solicitudes'), /permission denied/);
    await assert.rejects(comoRol(db, rol, 'select * from public.notificaciones_solicitud'), /permission denied/);
    await assert.rejects(comoRol(db, rol, 'select * from public.invocaciones_notificaciones'), /permission denied/);
    await assert.rejects(comoRol(db, rol, 'select public.registrar_solicitud(null,null,null,null,null,null,null)'), /permission denied/);
    await assert.rejects(comoRol(db, rol, "update public.solicitudes set estado = 'resuelta'"), /permission denied/);
    await assert.rejects(comoRol(db, rol, 'update public.notificaciones_solicitud set enviada_en = now()'), /permission denied/);
  }
  await assert.rejects(comoRol(db, 'authenticated', 'select public.reservar_notificacion(null)'), /permission denied/);
  await assert.rejects(comoRol(db, 'authenticated', 'select public.consumir_invocacion_notificaciones(null)'), /permission denied/);

  const titular = identidad(correo);
  const sesiones = new Map([
    ['valid.owner.token', titular],
    ['valid.other.token', identidad('otra-persona@example.test')],
    ['valid.legacy.token', identidad(correoAnterior)],
    ['valid.different.account', identidad(correo)],
    ['valid.password.token', identidad(correo, 'password')]
  ]);
  const cliente = clienteLocal(db, sesiones);
  const call = (datos, token) => manejarSolicitud(new Request('https://edge.example.test/solicitudes', {
    method: 'POST',
    headers: { apikey: claveCliente, authorization: token ? `Bearer ${token}` : '', origin: origen },
    body: JSON.stringify(datos)
  }), { cliente, clavesPublicas: new Set([claveCliente]), origenes: new Set([origen]) });
  const transmitidos = [];
  const despacho = (headers, payload = {}, respuesta = new Response('OK')) =>
    procesarNotificacion(new Request('https://edge.example.test/notificar-solicitudes', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    }), {
      cliente, token: tokenTarea,
      emailJS: { serviceId: 'servicio-pruebas', publicKey: 'publica-pruebas', privateKey: 'privada-pruebas' },
      solicitar: async (_, init) => {
        transmitidos.push(JSON.parse(init.body));
        return respuesta;
      }
    });

  const datos = { accion: 'crear', id: randomUUID(), nombre: 'Café', apellidos: 'Muñoz', correo,
    telefono: '2025550123', descripcion: 'Validación de registro.', empresa: '', estado: 'resuelta', codigo: randomUUID() };
  assert.equal((await call(datos)).status, 401);
  assert.equal((await call(datos, 'fraudulent.jwt.token')).status, 401);
  assert.equal((await call(datos, 'valid.password.token')).status, 401);
  assert.equal((await call(datos, 'valid.other.token')).status, 403);
  assert.equal((await db.query('select count(*) as total from public.solicitudes where solicitante_id is not null')).rows[0].total, 0);

  const creada = await call(datos, 'valid.owner.token');
  assert.equal(creada.status, 200, await creada.clone().text());
  const { codigo } = await creada.json();
  assert.match(codigo, uuidV4);
  assert.notEqual(codigo, datos.codigo);
  assert.notEqual(codigo, datos.id);
  assert.deepEqual(await (await call(datos, 'valid.owner.token')).json(), { codigo });
  assert.equal((await call(datos, 'valid.different.account')).status, 409);
  assert.equal((await db.query("select count(*) as total from public.notificaciones_solicitud where tipo = 'confirmacion'")).rows[0].total, 1);
  const persisted = (await db.query('select codigo, correo, estado, solicitante_id from public.solicitudes where codigo = $1', [codigo])).rows[0];
  assert.deepEqual(persisted, { codigo, correo, estado: 'recibida', solicitante_id: titular.user.id });

  const consulta = { accion: 'consultar', codigo };
  assert.equal((await call(consulta)).status, 401);
  assert.equal((await call(consulta, 'valid.other.token')).status, 404);
  assert.equal((await call(consulta, 'valid.different.account')).status, 404);
  const vista = await (await call(consulta, 'valid.owner.token')).json();
  assert.equal(vista.estado, 'recibida');
  assert.deepEqual(Object.keys(vista).sort(), ['estado', 'estado_actualizado_en']);
  const consultaAnterior = { accion: 'consultar', codigo: codigoAnterior };
  assert.equal((await call(consultaAnterior)).status, 401);
  assert.equal((await call(consultaAnterior, 'valid.owner.token')).status, 404);
  assert.equal((await (await call(consultaAnterior, 'valid.legacy.token')).json()).estado, 'en_revision');

  assert.equal((await despacho({ 'x-notificaciones-token': claveCliente }, datos)).status, 401);
  const vencida = await encolarDespacho();
  await db.query("update public.invocaciones_notificaciones set creada_en = now() - interval '2 minutes' where id = $1",
    [vencida['X-Notificaciones-Id']]);
  assert.equal((await despacho(vencida)).status, 409);
  assert.equal(transmitidos.length, 0);
  const firma = await encolarDespacho();
  assert.equal((await despacho({ ...firma, 'X-Notificaciones-Firma': '0'.repeat(64) })).status, 401);
  const intentos = await Promise.all([despacho(firma, { email: 'ajeno@example.test', estado: 'resuelta' }), despacho(firma)]);
  assert.deepEqual(intentos.map(respuesta => respuesta.status).sort(), [200, 409]);
  assert.equal(transmitidos.length, 1);
  assert.deepEqual(await (await despacho(await encolarDespacho())).json(), { procesadas: 0 });
  assert.equal(transmitidos[0].template_id, 'template_72768ef');
  assert.equal(transmitidos[0].template_params.codigo, codigo);
  assert.equal(transmitidos[0].template_params.email, correo);
  assert.equal(transmitidos[0].template_params.descripcion, datos.descripcion);
  assert.equal(transmitidos[0].template_params.estado, 'Recibida');

  await db.query("update public.solicitudes set estado = 'en_revision' where codigo = $1", [codigo]);
  const actualizado = await (await call(consulta, 'valid.owner.token')).json();
  assert.equal(actualizado.estado, 'en_revision');
  assert.equal((await call(consulta, 'valid.other.token')).status, 404);
  assert.deepEqual(await (await despacho(await encolarDespacho())).json(), { procesadas: 1, resultado: 'enviada' });
  assert.equal(transmitidos[1].template_params.codigo, codigo);
  assert.equal(transmitidos[1].template_params.estado, 'En revisión');
  assert.equal(Object.hasOwn(transmitidos[1].template_params, 'descripcion'), false);

  const segunda = await (await call({ ...datos, id: randomUUID() }, 'valid.owner.token')).json();
  assert.match(segunda.codigo, uuidV4);
  assert.notEqual(segunda.codigo, codigo);
  const rechazada = await despacho(await encolarDespacho(), {}, new Response('Límite de solicitudes', { status: 429 }));
  assert.deepEqual(await rechazada.json(), { procesadas: 1, resultado: 'rechazada' });
  assert.deepEqual(await (await despacho(await encolarDespacho())).json(), { procesadas: 0 });
  await db.exec("update public.notificaciones_solicitud set disponible_en = now() where ultimo_resultado = 'rechazada'");
  const incierta = await despacho(await encolarDespacho(), {}, new Response('Error temporal', { status: 503 }));
  assert.deepEqual(await incierta.json(), { procesadas: 1, resultado: 'indeterminada' });
  assert.deepEqual(await (await despacho(await encolarDespacho())).json(), { procesadas: 0 });
  assert.equal((await db.query('select count(*) as total from public.solicitudes')).rows[0].total, 3);
});
