import { BookOpen, BriefcaseBusiness, Sparkles } from 'lucide-react';
import PageHeading from '../components/PageHeading.jsx';
import { experiencias, herramientasIA, perfil, tecnologias } from '../data/site.js';

export default function Tecnologias() {
  return (
    <section className="container section page technology-page">
      <PageHeading label="COMPETENCIAS" title="Stack tecnológico y" emphasis="formación">
        Cómo se construye TechPortfolio y qué competencias ilustra su perfil de demostración.
      </PageHeading>

      <section aria-labelledby="titulo-stack">
        <div className="section-row">
          <h2 id="titulo-stack">Tecnologías del portafolio</h2>
        </div>
        <div className="stack-grid">
          {tecnologias.map(({ nombre, imagen, descripcion }) => (
            <article className="card stack-card" key={nombre}>
              <div className="technology-icon">
                <img src={`${import.meta.env.BASE_URL}${imagen}`} alt="" width="48" height="48" />
              </div>
              <h3>{nombre}</h3>
              <p>{descripcion}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="two-columns">
        <section className="technology-study" aria-labelledby="titulo-estudios">
          <h2 id="titulo-estudios">Formación académica</h2>
          <p className="example-note">Formación ficticia del perfil de demostración.</p>
          <div className="info-line">
            <BookOpen size={24} aria-hidden="true" />
            <div>
              <h3>{perfil.carrera}</h3>
              <p>{perfil.institucion}</p>
            </div>
          </div>
        </section>
        <section className="technology-ai" aria-labelledby="titulo-ia">
          <h2 id="titulo-ia">Herramientas de IA</h2>
          {herramientasIA.map(({ nombre, descripcion }) => (
            <div className="info-line" key={nombre}>
              <Sparkles size={24} aria-hidden="true" />
              <div>
                <h3>{nombre}</h3>
                <p>{descripcion}</p>
              </div>
            </div>
          ))}
        </section>
      </div>

      <section aria-labelledby="experiencia-titulo">
        <div className="timeline-heading">
          <h2 id="experiencia-titulo">Experiencias laborales</h2>
          <p>Trayectoria ficticia del perfil de demostración.</p>
        </div>
        <ol className="timeline" role="list">
          {experiencias.map(({ id, cargo, empresa, periodo, descripcion }) => (
            <li className="experience" key={id}>
              <span className="round-icon" aria-hidden="true"><BriefcaseBusiness size={18} /></span>
              <div>
                <small>{periodo}</small>
                <h3>{cargo}</h3>
                <p><strong>{empresa}.</strong> {descripcion}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </section>
  );
}
