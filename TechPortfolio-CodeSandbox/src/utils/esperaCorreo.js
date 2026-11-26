import { normalizarCorreo } from '../../supabase/functions/_shared/validar-contacto.mjs';

const prefijo = 'techportfolio-espera-enlace:';
const global = prefijo + 'proveedor';
const anterior = 'techportfolio-espera-enlace';
const cambio = 'techportfolio:cambio-espera';
export const intervaloCorreo = 90_000;
const memoria = new Map();

async function claveCorreo(correo) {
  const datos = new TextEncoder().encode(normalizarCorreo(correo));
  const hash = await crypto.subtle.digest('SHA-256', datos);
  return prefijo + Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}

function leer(clave) {
  let vence = memoria.get(clave) ?? 0;
  try {
    vence = Math.max(vence, Number(localStorage.getItem(clave)) || 0);
  } catch {
    // El almacenamiento puede estar deshabilitado.
  }
  return Number.isSafeInteger(vence) && vence > Date.now() ? vence : 0;
}

export async function proximoEnlaceCorreo(correo) {
  return Math.max(leer(global), leer(await claveCorreo(correo)));
}

export function observarEsperaCorreo(actualizar) {
  function observarStorage(evento) {
    if (evento.key?.startsWith(prefijo)) actualizar();
  }
  window.addEventListener('storage', observarStorage);
  window.addEventListener(cambio, actualizar);
  return () => {
    window.removeEventListener('storage', observarStorage);
    window.removeEventListener(cambio, actualizar);
  };
}

async function guardar(clave, venceEn) {
  const fecha = Math.max(leer(clave), venceEn);
  memoria.set(clave, fecha);
  try {
    localStorage.setItem(clave, String(fecha));
    localStorage.removeItem(anterior);
  } catch {
    // La memoria mantiene el contador durante esta pestaña.
  }
  window.dispatchEvent(new Event(cambio));
}

export async function guardarEsperaCorreo(correo, venceEn, proveedor = false) {
  await guardar(proveedor ? global : await claveCorreo(correo), venceEn);
}

export async function liberarEsperaCorreo(correo) {
  const clave = await claveCorreo(correo);
  memoria.delete(clave);
  try {
    localStorage.removeItem(clave);
  } catch {
    // La memoria ya se ha liberado.
  }
  window.dispatchEvent(new Event(cambio));
}

export function leerRetryAfter(valor, ahora = Date.now()) {
  if (!valor?.trim()) return 0;
  const plazo = /^\d+$/.test(valor.trim()) ? ahora + Number(valor) * 1000 : Date.parse(valor);
  return Number.isSafeInteger(plazo) && plazo > ahora ? plazo : 0;
}
