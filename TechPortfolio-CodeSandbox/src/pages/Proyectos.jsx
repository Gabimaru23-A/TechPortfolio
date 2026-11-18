import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import PageHeading from '../components/PageHeading.jsx';
import { Pagination, ProjectCard, ProjectDetailsProvider } from '../components/ProjectCatalog.jsx';

const PROYECTOS_POR_PAGINA = 10;
const FILTROS_INICIALES = { categoria: '', tecnologia: '' };
const CAMPOS_DE_TEXTO = ['id', 'nombre', 'categoria', 'tecnologia', 'estado', 'fecha', 'descripcion', 'imagen'];

function catalogoValido(data) {
  return Array.isArray(data) && data.every(proyecto =>
    proyecto &&
    CAMPOS_DE_TEXTO.every(campo => typeof proyecto[campo] === 'string' && proyecto[campo].trim()) &&
    Number.isFinite(Date.parse(proyecto.fecha)) &&
    (proyecto.enlace === null || typeof proyecto.enlace === 'string')
  );
}

function ProjectFilters({ categories, onApply }) {
  const [borrador, setBorrador] = useState(FILTROS_INICIALES);

  function actualizarFiltro(evento) {
    const { name, value } = evento.target;
    setBorrador(anterior => ({ ...anterior, [name]: value }));
  }

  function aplicarFiltros(evento) {
    evento.preventDefault();
    onApply({
      categoria: borrador.categoria,
      tecnologia: borrador.tecnologia.trim().toLocaleLowerCase('es-CO'),
    });
  }

  function limpiarFiltros() {
    setBorrador(FILTROS_INICIALES);
    onApply(FILTROS_INICIALES);
  }

  return (
    <form className="card filters" aria-label="Filtros de proyectos" onSubmit={aplicarFiltros}>
      <label className="field">
        Categoría
        <span className="select-wrap">
          <select name="categoria" value={borrador.categoria} onChange={actualizarFiltro}>
            <option value="">Todas las categorías</option>
            {categories.map(categoria => <option key={categoria}>{categoria}</option>)}
          </select>
          <ChevronDown size={17} aria-hidden="true" />
        </span>
      </label>
      <label className="field">
        Tecnología
        <input type="search" name="tecnologia" value={borrador.tecnologia} onChange={actualizarFiltro} placeholder="React, JavaScript…" />
      </label>
      <div className="button-group filter-actions">
        <button type="submit" className="button button-primary">Filtrar</button>
        <button type="button" className="button button-secondary" onClick={limpiarFiltros}>Limpiar filtros</button>
      </div>
    </form>
  );
}

export default function Proyectos() {
  const [catalogo, setCatalogo] = useState(null);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [pagina, setPagina] = useState(1);
  const encabezadoResultados = useRef(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`${import.meta.env.BASE_URL}data/proyectos.json`, { signal: controller.signal })
      .then(respuesta => {
        if (!respuesta.ok) throw new Error('Error al cargar el catálogo');
        return respuesta.json();
      })
      .then(data => {
        if (!catalogoValido(data)) throw new Error('Formato de catálogo inválido');
        if (!controller.signal.aborted) setCatalogo({ proyectos: data });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setCatalogo({ error: 'No se pudo cargar el catálogo. Recarga la página para volver a intentarlo.' });
        }
      });

    return () => controller.abort();
  }, []);

  function aplicarFiltros(nuevosFiltros) {
    setFiltros(nuevosFiltros);
    setPagina(1);
  }

  function cambiarPagina(numero) {
    if (numero === pagina) return;
    setPagina(numero);
    encabezadoResultados.current.focus();
    encabezadoResultados.current.scrollIntoView({ block: 'start' });
  }

  const proyectos = catalogo?.proyectos ?? [];
  const categorias = [...new Set(proyectos.map(proyecto => proyecto.categoria))].sort((a, b) => a.localeCompare(b, 'es-CO'));
  const resultados = proyectos.filter(proyecto =>
    (!filtros.categoria || proyecto.categoria === filtros.categoria) &&
    proyecto.tecnologia.toLocaleLowerCase('es-CO').includes(filtros.tecnologia)
  );
  const paginas = Math.ceil(resultados.length / PROYECTOS_POR_PAGINA);
  const inicio = (pagina - 1) * PROYECTOS_POR_PAGINA;
  const visibles = resultados.slice(inicio, inicio + PROYECTOS_POR_PAGINA);
  const resumen = resultados.length
    ? `${inicio + 1}–${inicio + visibles.length} de ${resultados.length} ${resultados.length === 1 ? 'proyecto' : 'proyectos'}`
    : '0 proyectos';

  return (
    <div className="container section page">
      <PageHeading title="Proyectos">
        Explora mis propuestas académicas de desarrollo web, soporte TI, redes y calidad de software.
      </PageHeading>
      {!catalogo && <p className="feedback" role="status">Cargando proyectos…</p>}
      {catalogo?.error && <p className="feedback" role="alert">{catalogo.error}</p>}
      {catalogo?.proyectos && (
        <ProjectDetailsProvider>
          <ProjectFilters categories={categorias} onApply={aplicarFiltros} />
          <section aria-labelledby="resultados">
            <div className="results-heading">
              <h2 ref={encabezadoResultados} id="resultados" tabIndex={-1}>Catálogo de proyectos</h2>
              <p role="status">{resumen}</p>
            </div>
            {visibles.length ? (
              <div className="projects-grid">
                {visibles.map(proyecto => <ProjectCard key={proyecto.id} project={proyecto} />)}
              </div>
            ) : (
              <p className="feedback">No se encontraron proyectos para esos filtros.</p>
            )}
            {paginas > 1 && <Pagination page={pagina} totalPages={paginas} onPageChange={cambiarPagina} />}
          </section>
        </ProjectDetailsProvider>
      )}
    </div>
  );
}
