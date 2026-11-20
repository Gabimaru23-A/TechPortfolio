import { useEffect, useRef } from 'react';
import { ExternalLink, X } from 'lucide-react';

export default function ProjectSidebar({ proyecto, alCerrar }) {
  const modal = useRef(null);
  const abierto = Boolean(proyecto);

  useEffect(() => {
    if (!abierto) return undefined;
    const dialog = modal.current;
    const overflowAnterior = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflowAnterior;
    };
  }, [abierto]);

  if (!proyecto) return null;

  function cerrarConEscape(event) {
    event.preventDefault();
    alCerrar();
  }

  function cerrarDesdeElFondo(event) {
    if (event.target !== event.currentTarget) return;
    const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect();
    if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) {
      alCerrar();
    }
  }

  const imagen = `${import.meta.env.BASE_URL}${proyecto.imagen.replace(/^\//, '')}`;
  return (
    <dialog
      ref={modal}
      className="project-sidebar"
      aria-labelledby="titulo-proyecto"
      onCancel={cerrarConEscape}
      onClick={cerrarDesdeElFondo}
    >
      <div className="sidebar-content">
        <div className="sidebar-heading">
          <span className="project-type">{proyecto.conceptual ? 'Propuesta conceptual' : 'Proyecto del portafolio'}</span>
          <button type="button" className="icon-button sidebar-close" aria-label="Cerrar detalle" onClick={alCerrar}>
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <h2 id="titulo-proyecto">{proyecto.nombre}</h2>
        <img className="drawer-image" src={imagen} alt={`Ilustración de ${proyecto.nombre}`} />
        <dl className="project-attributes">
          <div><dt>Categoría</dt><dd>{proyecto.categoria}</dd></div>
          <div><dt>Tecnología</dt><dd>{proyecto.tecnologia}</dd></div>
          <div><dt>Estado</dt><dd>{proyecto.estado}</dd></div>
          <div><dt>Fecha</dt><dd><time dateTime={proyecto.fecha}>{proyecto.fecha}</time></dd></div>
          <div><dt>Descripción</dt><dd>{proyecto.descripcion}</dd></div>
          <div>
            <dt>Enlace</dt>
            <dd>
              {proyecto.enlace ? (
                <a className="text-link" href={proyecto.enlace} rel="noopener noreferrer" target="_blank">
                  Abrir enlace del proyecto <ExternalLink size={15} aria-hidden="true" />
                </a>
              ) : 'Enlace no disponible'}
            </dd>
          </div>
        </dl>
      </div>
    </dialog>
  );
}
