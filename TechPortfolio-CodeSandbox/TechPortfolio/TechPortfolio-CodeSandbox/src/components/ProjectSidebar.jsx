import { useEffect, useRef } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext.jsx';

// Dialog modal nativo: controla foco, tecla Escape y clic fuera del contenido.
export default function ProjectSidebar() {
  const { seleccionado, cerrar } = usePortfolio();
  const modal = useRef(null);
  const cerrarRef = useRef(null);

  useEffect(() => {
    const dialog = modal.current;
    if (!seleccionado || !dialog) return undefined;
    const overflowAnterior = document.body.style.overflow;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = 'hidden';
    cerrarRef.current?.focus();
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = overflowAnterior;
    };
  }, [seleccionado]);

  if (!seleccionado) return null;
  const proyecto = seleccionado;
  const imagen = `${import.meta.env.BASE_URL}${proyecto.imagen.replace(/^\//, '')}`;
  const filas = [
    ['Nombre', proyecto.nombre], ['Categoría', proyecto.categoria], ['Tecnología', proyecto.tecnologia],
    ['Estado', proyecto.estado], ['Fecha', proyecto.fecha], ['Descripción', proyecto.descripcion]
  ];

  return (
    <dialog ref={modal} className="project-sidebar" aria-labelledby="titulo-proyecto" onClose={cerrar} onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
      <div className="sidebar-content">
        <div className="sidebar-heading">
          <span className="eyebrow">DETALLE DEL PROYECTO</span>
          <button type="button" ref={cerrarRef} className="icon-button" aria-label="Cerrar detalle" onClick={() => modal.current?.close()}><X size={22}/></button>
        </div>
        <img className="drawer-image" src={imagen} alt={`Ilustración de ${proyecto.nombre}`}/>
        <h2 id="titulo-proyecto">{proyecto.nombre}</h2>
        <dl className="project-attributes">
          {filas.map(([clave, valor]) => <div key={clave}><dt>{clave}</dt><dd>{valor}</dd></div>)}
          <div><dt>Imagen</dt><dd>Ilustración del proyecto, visible en la parte superior.</dd></div>
          <div><dt>Enlace</dt><dd>{proyecto.enlace ? <a className="text-link" href={proyecto.enlace} rel="noreferrer" target="_blank">Abrir proyecto <ExternalLink size={15}/></a> : 'Ficha descriptiva sin repositorio independiente'}</dd></div>
        </dl>
      </div>
    </dialog>
  );
}
