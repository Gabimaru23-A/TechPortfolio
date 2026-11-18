import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { CodeXml, Github, Linkedin, Menu, X } from 'lucide-react';
import { perfil } from '../perfil.js';

const rutas = [
  ['/', 'Inicio'],
  ['/proyectos', 'Proyectos'],
  ['/tecnologias', 'Tecnologías y estudios'],
  ['/contacto', 'Contacto'],
  ['/propuesta', 'Propuesta de valor'],
];

export function SocialLinks() {
  return (
    <div className="social-links">
      <a href={perfil.github} target="_blank" rel="noreferrer"><Github size={18} aria-hidden="true" /> GitHub</a>
      {perfil.linkedin && (
        <a href={perfil.linkedin} target="_blank" rel="noreferrer"><Linkedin size={18} aria-hidden="true" /> LinkedIn</a>
      )}
    </div>
  );
}

export default function Layout({ children }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { pathname } = useLocation();
  const rutaAnterior = useRef(pathname);
  const contenido = useRef(null);
  const menu = useRef(null);

  useEffect(() => {
    const vista = rutas.find(([ruta]) => ruta === pathname)?.[1] ?? 'Inicio';
    document.title = `${vista} | TechPortfolio`;

    if (pathname !== rutaAnterior.current) {
      rutaAnterior.current = pathname;
      setMenuAbierto(false);
      contenido.current.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  function enfocarContenido() {
    contenido.current.focus({ preventScroll: true });
    contenido.current.scrollIntoView();
  }

  function cerrarMenuConEscape(evento) {
    if (menuAbierto && evento.key === 'Escape') {
      setMenuAbierto(false);
      menu.current.focus();
    }
  }

  function cerrarMenuAlNavegar(ruta) {
    if (menuAbierto && pathname === ruta) menu.current.focus();
    setMenuAbierto(false);
  }

  return (
    <>
      <button type="button" className="skip-link" onClick={enfocarContenido}>Saltar al contenido</button>
      <header className="site-header" onKeyDown={cerrarMenuConEscape}>
        <div className="container topbar">
          <Link className="brand" to="/" onClick={() => cerrarMenuAlNavegar('/')}>
            <span className="brand-icon"><CodeXml size={22} aria-hidden="true" /></span>
            <span>Tech<span className="brand-accent">Portfolio</span></span>
          </Link>
          <button
            ref={menu}
            type="button"
            className="icon-button menu-button"
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuAbierto}
            aria-controls="navegacion-principal"
            onClick={() => setMenuAbierto(abierto => !abierto)}
          >
            {menuAbierto ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
          <nav id="navegacion-principal" className={menuAbierto ? 'site-nav is-open' : 'site-nav'} aria-label="Navegación principal">
            {rutas.map(([ruta, nombre]) => (
              <NavLink key={ruta} to={ruta} end={ruta === '/'} onClick={() => cerrarMenuAlNavegar(ruta)}>
                {nombre}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="contenido" ref={contenido} tabIndex={-1}>{children}</main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <strong>TechPortfolio</strong>
            <p>Portafolio académico de {perfil.nombre}</p>
          </div>
          <SocialLinks />
        </div>
      </footer>
    </>
  );
}
