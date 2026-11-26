const clave = 'techportfolio-espera-enlace';
const cambio = 'techportfolio:cambio-espera';
export const intervaloCorreo = 90_000;
let venceEnMemoria = 0;

export function proximoEnlaceCorreo() {
  try {
    return Math.max(venceEnMemoria, Number(localStorage.getItem(clave)) || 0);
  } catch {
    return venceEnMemoria;
  }
}

export function observarEsperaCorreo(actualizar) {
  function observarStorage(evento) {
    if (evento.key === clave) actualizar();
  }
  window.addEventListener('storage', observarStorage);
  window.addEventListener(cambio, actualizar);
  return () => {
    window.removeEventListener('storage', observarStorage);
    window.removeEventListener(cambio, actualizar);
  };
}

export function guardarEsperaCorreo(venceEn) {
  venceEnMemoria = Math.max(proximoEnlaceCorreo(), venceEn);
  try {
    localStorage.setItem(clave, String(venceEnMemoria));
  } catch {
    // El temporizador sigue disponible en la pestaña actual.
  }
  window.dispatchEvent(new Event(cambio));
}

export function liberarEsperaCorreo() {
  venceEnMemoria = 0;
  try {
    localStorage.removeItem(clave);
  } catch {
    // El contador en memoria ya se ha liberado.
  }
  window.dispatchEvent(new Event(cambio));
}

export function leerRetryAfter(valor, ahora = Date.now()) {
  if (!valor?.trim()) return 0;
  const plazo = /^\d+$/.test(valor.trim()) ? ahora + Number(valor) * 1000 : Date.parse(valor);
  return Number.isSafeInteger(plazo) && plazo > ahora ? plazo : 0;
}
