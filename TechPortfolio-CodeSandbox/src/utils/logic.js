export { validarContacto } from '../../supabase/functions/_shared/validar-contacto.mjs';

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
