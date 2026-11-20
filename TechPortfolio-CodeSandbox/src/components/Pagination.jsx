import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ pagina, total, cambiar }) {
  if (total < 2) return null;
  return (
    <nav className="pagination" aria-label="Paginación de proyectos">
      <button type="button" aria-label="Página anterior" disabled={pagina === 1} onClick={() => cambiar(pagina - 1)}>
        <ChevronLeft size={19} aria-hidden="true" />
      </button>
      {Array.from({ length: total }, (_, indice) => indice + 1).map(numero => (
        <button
          type="button"
          key={numero}
          className={pagina === numero ? 'current' : ''}
          aria-current={pagina === numero ? 'page' : undefined}
          aria-label={`Página ${numero}`}
          onClick={() => cambiar(numero)}
        >
          {numero}
        </button>
      ))}
      <button type="button" aria-label="Página siguiente" disabled={pagina === total} onClick={() => cambiar(pagina + 1)}>
        <ChevronRight size={19} aria-hidden="true" />
      </button>
    </nav>
  );
}
