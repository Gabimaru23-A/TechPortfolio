import { createContext, useContext, useMemo, useRef, useState } from 'react';

const PortfolioContext = createContext(null);

export function PortfolioProvider({ children }) {
  const [seleccionado, setSeleccionado] = useState(null);
  const activador = useRef(null);

  const value = useMemo(() => ({
    seleccionado,
    abrir(proyecto, boton) {
      activador.current = boton || null;
      setSeleccionado(proyecto);
    },
    cerrar() {
      setSeleccionado(null);
      requestAnimationFrame(() => activador.current?.focus({ preventScroll: true }));
    }
  }), [seleccionado]);

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) throw new Error('PortfolioProvider es obligatorio');
  return context;
}
