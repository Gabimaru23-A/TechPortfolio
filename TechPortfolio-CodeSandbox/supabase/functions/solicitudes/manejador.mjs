import { normalizarCorreo, uuidV4, validarContacto } from '../_shared/validar-contacto.mjs';

const maximoBytes = 32_768;

async function leerCuerpo(peticion) {
  const lector = peticion.body?.getReader();
  if (!lector) throw new Error('cuerpo_vacio');

  const decodificador = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0;
  let contenido = '';
  try {
    while (true) {
      const { done, value } = await lector.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maximoBytes) throw new Error('cuerpo_extenso');
      contenido += decodificador.decode(value, { stream: true });
    }
    const datos = JSON.parse(contenido + decodificador.decode());
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) throw new Error('cuerpo_invalido');
    return datos;
  } catch (error) {
    await lector.cancel().catch(() => {});
    throw error;
  }
}

async function solicitanteVerificado(cliente, peticion) {
  const token = /^Bearer (\S+)$/i.exec(peticion.headers.get('authorization') ?? '')?.[1];
  if (!token || token.split('.').length !== 3) return null;

  const { data: usuario, error } = await cliente.auth.getUser(token);
  const user = usuario?.user;
  if (error || !user?.email_confirmed_at || !user.email || user.is_anonymous || !uuidV4.test(user.id)) return null;

  const verificacion = await cliente.auth.getClaims(token);
  const claims = verificacion.data?.claims;
  const correo = normalizarCorreo(user.email);
  if (verificacion.error || claims?.sub !== user.id || claims.role !== 'authenticated' ||
      typeof claims.email !== 'string' || normalizarCorreo(claims.email) !== correo ||
      !Array.isArray(claims.amr) || !claims.amr.some(metodo => metodo.method === 'otp')) return null;

  return { id: user.id, correo };
}

export async function manejarSolicitud(peticion, { cliente, clavesPublicas, origenes }) {
  const origen = peticion.headers.get('origin');
  const headers = new Headers({
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  });
  const responder = (status, datos) =>
    new Response(JSON.stringify(datos), { status, headers });

  if (origen && !origenes.has(origen)) return responder(403, { error: 'origen_no_permitido' });
  if (origen) headers.set('Access-Control-Allow-Origin', origen);
  if (peticion.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (peticion.method !== 'POST') return responder(405, { error: 'metodo_no_permitido' });
  if (!clavesPublicas.has(peticion.headers.get('apikey') ?? '')) {
    return responder(401, { error: 'clave_no_valida' });
  }
  const solicitante = await solicitanteVerificado(cliente, peticion);
  if (!solicitante) return responder(401, { error: 'correo_no_verificado' });

  let datos;
  try {
    datos = await leerCuerpo(peticion);
  } catch {
    return responder(400, { error: 'datos_invalidos' });
  }

  if (datos.accion === 'crear') {
    const { id, nombre, apellidos, correo, telefono, descripcion, empresa = '' } = datos;
    if (typeof id !== 'string' || !uuidV4.test(id) ||
        typeof nombre !== 'string' || typeof apellidos !== 'string' || typeof correo !== 'string' ||
        typeof telefono !== 'string' || typeof descripcion !== 'string' || typeof empresa !== 'string' ||
        Object.keys(validarContacto({ nombre, apellidos, correo, telefono, descripcion, empresa })).length) {
      return responder(400, { error: 'datos_invalidos' });
    }

    if (normalizarCorreo(correo) !== solicitante.correo) return responder(403, { error: 'correo_no_verificado' });

    const { data: codigo, error } = await cliente.rpc('registrar_solicitud_verificada', {
      p_solicitante_id: solicitante.id,
      p_id: id,
      p_nombre: nombre,
      p_apellidos: apellidos,
      p_correo: solicitante.correo,
      p_telefono: telefono,
      p_descripcion: descripcion,
      p_empresa: empresa.trim() ? empresa : null
    });
    if (error?.message === 'limite_solicitudes') return responder(429, { error: 'limite_solicitudes' });
    if (error?.message === 'solicitud_distinta') return responder(409, { error: 'solicitud_distinta' });
    if (error || !codigo) return responder(500, { error: 'registro_no_disponible' });

    return responder(200, { codigo });
  }

  if (datos.accion === 'consultar') {
    const { codigo } = datos;
    if (typeof codigo !== 'string' || !uuidV4.test(codigo)) {
      return responder(400, { error: 'codigo_invalido' });
    }
    const { data, error } = await cliente.rpc('consultar_solicitud_verificada', {
      p_codigo: codigo, p_solicitante_id: solicitante.id, p_correo: solicitante.correo
    });
    if (error) return responder(500, { error: 'consulta_no_disponible' });
    if (!data?.length) return responder(404, { error: 'solicitud_no_encontrada' });
    const { estado, estado_actualizado_en } = data[0];
    return responder(200, { estado, estado_actualizado_en });
  }

  return responder(400, { error: 'accion_no_valida' });
}
