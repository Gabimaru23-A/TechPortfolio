import { ArrowRight, CalendarDays, Layers } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext.jsx';

// Cinco atributos de negocio: nombre, categoría, tecnología, estado y fecha.
export default function ProjectCard({ proyecto }) {
  const { abrir } = usePortfolio();
  return (
    <article className="card project-card">
      <div className="card-line"><span className="record-id">{proyecto.id}</span><span className="chip">{proyecto.estado}</span></div>
      <span className="tile-icon"><Layers size={24} aria-hidden="true"/></span>
      <h3>{proyecto.nombre}</h3>
      <p>{proyecto.categoria}</p>
      <div className="project-meta">
        <span>{proyecto.tecnologia}</span>
        <span><CalendarDays size={14} aria-hidden="true"/>{proyecto.fecha}</span>
      </div>
      <button className="link-button" type="button" onClick={event => abrir(proyecto, event.currentTarget)}>
        Ver detalle <ArrowRight size={17}/>
      </button>
    </article>
  );
}
