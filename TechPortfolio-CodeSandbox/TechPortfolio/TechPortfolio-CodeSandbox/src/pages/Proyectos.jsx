import { useEffect, useMemo, useRef, useState } from 'react';
import PageHeading from '../components/PageHeading.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import ProjectFilters from '../components/ProjectFilters.jsx';
import ProjectSidebar from '../components/ProjectSidebar.jsx';
import Pagination from '../components/Pagination.jsx';
import { filtrarProyectos, paginar } from '../utils/logic.js';

export default function Proyectos() {
  const [catalogo, setCatalogo] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({cat: 'Todas', tech: ''});
  const [pagina, setPagina] = useState(1);
  const tituloResultados = useRef(null);

  useEffect(() => {
    const controlador = new AbortController();
    fetch(`${import.meta.env.BASE_URL}data/proyectos.json`, {signal: controlador.signal})
      .then(respuesta => {
        if (!respuesta.ok) throw new Error('No se pudo obtener el catálogo.');
        return respuesta.json();
      })
      .then(datos => {
        if (!Array.isArray(datos)) throw new Error('El catálogo no tiene un formato válido.');
        setCatalogo(datos);
      })
      .catch(err => { if (err.name !== 'AbortError') setError(err.message); })
      .finally(() => { if (!controlador.signal.aborted) setCargando(false); });
    return () => controlador.abort();
  }, []);

  const categorias = useMemo(() => ['Todas', ...new Set(catalogo.map(p => p.categoria))], [catalogo]);
  const resultados = useMemo(() => filtrarProyectos(catalogo, filtros), [catalogo, filtros]);
  const {totalPages, visibles, paginaActual} = paginar(resultados, pagina, 10);

  function aplicar(nuevos) { setFiltros(nuevos); setPagina(1); }
  function cambiar(numero) {
    setPagina(numero);
    // El foco permanece en la navegación sin provocar un salto imprevisto.
    tituloResultados.current?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  return (
    <section className="container section page">
      <PageHeading label="PORTAFOLIO / PROYECTOS" title="Proyectos y" emphasis="soluciones">
        Catálogo de soluciones TI con filtros combinables, paginación y detalles técnicos de cada proyecto.
      </PageHeading>
      <ProjectFilters categorias={categorias} alAplicar={aplicar}/>
      <div className="section-row" ref={tituloResultados}>
        <div><h2>Listado de proyectos</h2><p>Explora las propuestas tecnológicas organizadas por categoría.</p></div>
        <span className="count">{resultados.length} resultados</span>
      </div>
      {cargando && <p className="empty" role="status">Cargando catálogo...</p>}
      {error && <p className="empty" role="alert">{error}</p>}
      {!cargando && !error && resultados.length === 0 && <p className="empty" role="status">No se encontraron proyectos con esos filtros.</p>}
      {!cargando && !error && <div className="projects-grid">{visibles.map(proyecto => <ProjectCard key={proyecto.id} proyecto={proyecto}/>)}</div>}
      {!cargando && !error && <Pagination pagina={paginaActual} total={totalPages} cambiar={cambiar}/>}
      <ProjectSidebar />
    </section>
  );
}
