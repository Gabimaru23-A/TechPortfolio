import { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Github, Linkedin, Menu, X } from 'lucide-react';
import { perfil } from '../data/site.js';

const rutas = [
  { path: '/', nombre: 'Inicio' },
  { path: '/proyectos', nombre: 'Proyectos' },
  { path: '/tecnologias', nombre: 'Tecnologías' },
  { path: '/contacto', nombre: 'Contacto' },
  { path: '/propuesta', nombre: 'Propuesta de valor' }
];

export function SocialLinks() {
  return (
    <div className="social">
      <a href={perfil.github} target="_blank" rel="noreferrer"><Github size={17} /> GitHub</a>
      <a href={perfil.linkedin} target="_blank" rel="noreferrer" title="Página de LinkedIn; sustituir por perfil del autor"><Linkedin size={17} /> LinkedIn</a>
    </div>
  );
}

export default function Layout({ children }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const location = useLocation();
  const principal = useRef(null);

  useEffect(() => {
    setMenuAbierto(false);
    const ruta = rutas.find(r => r.path === location.pathname);
    document.title = `${ruta?.nombre || 'Inicio'} | TechPortfolio`;
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <a className="skip-link" href="#contenido-principal">Saltar al contenido</a>
      <header className="header">
        <div className="container topbar">
          <Link className="brand" to="/" aria-label="TechPortfolio, ir al inicio">
            <img className="brand-icon" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="44" height="44"/>
            <span>Tech<b>Portfolio</b><small>SOLUCIONES TI</small></span>
          </Link>
          <button type="button" className="menu-button" aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuAbierto} aria-controls="navegacion" onClick={() => setMenuAbierto(v => !v)}>
            {menuAbierto ? <X size={23}/> : <Menu size={23}/>}
          </button>
          <nav id="navegacion" aria-label="Navegación principal" className={menuAbierto ? 'links expanded' : 'links'}>
            {rutas.map(r => <NavLink key={r.path} to={r.path} end={r.path === '/'} className={({isActive}) => isActive ? 'active' : ''} onClick={() => setMenuAbierto(false)}>{r.nombre}</NavLink>)}
          </nav>
        </div>
      </header>
      <main id="contenido-principal" ref={principal}>{children}</main>
      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand"><img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="36" height="36"/><div><h3>TechPortfolio</h3><p>Soluciones TI · React, JavaScript y diseño centrado en las personas.</p></div></div>
          <SocialLinks />
        </div>
        <div className="container footer-bottom">© {new Date().getFullYear()} TechPortfolio · Proyecto académico individual · Algunos contenidos son ficticios y se identifican como tales.</div>
      </footer>
    </>
  );
}
