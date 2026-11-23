import { CalendarDays } from 'lucide-react';

export default function ProjectCard({ proyecto, alAbrir }) {
  const imagen = `${import.meta.env.BASE_URL}${proyecto.imagen.replace(/^\//, '')}`;
  return (
    <article className="card project-card">
      <img className="project-image" src={imagen} alt="" width="800" height="480" loading="lazy" decoding="async" />
      <div className="card-line">
        <span className="project-type">{proyecto.conceptual ? 'Propuesta conceptual' : 'Proyecto del portafolio'}</span>
        <span className="chip" data-estado={proyecto.estado}>{proyecto.estado}</span>
      </div>
      <h3>{proyecto.nombre}</h3>
      <p className="project-category">{proyecto.categoria}</p>
      <p className="project-description">{proyecto.descripcion}</p>
      <div className="project-meta">
        <span>{proyecto.tecnologia}</span>
        <span><CalendarDays size={16} aria-hidden="true" /><time dateTime={proyecto.fecha}>{proyecto.fecha}</time></span>
      </div>
      <button
        className="link-button project-action"
        type="button"
        id={`detalle-${proyecto.id}`}
        aria-label={`Ver detalle de ${proyecto.nombre}`}
        aria-haspopup="dialog"
        onClick={() => alAbrir(proyecto)}
      >
        Ver detalle
      </button>
    </article>
  );
}
