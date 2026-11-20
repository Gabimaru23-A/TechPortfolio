import { useState } from 'react';
import { Filter, RotateCcw } from 'lucide-react';

export default function ProjectFilters({ categorias, alAplicar }) {
  const [categoria, setCategoria] = useState('Todas');
  const [tecnologia, setTecnologia] = useState('');

  function filtrar(event) {
    event.preventDefault();
    alAplicar({ cat: categoria, tech: tecnologia });
  }
  function limpiar() {
    setCategoria('Todas');
    setTecnologia('');
    alAplicar({ cat: 'Todas', tech: '' });
  }

  return (
    <form className="filters card" onSubmit={filtrar} aria-labelledby="titulo-filtros">
      <div className="filter-title"><strong id="titulo-filtros">Filtros del catálogo</strong></div>
      <div className="filter-controls">
        <label>Categoría
          <select value={categoria} onChange={event => setCategoria(event.target.value)}>
            {categorias.map(valor => <option key={valor} value={valor}>{valor}</option>)}
          </select>
        </label>
        <label>Tecnología
          <input value={tecnologia} onChange={event => setTecnologia(event.target.value)} placeholder="React, JavaScript o CSS" />
        </label>
        <button className="btn blue" type="submit"><Filter size={16} aria-hidden="true" /> Filtrar</button>
        <button className="btn light" type="button" onClick={limpiar}><RotateCcw size={16} aria-hidden="true" /> Limpiar filtros</button>
      </div>
    </form>
  );
}
