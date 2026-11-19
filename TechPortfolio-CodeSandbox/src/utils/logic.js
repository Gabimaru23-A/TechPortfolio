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

const letra = /[^\p{L}\p{M} ]/gu;
const nombreValido = /^[\p{L}\p{M} ]+$/u;
const emailValido = /^[^\s@]+@(gmail|hotmail)\.com$/i;
export function limpiarValorContacto(nombre, valor) {
  if (nombre === 'nombre' || nombre === 'apellidos') return valor.replace(letra, '').slice(0,20);
  if (nombre === 'telefono') return valor.replace(/\D/g, '').slice(0,15);
  return valor;
}
export function validarContacto(formulario) {
  const errores = {};
  for (const campo of ['nombre','apellidos']) {
    const valor = formulario[campo]?.trim() || '';
    if (!valor || valor.length > 20 || !nombreValido.test(valor)) errores[campo] = 'Usa solo letras, máximo 20 caracteres.';
  }
  if (!emailValido.test((formulario.correo || '').trim())) errores.correo = 'Usa un correo @gmail.com o @hotmail.com.';
  if (!/^\d{1,15}$/.test(formulario.telefono || '')) errores.telefono = 'Ingresa solo números (1 a 15 dígitos).';
  if (!(formulario.descripcion || '').trim()) errores.descripcion = 'Escribe la descripción del proyecto.';
  if ((formulario.descripcion || '').trim().length < 20) errores.descripcion = 'La descripción debe tener al menos 20 caracteres.';
  return errores;
}
