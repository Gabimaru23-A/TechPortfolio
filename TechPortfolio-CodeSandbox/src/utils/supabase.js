import { createClient, FunctionsHttpError } from '@supabase/supabase-js';
import { uuidV4 } from '../../supabase/functions/_shared/validar-contacto.mjs';
import { configurarSupabase } from './supabase-config.js';

const { configuracion, incompleta } = configurarSupabase({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
});

const cliente = configuracion ? createClient(configuracion.url, configuracion.clave, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
}) : null;
export const seguimientoDisponible = Boolean(cliente);
export const configuracionIncompleta = incompleta;

const estados = {
  recibida: 'Recibida',
  en_revision: 'En revisión',
  en_progreso: 'En progreso',
  resuelta: 'Resuelta',
  cerrada: 'Cerrada'
};

async function invocar(cuerpo, mensaje) {
  const { data, error } = await cliente.functions.invoke('solicitudes', { body: cuerpo });
  if (!error) return data;

  if (error instanceof FunctionsHttpError) {
    const respuesta = await error.context.json().catch(() => null);
    if (respuesta?.error === 'solicitud_no_encontrada') {
      throw new Error('No encontramos una solicitud con ese código.');
    }
    if (respuesta?.error === 'limite_solicitudes') {
      throw new Error('Alcanzaste el límite de solicitudes para este correo. Intenta de nuevo más tarde.');
    }
  }

  throw new Error(mensaje);
}

export async function registrarSolicitud(id, formulario) {
  const mensaje = 'No pudimos confirmar el registro. Conservamos tus datos para que puedas reintentar.';
  const datos = await invocar({ ...formulario, accion: 'crear', id }, mensaje);
  if (typeof datos?.codigo !== 'string' || !uuidV4.test(datos.codigo)) throw new Error(mensaje);
  return datos.codigo;
}

export async function consultarSolicitud(codigo) {
  if (!uuidV4.test(codigo)) throw new Error('Escribe el código completo que recibiste con tu solicitud.');

  const mensaje = 'No pudimos consultar la solicitud. Intenta de nuevo más tarde.';
  const datos = await invocar({ accion: 'consultar', codigo }, mensaje);
  if (!Object.hasOwn(estados, datos?.estado) || typeof datos.estado_actualizado_en !== 'string') {
    throw new Error(mensaje);
  }
  const fecha = new Date(datos.estado_actualizado_en);
  if (!Number.isFinite(fecha.getTime())) throw new Error(mensaje);
  return { estado: estados[datos.estado], fecha };
}
