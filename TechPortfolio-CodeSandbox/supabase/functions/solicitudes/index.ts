import { createClient } from 'npm:@supabase/supabase-js@2.119.2';
import { uuidV4, validarContacto } from '../_shared/validar-contacto.mjs';

const origenes = new Set((Deno.env.get('SOLICITUDES_ALLOWED_ORIGINS') ??
  'https://gabimaru23-a.github.io,http://localhost:5173,http://127.0.0.1:5173')
  .split(',').map(origen => origen.trim()).filter(Boolean));

function clavesInyectadas(variable: string): Record<string, string> {
  return JSON.parse(Deno.env.get(variable) || '{}');
}

const clavesPublicas = new Set([
  ...Object.values(clavesInyectadas('SUPABASE_PUBLISHABLE_KEYS')),
  Deno.env.get('SUPABASE_PUBLISHABLE_KEY'),
  Deno.env.get('SUPABASE_ANON_KEY')
].filter(Boolean));
const clavesAdmin = clavesInyectadas('SUPABASE_SECRET_KEYS');
const claveAdmin = clavesAdmin.default || Deno.env.get('SUPABASE_SECRET_KEY') ||
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const cliente = createClient(Deno.env.get('SUPABASE_URL')!, claveAdmin!, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const maximoBytes = 32_768;

async function leerCuerpo(peticion: Request): Promise<Record<string, unknown>> {
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

Deno.serve(async (peticion) => {
  const origen = peticion.headers.get('origin');
  const headers = new Headers({
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  });
  const responder = (status: number, datos: object) =>
    new Response(JSON.stringify(datos), { status, headers });

  if (origen && !origenes.has(origen)) return responder(403, { error: 'origen_no_permitido' });
  if (origen) headers.set('Access-Control-Allow-Origin', origen);
  if (peticion.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (peticion.method !== 'POST') return responder(405, { error: 'metodo_no_permitido' });
  if (!clavesPublicas.has(peticion.headers.get('apikey') ?? '')) {
    return responder(401, { error: 'clave_no_valida' });
  }

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

    const { data: codigo, error } = await cliente.rpc('registrar_solicitud', {
      p_id: id,
      p_nombre: nombre,
      p_apellidos: apellidos,
      p_correo: correo.trim(),
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
    const { data, error } = await cliente.from('solicitudes')
      .select('estado, estado_actualizado_en').eq('codigo', codigo).maybeSingle();
    if (error) return responder(500, { error: 'consulta_no_disponible' });
    if (!data) return responder(404, { error: 'solicitud_no_encontrada' });
    return responder(200, data);
  }

  return responder(400, { error: 'accion_no_valida' });
});
