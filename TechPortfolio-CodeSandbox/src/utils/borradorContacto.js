import { normalizarCorreo } from '../../supabase/functions/_shared/validar-contacto.mjs';

const vigencia = 60 * 60 * 1000;
const codificador = new TextEncoder();

async function identificador(correo, tipo) {
  const datos = codificador.encode(tipo + ':' + normalizarCorreo(correo));
  const hash = await crypto.subtle.digest('SHA-256', datos);
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function operar(accion) {
  const base = await new Promise((resolver, rechazar) => {
    const solicitud = indexedDB.open('techportfolio-borradores', 1);
    solicitud.onupgradeneeded = () => {
      solicitud.result.createObjectStore('borradores').createIndex('venceEn', 'venceEn');
    };
    solicitud.onsuccess = () => resolver(solicitud.result);
    solicitud.onerror = () => rechazar(solicitud.error);
  });

  try {
    return await new Promise((resolver, rechazar) => {
      const transaccion = base.transaction('borradores', 'readwrite');
      const almacen = transaccion.objectStore('borradores');
      const caducados = almacen.index('venceEn').openCursor(IDBKeyRange.upperBound(Date.now()));
      caducados.onsuccess = () => {
        const cursor = caducados.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      const solicitud = accion(almacen);
      transaccion.oncomplete = () => resolver(solicitud.result);
      transaccion.onabort = () => rechazar(transaccion.error);
      transaccion.onerror = () => rechazar(transaccion.error);
    });
  } finally {
    base.close();
  }
}

export async function guardarBorrador(correo, tipo, borrador) {
  const plano = codificador.encode(JSON.stringify(borrador));
  if (plano.length > 32_768) return;
  const id = await identificador(correo, tipo);
  const clave = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const vector = crypto.getRandomValues(new Uint8Array(12));
  const cifrado = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: vector }, clave, plano);
  await operar(almacen => almacen.put({ clave, vector, cifrado, venceEn: Date.now() + vigencia }, id));
}

export async function leerBorrador(correo, tipo) {
  const id = await identificador(correo, tipo);
  const entrada = await operar(almacen => almacen.get(id));
  if (!entrada || entrada.venceEn <= Date.now()) return null;
  const plano = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: entrada.vector }, entrada.clave, entrada.cifrado);
  return JSON.parse(new TextDecoder().decode(plano));
}

export async function eliminarBorrador(correo, tipo) {
  const id = await identificador(correo, tipo);
  await operar(almacen => almacen.delete(id));
}
