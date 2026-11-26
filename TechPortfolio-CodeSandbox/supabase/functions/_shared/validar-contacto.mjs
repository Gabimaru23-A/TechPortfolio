const nombreValido = /^(?:\p{L}\p{M}*)+(?: (?:\p{L}\p{M}*)+)*$/u;
const parteLocalValida = /^[\p{L}\p{M}\p{N}!#$%&'*+/=?^_`{|}~-]+(?:\.[\p{L}\p{M}\p{N}!#$%&'*+/=?^_`{|}~-]+)*$/u;
const etiquetaDominioValida = /^(?!-)[\p{L}\p{M}\p{N}-]{1,63}(?<!-)$/u;

export const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizarCorreo(correo) {
  return correo.trim().toLowerCase();
}

export function esCorreoValido(correo) {
  const partes = correo.split('@');
  if (partes.length !== 2 || correo.length > 254) return false;

  const [local, dominio] = partes;
  const etiquetas = dominio.split('.');
  return local.length <= 64 && parteLocalValida.test(local) &&
    etiquetas.length >= 2 && etiquetas.every(etiqueta => etiquetaDominioValida.test(etiqueta));
}

/** @param {{nombre?: string, apellidos?: string, correo?: string, telefono?: string, descripcion?: string, empresa?: string}} formulario */
export function validarContacto(formulario) {
  /** @type {Record<string, string>} */
  const errores = {};

  for (const campo of /** @type {const} */ (['nombre', 'apellidos'])) {
    const valor = formulario[campo] || '';
    if (!valor.trim()) {
      errores[campo] = campo === 'nombre' ? 'Escribe tu nombre.' : 'Escribe tus apellidos.';
    } else if (valor.length > 80 || !nombreValido.test(valor) || (valor.match(/\p{L}/gu)?.length ?? 0) > 20) {
      errores[campo] = 'Usa hasta 20 letras. Separa los nombres con un espacio.';
    }
  }

  const correo = (formulario.correo || '').trim();
  if (!correo) errores.correo = 'Escribe tu correo electrónico.';
  else if (!esCorreoValido(correo)) errores.correo = 'Escribe un correo con formato válido.';

  const telefono = formulario.telefono || '';
  if (!telefono.trim()) errores.telefono = 'Escribe tu teléfono.';
  else if (!/^\d+$/.test(telefono)) errores.telefono = 'Usa solo números, sin espacios ni símbolos.';
  else if (telefono.length > 32) errores.telefono = 'Usa un máximo de 32 números.';

  const descripcion = formulario.descripcion || '';
  if (!descripcion.trim()) errores.descripcion = 'Escribe la descripción del proyecto.';
  else if (descripcion.length > 5000) errores.descripcion = 'Usa un máximo de 5000 caracteres.';

  if ((formulario.empresa?.length ?? 0) > 180) errores.empresa = 'Usa un máximo de 180 caracteres.';
  return errores;
}
