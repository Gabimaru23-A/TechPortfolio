import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Github, Linkedin, Menu, X } from 'lucide-react';
import { perfil } from '../data/site.js';

const rutas = [
  { path: '/', nombre: 'Inicio' },
  { path: '/proyectos', nombre: 'Proyectos' },
  { path: '/tecnologias', nombre: 'Tecnologías' },
  { path: '/propuesta', nombre: 'Propuesta de valor' },
  { path: '/contacto', nombre: 'Contacto' }
];
const marca = `${import.meta.env.BASE_URL}favicon.svg`;

export function SocialLinks() {
  return (
    <div className="social">
      <a href={perfil.github} target="_blank" rel="noreferrer"><Github size={18} aria-hidden="true" /> GitHub</a>
      {perfil.linkedin ? (
        <a href={perfil.linkedin} target="_blank" rel="noreferrer"><Linkedin size={18} aria-hidden="true" /> LinkedIn</a>
      ) : (
        <span><Linkedin size={18} aria-hidden="true" /> LinkedIn sin configurar</span>
      )}
    </div>
  );
}

export default function Layout({ children }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { pathname } = useLocation();
  const rutaAnterior = useRef(pathname);
  const principal = useRef(null);
  const encabezado = useRef(null);
  const botonMenu = useRef(null);

  useEffect(() => {
    const ruta = rutas.find(({ path }) => path === pathname);
    document.title = `${ruta?.nombre ?? 'Inicio'} | TechPortfolio`;
    if (rutaAnterior.current === pathname) return;
    rutaAnterior.current = pathname;
    setMenuAbierto(false);
    principal.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (!menuAbierto) return;

    function cerrarConEscape(event) {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        setMenuAbierto(false);
        botonMenu.current?.focus();
      }
    }

    function cerrarAlPulsarFuera(event) {
      if (!encabezado.current?.contains(event.target)) setMenuAbierto(false);
    }

    const escritorio = window.matchMedia('(min-width: 801px)');
    const cerrarAlCambiarVista = () => setMenuAbierto(false);
    document.addEventListener('keydown', cerrarConEscape);
    document.addEventListener('pointerdown', cerrarAlPulsarFuera);
    escritorio.addEventListener('change', cerrarAlCambiarVista);
    return () => {
      document.removeEventListener('keydown', cerrarConEscape);
      document.removeEventListener('pointerdown', cerrarAlPulsarFuera);
      escritorio.removeEventListener('change', cerrarAlCambiarVista);
    };
  }, [menuAbierto]);

  function saltarAlContenido(event) {
    event.preventDefault();
    principal.current?.focus();
    principal.current?.scrollIntoView();
  }

  function cerrarMenuAlNavegar(event) {
    if (!menuAbierto || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    setMenuAbierto(false);
    principal.current?.focus({ preventScroll: true });
  }

  return (
    <>
      <a className="skip-link" href="#contenido-principal" onClick={saltarAlContenido}>Saltar al contenido</a>
      <header className="header" ref={encabezado}>
        <div className="container topbar">
          <Link className="brand" to="/" aria-label="TechPortfolio, ir al inicio" onClick={cerrarMenuAlNavegar}>
            <img src={marca} alt="" width="38" height="38" />
            <span>Tech<b>Portfolio</b></span>
          </Link>
          <button
            type="button"
            ref={botonMenu}
            className="menu-button icon-button"
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuAbierto}
            aria-controls="navegacion"
            onClick={() => setMenuAbierto(abierto => !abierto)}
          >
            {menuAbierto ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
          <nav id="navegacion" aria-label="Navegación principal" className={menuAbierto ? 'links expanded' : 'links'}>
            {rutas.map(({ path, nombre }) => (
              <NavLink key={path} to={path} end={path === '/'} onClick={cerrarMenuAlNavegar}>{nombre}</NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main id="contenido-principal" ref={principal} tabIndex={-1}>{children}</main>

      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <Link className="brand" to="/" aria-label="TechPortfolio, inicio desde el pie de página">
              <img src={marca} alt="" width="34" height="34" />
              <span>Tech<b>Portfolio</b></span>
            </Link>
            <p>Portafolio de soluciones TI</p>
          </div>
          <nav className="footer-links" aria-label="Navegación del pie de página">
            {rutas.slice(1).map(({ path, nombre }) => <Link key={path} to={path}>{nombre}</Link>)}
          </nav>
          <SocialLinks />
        </div>
        <p className="container footer-bottom">© {new Date().getFullYear()} TechPortfolio · Proyecto académico</p>
      </footer>
    </>
  );
}
