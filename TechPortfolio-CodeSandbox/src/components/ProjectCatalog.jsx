import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink, Layers, X } from 'lucide-react';

const ProjectContext = createContext(null);
const formatoFecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'UTC' });

export function ProjectDetailsProvider({ children }) {
  const [proyecto, setProyecto] = useState(null);
  const activador = useRef(null);

  function abrir(seleccionado, boton) {
    activador.current = boton;
    setProyecto(seleccionado);
  }

  function cerrar() {
    setProyecto(null);
    activador.current?.focus({ preventScroll: true });
    activador.current = null;
  }

  return (
    <ProjectContext.Provider value={{ proyecto, abrir, cerrar }}>
      {children}
      <ProjectSidebar />
    </ProjectContext.Provider>
  );
}

function ProjectDate({ date }) {
  return <time dateTime={date}>{formatoFecha.format(new Date(date))}</time>;
}

export function ProjectCard({ project }) {
  const { abrir } = useContext(ProjectContext);

  return (
    <article className="card project-card">
      <div className="project-card-top">
        <span className="tile-icon"><Layers size={21} aria-hidden="true" /></span>
        <span className="project-status">{project.estado}</span>
      </div>
      <h3>{project.nombre}</h3>
      <p>{project.categoria}</p>
      <div className="project-meta">
        <span>{project.tecnologia}</span>
        <span><CalendarDays size={16} aria-hidden="true" /><ProjectDate date={project.fecha} /></span>
      </div>
      <button
        type="button"
        className="button button-secondary project-detail"
        aria-label={`Ver detalle de ${project.nombre}`}
        onClick={evento => abrir(project, evento.currentTarget)}
      >
        Ver detalle
      </button>
    </article>
  );
}

function ProjectSidebar() {
  const { proyecto, cerrar } = useContext(ProjectContext);
  const dialogo = useRef(null);
  const botonCerrar = useRef(null);

  useEffect(() => {
    if (!proyecto) return;

    const panel = dialogo.current;
    const overflowAnterior = document.body.style.overflow;
    if (!panel.open) panel.showModal();
    panel.scrollTop = 0;
    botonCerrar.current.focus({ preventScroll: true });
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, [proyecto]);

  function cerrarDesdeFondo(evento) {
    if (evento.target === evento.currentTarget) dialogo.current.close();
  }

  return (
    <dialog
      ref={dialogo}
      className="project-sidebar"
      aria-labelledby="titulo-sidebar"
      onClose={evento => {
        if (!evento.currentTarget.open) cerrar();
      }}
      onClick={cerrarDesdeFondo}
    >
      {proyecto && (
        <div className="sidebar-content">
          <div className="sidebar-heading">
            <h2 id="titulo-sidebar">Detalle del proyecto</h2>
            <button ref={botonCerrar} type="button" className="icon-button" aria-label="Cerrar detalle" onClick={() => dialogo.current.close()}>
              <X size={22} aria-hidden="true" />
            </button>
          </div>
          <dl className="project-attributes">
            <div><dt>Nombre</dt><dd>{proyecto.nombre}</dd></div>
            <div><dt>Categoría</dt><dd>{proyecto.categoria}</dd></div>
            <div><dt>Tecnología</dt><dd>{proyecto.tecnologia}</dd></div>
            <div><dt>Estado</dt><dd>{proyecto.estado}</dd></div>
            <div><dt>Fecha</dt><dd><ProjectDate date={proyecto.fecha} /></dd></div>
            <div><dt>Descripción</dt><dd>{proyecto.descripcion}</dd></div>
            <div className="image-attribute">
              <dt>Imagen</dt>
              <dd><img src={projectImage(proyecto.imagen)} alt="Ilustración de la propuesta académica" width="800" height="480" /></dd>
            </div>
            <div>
              <dt>Enlace</dt>
              <dd>{proyecto.enlace ? (
                <a className="text-link" href={proyecto.enlace} target="_blank" rel="noreferrer">
                  Abrir proyecto <ExternalLink size={16} aria-hidden="true" />
                </a>
              ) : 'Sin enlace publicado'}</dd>
            </div>
          </dl>
        </div>
      )}
    </dialog>
  );
}

function projectImage(path) {
  return /^(https?:)?\/\//i.test(path) ? path : `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}

export function Pagination({ page, totalPages, onPageChange }) {
  return (
    <nav className="pagination" aria-label="Páginas de proyectos">
      <button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label="Página anterior">
        <ChevronLeft size={20} aria-hidden="true" />
      </button>
      {Array.from({ length: totalPages }, (_, index) => {
        const numero = index + 1;
        return (
          <button
            type="button"
            key={numero}
            aria-label={`Página ${numero}`}
            aria-current={page === numero ? 'page' : undefined}
            onClick={() => onPageChange(numero)}
          >
            {numero}
          </button>
        );
      })}
      <button type="button" onClick={() => onPageChange(page + 1)} disabled={page === totalPages} aria-label="Página siguiente">
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </nav>
  );
}
