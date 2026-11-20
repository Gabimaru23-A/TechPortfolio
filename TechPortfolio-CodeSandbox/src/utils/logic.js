export const TAMANO_PAGINA = 10;

export function filtrarProyectos(items, filtros = {cat:'Todas', tech:''}) {
  return items.filter(proyecto =>
    (filtros.cat === 'Todas' || !filtros.cat || proyecto.categoria === filtros.cat) &&
    proyecto.tecnologia.toLocaleLowerCase('es-CO').includes((filtros.tech || '').toLocaleLowerCase('es-CO').trim())
  );
}

export function paginar(items, pagina = 1, tamano = TAMANO_PAGINA) {
  const totalPages = Math.max(1, Math.ceil(items.length / tamano));
  const paginaActual = Math.max(1, Math.min(pagina, totalPages));
  const inicio = (paginaActual - 1) * tamano;
  return {totalPages, paginaActual, visibles: items.slice(inicio, inicio + tamano)};
}

const nombreValido = /^(?:\p{L}\p{M}*)+$/u;
const parteLocalValida = /^[\p{L}\p{M}\p{N}!#$%&'*+/=?^_`{|}~-]+(?:\.[\p{L}\p{M}\p{N}!#$%&'*+/=?^_`{|}~-]+)*$/u;
const etiquetaDominioValida = /^(?!-)[\p{L}\p{M}\p{N}-]{1,63}(?<!-)$/u;

function esCorreoValido(correo) {
  const partes = correo.split('@');
  if (partes.length !== 2 || correo.length > 254) return false;

  const [local, dominio] = partes;
  const etiquetas = dominio.split('.');
  return local.length <= 64 && parteLocalValida.test(local) &&
    etiquetas.length >= 2 && etiquetas.every(etiqueta => etiquetaDominioValida.test(etiqueta));
}

export function validarContacto(formulario) {
  const errores = {};

  for (const campo of ['nombre', 'apellidos']) {
    const valor = formulario[campo] || '';
    if (!valor.trim()) {
      errores[campo] = campo === 'nombre' ? 'Escribe tu nombre.' : 'Escribe tus apellidos.';
    } else if (!nombreValido.test(valor) || valor.match(/\p{L}/gu).length > 20) {
      errores[campo] = 'Usa hasta 20 letras, sin espacios.';
    }
  }

  const correo = (formulario.correo || '').trim();
  if (!correo) errores.correo = 'Escribe tu correo electrónico.';
  else if (!esCorreoValido(correo)) errores.correo = 'Escribe un correo con formato válido.';

  const telefono = formulario.telefono || '';
  if (!telefono.trim()) errores.telefono = 'Escribe tu teléfono.';
  else if (!/^\d+$/.test(telefono)) errores.telefono = 'Usa solo números, sin espacios ni símbolos.';

  if (!(formulario.descripcion || '').trim()) errores.descripcion = 'Escribe la descripción del proyecto.';
  return errores;
}
