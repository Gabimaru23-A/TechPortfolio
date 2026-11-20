import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import PageHeading from '../components/PageHeading.jsx';
import Pagination from '../components/Pagination.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import ProjectFilters from '../components/ProjectFilters.jsx';
import ProjectSidebar from '../components/ProjectSidebar.jsx';
import { usePortfolio } from '../context/PortfolioContext.jsx';
import { filtrarProyectos, paginar, TAMANO_PAGINA } from '../utils/logic.js';

export default function Proyectos() {
  const { catalogo, cargando, error, reintentar } = usePortfolio();
  const [parametros, setParametros] = useSearchParams();
  const { state } = useLocation();
  const navegar = useNavigate();
  const [filtros, setFiltros] = useState({ cat: 'Todas', tech: '' });
  const [pagina, setPagina] = useState(1);
  const tituloResultados = useRef(null);
  const ultimoDetalle = useRef(null);

  const idProyecto = parametros.get('proyecto');
  const proyectoSeleccionado = catalogo.find(proyecto => proyecto.id === idProyecto);
  const idSeleccionado = proyectoSeleccionado?.id;
  const categorias = ['Todas', ...new Set(catalogo.map(proyecto => proyecto.categoria))];
  const resultados = filtrarProyectos(catalogo, filtros);
  const indiceSeleccionado = resultados.findIndex(proyecto => proyecto.id === idSeleccionado);
  const paginaDelDetalle = indiceSeleccionado === -1 ? null : Math.floor(indiceSeleccionado / TAMANO_PAGINA) + 1;
  const { totalPages, visibles, paginaActual } = paginar(resultados, paginaDelDetalle ?? pagina);

  useEffect(() => {
    if (idSeleccionado) {
      ultimoDetalle.current = idSeleccionado;
      if (paginaDelDetalle) setPagina(paginaDelDetalle);
    } else if (ultimoDetalle.current) {
      const activador = document.getElementById(`detalle-${ultimoDetalle.current}`);
      (activador || tituloResultados.current)?.focus();
      ultimoDetalle.current = null;
    }
  }, [idSeleccionado, paginaDelDetalle]);

  function aplicarFiltros(nuevosFiltros) {
    setFiltros(nuevosFiltros);
    setPagina(1);
  }

  function cambiarPagina(numero) {
    setPagina(numero);
    tituloResultados.current?.focus();
  }

  function abrirDetalle(proyecto) {
    const nuevosParametros = new URLSearchParams(parametros);
    nuevosParametros.set('proyecto', proyecto.id);
    setParametros(nuevosParametros, { state: { detalleDesdeCatalogo: proyecto.id } });
  }

  function cerrarDetalle() {
    if (state?.detalleDesdeCatalogo === idProyecto) {
      navegar(-1);
      return;
    }

    const nuevosParametros = new URLSearchParams(parametros);
    nuevosParametros.delete('proyecto');
    setParametros(nuevosParametros, { replace: true });
  }

  return (
    <section className="container section page">
      <PageHeading title="Catálogo de" emphasis="proyectos">
        Explora soluciones de desarrollo web, soporte y calidad de software. Las propuestas conceptuales describen aplicaciones posibles.
      </PageHeading>
      {cargando && <p className="empty" role="status">Cargando catálogo…</p>}
      {error && (
        <div className="empty catalog-status">
          <p role="alert">{error}</p>
          <button className="btn blue" type="button" onClick={reintentar}>Reintentar</button>
        </div>
      )}
      {!cargando && !error && (
        <>
          {idProyecto && !proyectoSeleccionado && (
            <p className="empty" role="status">La ficha solicitada no está disponible en el catálogo.</p>
          )}
          <ProjectFilters categorias={categorias} alAplicar={aplicarFiltros} />
          <div className="section-row">
            <h2 ref={tituloResultados} tabIndex={-1}>Proyectos disponibles</h2>
            <span className="count" role="status">
              {resultados.length} {resultados.length === 1 ? 'resultado' : 'resultados'}
            </span>
          </div>
          {resultados.length === 0 ? (
            <p className="empty" role="status">No se encontraron proyectos con esos filtros.</p>
          ) : (
            <div className="projects-grid">
              {visibles.map(proyecto => (
                <ProjectCard key={proyecto.id} proyecto={proyecto} alAbrir={abrirDetalle} />
              ))}
            </div>
          )}
          <Pagination pagina={paginaActual} total={totalPages} cambiar={cambiarPagina} />
        </>
      )}
      <ProjectSidebar proyecto={proyectoSeleccionado} alCerrar={cerrarDetalle} />
    </section>
  );
}
