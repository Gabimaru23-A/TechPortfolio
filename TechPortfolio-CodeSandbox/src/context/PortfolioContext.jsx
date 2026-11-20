import { createContext, useContext, useEffect, useState } from 'react';

const PortfolioContext = createContext(null);

export function PortfolioProvider({ children }) {
  const [catalogo, setCatalogo] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controlador = new AbortController();

    async function cargarCatalogo() {
      try {
        const respuesta = await fetch(`${import.meta.env.BASE_URL}data/proyectos.json`, {
          signal: controlador.signal
        });
        if (!respuesta.ok) throw new Error('No se pudo obtener el catálogo.');
        const datos = await respuesta.json();
        if (!Array.isArray(datos)) throw new Error('El catálogo no tiene un formato válido.');
        if (!controlador.signal.aborted) setCatalogo(datos);
      } catch {
        if (!controlador.signal.aborted) {
          setError('No pudimos cargar el catálogo. Vuelve a intentarlo.');
        }
      } finally {
        if (!controlador.signal.aborted) setCargando(false);
      }
    }

    cargarCatalogo();
    return () => controlador.abort();
  }, [intento]);

  function reintentar() {
    setCargando(true);
    setError('');
    setIntento(valor => valor + 1);
  }

  return (
    <PortfolioContext.Provider value={{ catalogo, cargando, error, reintentar }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const contexto = useContext(PortfolioContext);
  if (!contexto) throw new Error('PortfolioProvider es obligatorio');
  return contexto;
}
