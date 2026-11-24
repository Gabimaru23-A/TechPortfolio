import { createClient, FunctionsHttpError } from '@supabase/supabase-js';
import { normalizarCorreo, uuidV4 } from '../../supabase/functions/_shared/validar-contacto.mjs';
import { estados } from '../../supabase/functions/_shared/estados.mjs';
import { configurarSupabase } from './supabase-config.js';

const { configuracion } = configurarSupabase({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
});

const cliente = configuracion ? createClient(configuracion.url, configuracion.clave, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
}) : null;
export const seguimientoDisponible = Boolean(cliente);

export class CorreoNoVerificado extends Error {
  constructor() {
    super('Verifica el correo de esta solicitud para continuar.');
  }
}

export async function enviarCodigoCorreo(correo) {
  const { error } = await cliente.auth.signInWithOtp({
    email: normalizarCorreo(correo),
    options: { shouldCreateUser: true }
  });
  if (error) throw new Error('No pudimos enviar el código de verificación. Intenta de nuevo más tarde.');
}

export async function verificarCorreo(correo, codigo) {
  const email = normalizarCorreo(correo);
  const { data, error } = await cliente.auth.verifyOtp({ email, token: codigo, type: 'email' });
  const sesion = data?.session;
  if (error || !sesion?.access_token || !sesion.expires_at ||
      !data.user?.email || normalizarCorreo(data.user.email) !== email) {
    throw new Error('El código de verificación es incorrecto o venció.');
  }
  return { correo: email, token: sesion.access_token, venceEn: sesion.expires_at };
}

export function tokenVerificado(sesion, correo) {
  return sesion?.correo === normalizarCorreo(correo) && sesion.venceEn > Date.now() / 1000
    ? sesion.token
    : null;
}

async function invocar(cuerpo, token, mensaje) {
  if (!token) throw new CorreoNoVerificado();
  const { data, error } = await cliente.functions.invoke('solicitudes', {
    body: cuerpo, headers: { Authorization: `Bearer ${token}` }
  });
  if (!error) return data;

  if (error instanceof FunctionsHttpError) {
    const respuesta = await error.context.json().catch(() => null);
    if (respuesta?.error === 'correo_no_verificado') {
      throw new CorreoNoVerificado();
    }
    if (respuesta?.error === 'solicitud_no_encontrada') {
      throw new Error('No encontramos una solicitud con ese código y correo.');
    }
    if (respuesta?.error === 'limite_solicitudes') {
      throw new Error('Alcanzaste el límite de solicitudes para este correo. Intenta de nuevo más tarde.');
    }
  }

  throw new Error(mensaje);
}

export async function registrarSolicitud(id, formulario, token) {
  const mensaje = 'No pudimos confirmar el registro. Conservamos tus datos para que puedas reintentar.';
  const datos = await invocar({ ...formulario, accion: 'crear', id }, token, mensaje);
  if (typeof datos?.codigo !== 'string' || !uuidV4.test(datos.codigo)) throw new Error(mensaje);
  return datos.codigo;
}

export async function consultarSolicitud(codigo, token) {
  if (!uuidV4.test(codigo)) throw new Error('Escribe el código completo que recibiste con tu solicitud.');

  const mensaje = 'No pudimos consultar la solicitud. Intenta de nuevo más tarde.';
  const datos = await invocar({ accion: 'consultar', codigo }, token, mensaje);
  if (!Object.hasOwn(estados, datos?.estado) || typeof datos.estado_actualizado_en !== 'string') {
    throw new Error(mensaje);
  }
  const fecha = new Date(datos.estado_actualizado_en);
  if (!Number.isFinite(fecha.getTime())) throw new Error(mensaje);
  return { estado: estados[datos.estado], fecha };
}
