import { createClient, FunctionsHttpError } from '@supabase/supabase-js';
import { normalizarCorreo, uuidV4 } from '../../supabase/functions/_shared/validar-contacto.mjs';
import { estados } from '../../supabase/functions/_shared/estados.mjs';
import { guardarBorrador, leerBorrador } from './borradorContacto.js';
import { configurarSupabase } from './supabase-config.js';
import { guardarEsperaCorreo, intervaloCorreo, leerRetryAfter, proximoEnlaceCorreo } from './esperaCorreo.js';

const { configuracion } = configurarSupabase({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
});

const memoriaAuth = new Map();
const almacenamientoAuth = {
  getItem(clave) {
    if (!clave.endsWith('-code-verifier')) return memoriaAuth.get(clave) ?? null;
    try {
      const entrada = JSON.parse(localStorage.getItem(clave) ?? 'null');
      if (entrada?.venceEn > Date.now()) return entrada.valor;
      if (entrada) localStorage.removeItem(clave);
    } catch {
      return memoriaAuth.get(clave) ?? null;
    }
    return null;
  },
  setItem(clave, valor) {
    memoriaAuth.set(clave, valor);
    if (!clave.endsWith('-code-verifier')) return;
    try {
      localStorage.setItem(clave, JSON.stringify({ valor, venceEn: Date.now() + 3_600_000 }));
    } catch {
      // Si el almacenamiento está bloqueado, queda disponible para esta página.
    }
  },
  removeItem(clave) {
    memoriaAuth.delete(clave);
    if (!clave.endsWith('-code-verifier')) return;
    try {
      localStorage.removeItem(clave);
    } catch {
      // La copia en memoria ya se eliminó.
    }
  }
};

let solicitudEnCurso = false;
let limiteDetectado = false;
const cliente = configuracion ? createClient(configuracion.url, configuracion.clave, {
  global: {
    async fetch(url, opciones) {
      const respuesta = await fetch(url, opciones);
      if (opciones?.method === 'POST' && new URL(respuesta.url || url).pathname === '/auth/v1/otp') {
        const ahora = Date.now();
        const reintentar = leerRetryAfter(respuesta.headers.get('Retry-After'), ahora);
        if (respuesta.status === 429) {
          limiteDetectado = true;
          guardarEsperaCorreo(reintentar || ahora + intervaloCorreo);
        } else if (reintentar) {
          guardarEsperaCorreo(reintentar);
        }
      }
      return respuesta;
    }
  },
  auth: {
    flowType: 'pkce',
    persistSession: true,
    storage: almacenamientoAuth,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
}) : null;
export const seguimientoDisponible = Boolean(cliente);
const enlaceInvalido = 'El enlace no es válido, venció o ya se utilizó. Solicita uno nuevo.';
const avisoLimite = 'Has solicitado varios enlaces de confirmación. Por seguridad, debes esperar antes de solicitar otro.';

export class CorreoNoVerificado extends Error {
  constructor() {
    super('Confirma el correo de esta solicitud para continuar.');
  }
}

async function solicitarEnlace(email, tipo, borrador) {
  if (proximoEnlaceCorreo() > Date.now()) throw new Error(avisoLimite);

  await guardarBorrador(email, tipo, borrador).catch(() => {});
  const redirect = new URL(import.meta.env.BASE_URL, window.location.href);
  redirect.hash = '';
  redirect.search = '';
  guardarEsperaCorreo(Date.now() + intervaloCorreo);
  limiteDetectado = false;
  const respuesta = await cliente.auth.signInWithOtp({
    email, options: { shouldCreateUser: true, emailRedirectTo: redirect.href }
  }).catch(() => null);
  if (respuesta && !respuesta.error) return;
  if (limiteDetectado || respuesta?.error?.status === 429) throw new Error(avisoLimite);
  throw new Error('No pudimos enviar el enlace de confirmación. Intenta de nuevo más tarde.');
}

export async function enviarEnlaceCorreo(correo, tipo, borrador) {
  const ocupado = 'Ya estamos solicitando un enlace. Espera unos segundos.';
  if (solicitudEnCurso) throw new Error(ocupado);
  solicitudEnCurso = true;
  try {
    const email = normalizarCorreo(correo);
    if (navigator.locks) {
      return await navigator.locks.request('techportfolio:enviar-enlace', { ifAvailable: true }, async bloqueo => {
        if (!bloqueo) throw new Error(ocupado);
        await solicitarEnlace(email, tipo, borrador);
      });
    }
    await solicitarEnlace(email, tipo, borrador);
  } finally {
    solicitudEnCurso = false;
  }
}

async function completarConfirmacion(hash, codigo) {
  if (!cliente) return { error: 'El servicio de confirmación no está disponible.' };

  try {
    const { data, error } = hash
      ? await cliente.auth.verifyOtp({ token_hash: hash, type: 'email' })
      : await cliente.auth.exchangeCodeForSession(codigo);
    if (error?.name === 'AuthPKCECodeVerifierMissingError') {
      return { error: 'Este enlace debe abrirse en el mismo navegador donde lo solicitaste. Pide uno nuevo en este dispositivo para continuar.' };
    }
    const sesion = data?.session;
    const usuario = data?.user;
    if (error || data?.redirectType === 'recovery' || !sesion?.access_token || !(sesion.expires_at > Date.now() / 1000) ||
        !usuario?.email || !usuario.email_confirmed_at || usuario.is_anonymous) return { error: enlaceInvalido };

    const correo = normalizarCorreo(usuario.email);
    const [solicitud, seguimiento] = await Promise.all([
      leerBorrador(correo, 'solicitud').catch(() => null),
      leerBorrador(correo, 'seguimiento').catch(() => null)
    ]);
    return { sesion: { correo, token: sesion.access_token, venceEn: sesion.expires_at }, solicitud, seguimiento };
  } catch {
    return { error: enlaceInvalido };
  }
}

export function procesarRetornoCorreo() {
  const url = new URL(window.location.href);
  const consulta = url.searchParams;
  const fragmento = new URLSearchParams(url.hash.startsWith('#/') ? '' : url.hash.slice(1));
  const retornoEnConsulta = consulta.has('token_hash') || consulta.has('code');
  const retornoEnFragmento = fragmento.has('token_hash') || fragmento.has('code');
  const parametros = retornoEnConsulta ? consulta : fragmento;
  const hash = parametros.get('token_hash');
  const codigo = parametros.get('code');
  const error = consulta.has('error') || consulta.has('error_code') || fragmento.has('error') || fragmento.has('error_code');
  const sesionAntigua = [consulta, fragmento].some(p => p.has('access_token') || p.has('refresh_token'));
  if (!retornoEnConsulta && !retornoEnFragmento && !error && !sesionAntigua) return null;

  window.history.replaceState(window.history.state, '', url.pathname + '#/contacto');
  const valorValido = /^[\w-]{16,256}$/;
  if (error || sesionAntigua || (retornoEnConsulta && retornoEnFragmento) ||
      (hash && parametros.get('type') !== 'email') ||
      Boolean(hash) === Boolean(codigo) || !valorValido.test(hash ?? codigo ?? '')) {
    return Promise.resolve({ error: enlaceInvalido });
  }
  return completarConfirmacion(hash, codigo);
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
