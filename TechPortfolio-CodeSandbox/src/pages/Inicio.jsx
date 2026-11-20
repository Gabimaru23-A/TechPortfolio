import { Link } from 'react-router-dom';
import { SocialLinks } from '../components/Layout.jsx';
import { usePortfolio } from '../context/PortfolioContext.jsx';
import { biografia, contactoOficial, perfil, tecnologias } from '../data/site.js';

const destacados = ['TP-001', 'TP-003', 'TP-006'];
const base = import.meta.env.BASE_URL;

export default function Inicio() {
  const { catalogo, cargando, error, reintentar } = usePortfolio();
  const proyectos = destacados
    .map(id => catalogo.find(proyecto => proyecto.id === id))
    .filter(Boolean);

  return (
    <>
      <section className="hero" aria-labelledby="titulo-inicio">
        <div className="container hero-layout">
          <div className="hero-copy">
            <p className="eyebrow">TechPortfolio</p>
            <h1 id="titulo-inicio">Interfaces para <em>resolver</em> tareas reales.</h1>
            <p className="hero-description">
              {contactoOficial.especialidad}. Desarrollo frontend con React, JavaScript y CSS
              para portafolios profesionales, catálogos digitales y herramientas de consulta.
            </p>
            <div className="actions">
              <Link className="btn primary" to="/proyectos">Ver proyectos</Link>
              <Link className="btn secondary" to="/contacto">Contactar</Link>
            </div>
          </div>
          <img
            className="hero-image"
            src={`${base}images/espacio-desarrollo.jpg`}
            alt="Computador portátil con un editor de código y gráficos de interfaz"
            width="1448"
            height="1086"
            fetchpriority="high"
          />
        </div>
      </section>

      <section className="container section" aria-labelledby="titulo-destacados">
        <div className="section-row">
          <div>
            <h2 id="titulo-destacados">Proyectos destacados</h2>
            <p>Un portafolio implementado y dos propuestas para organizar el trabajo.</p>
          </div>
          <Link className="text-link" to="/proyectos">Ver catálogo completo</Link>
        </div>
        {cargando && <p className="empty" role="status">Cargando proyectos destacados…</p>}
        {error && (
          <div className="empty catalog-status">
            <p role="alert">{error}</p>
            <button className="btn secondary" type="button" onClick={reintentar}>Volver a intentar</button>
          </div>
        )}
        <div className="projects-grid featured-grid">
          {proyectos.map(proyecto => (
            <article className="card featured-card" key={proyecto.id}>
              <img className="project-image" src={`${base}${proyecto.imagen}`} alt="" loading="lazy" />
              <div className="featured-content">
                <p className="project-type">{proyecto.conceptual ? 'Propuesta conceptual' : 'Aplicación del portafolio'}</p>
                <h3>{proyecto.nombre}</h3>
                <p className="featured-category">{proyecto.categoria} · {proyecto.tecnologia}</p>
                <Link className="text-link" to={`/proyectos?proyecto=${encodeURIComponent(proyecto.id)}`}
                  aria-label={`Ver detalle de ${proyecto.nombre}`}>Ver detalle</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="band" aria-labelledby="titulo-biografia">
        <div className="container section bio-section">
          <h2 id="titulo-biografia">Perfil y biografía</h2>
          <div className="bio-grid">
            <article className="card bio-profile">
              <img className="avatar-image" src={`${base}${perfil.avatar}`} alt="" width="66" height="66" loading="lazy" />
              <p className="eyebrow">Perfil ficticio</p>
              <h3>{perfil.nombre}</h3>
              <p>{perfil.rol}</p>
              <p>{perfil.biografia}</p>
              <SocialLinks />
            </article>
            <div className="biography-items">
              {biografia.map(({ titulo, texto }) => (
                <article className="biography-row" key={titulo}>
                  <h3>{titulo}</h3>
                  <p>{texto}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container section" aria-labelledby="titulo-competencias">
        <div className="section-row">
          <div>
            <h2 id="titulo-competencias">Competencias tecnológicas</h2>
            <p>Herramientas aplicadas en el desarrollo de TechPortfolio.</p>
          </div>
          <Link className="text-link" to="/tecnologias">Ver tecnologías y formación</Link>
        </div>
        <ul className="competency-list">
          {tecnologias.map(tecnologia => (
            <li className="card" key={tecnologia.nombre}>
              <img src={`${base}${tecnologia.imagen}`} width="32" height="32" alt="" loading="lazy" />
              {tecnologia.nombre}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
