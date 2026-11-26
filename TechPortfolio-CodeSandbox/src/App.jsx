import { Route, Routes, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from './components/Layout.jsx';
import { PortfolioProvider } from './context/PortfolioContext.jsx';
import Inicio from './pages/Inicio.jsx';
import Proyectos from './pages/Proyectos.jsx';
import Tecnologias from './pages/Tecnologias.jsx';
import Contacto from './pages/Contacto.jsx';
import Propuesta from './pages/Propuesta.jsx';
import { procesarRetornoCorreo } from './utils/supabase.js';

export default function App({ retornoInicial }) {
  const [retorno, setRetorno] = useState(retornoInicial);
  const navegar = useNavigate();

  useEffect(() => {
    function recibirEnlace() {
      const confirmacion = procesarRetornoCorreo();
      if (!confirmacion) return;
      setRetorno(confirmacion);
      navegar('/contacto', { replace: true });
    }

    window.addEventListener('hashchange', recibirEnlace);
    return () => window.removeEventListener('hashchange', recibirEnlace);
  }, [navegar]);

  return (
    <PortfolioProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Inicio/>}/>
          <Route path="/proyectos" element={<Proyectos/>}/>
          <Route path="/tecnologias" element={<Tecnologias/>}/>
          <Route path="/contacto" element={<Contacto retorno={retorno} alCompletarRetorno={setRetorno} />}/>
          <Route path="/propuesta" element={<Propuesta/>}/>
          <Route path="*" element={<Inicio/>}/>
        </Routes>
      </Layout>
    </PortfolioProvider>
  );
}
