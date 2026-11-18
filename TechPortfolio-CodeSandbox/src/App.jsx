import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Contacto from './pages/Contacto.jsx';
import Inicio from './pages/Inicio.jsx';
import Propuesta from './pages/Propuesta.jsx';
import Proyectos from './pages/Proyectos.jsx';
import Tecnologias from './pages/Tecnologias.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/proyectos" element={<Proyectos />} />
        <Route path="/tecnologias" element={<Tecnologias />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/propuesta" element={<Propuesta />} />
        <Route path="*" element={<Inicio />} />
      </Routes>
    </Layout>
  );
}
