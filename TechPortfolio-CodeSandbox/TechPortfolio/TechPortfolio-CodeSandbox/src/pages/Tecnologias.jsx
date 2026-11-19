import { BookOpen, BriefcaseBusiness, Sparkles } from 'lucide-react';
import PageHeading from '../components/PageHeading.jsx';
import { perfil, tecnologias, herramientasIA, experiencias } from '../data/site.js';

export default function Tecnologias() {
  return (
    <section className="container section page">
      <PageHeading label="HABILIDADES / ESTUDIOS" title="Stack tecnológico y" emphasis="formación">
        Herramientas, estudios y trayectoria utilizados para construir soluciones digitales.
      </PageHeading>
      <section aria-labelledby="titulo-stack">
        <div className="section-row"><h2 id="titulo-stack">Tecnologías</h2><span className="count">{tecnologias.length} tecnologías</span></div>
        <div className="stack-grid">
          {tecnologias.map(tec => <article className="card stack-card" key={tec.nombre}>
            <div className="technology-icon"><img src={`${import.meta.env.BASE_URL}${tec.imagen}`} alt={`Logotipo de ${tec.nombre}`}/></div>
            <h3>{tec.nombre}</h3><p>{tec.descripcion}</p>
          </article>)}
        </div>
      </section>
      <div className="two-columns">
        <section><span className="eyebrow">FORMACIÓN</span><h2>Estudios</h2>
          <div className="info-line"><BookOpen size={24}/><div><strong>{perfil.carrera}</strong><p>{perfil.institucion}</p><small>Formación académica presentada como parte del portafolio.</small></div></div>
        </section>
        <section><span className="eyebrow">INTELIGENCIA ARTIFICIAL</span><h2>Herramientas de IA</h2>
          {herramientasIA.map(ia => <div className="info-line" key={ia.nombre}><Sparkles size={24}/><div><strong>{ia.nombre}</strong><p>{ia.descripcion}</p></div></div>)}
        </section>
      </div>
      <section aria-labelledby="experiencia-titulo">
        <div className="timeline-heading"><span className="eyebrow">TRAYECTORIA</span><h2 id="experiencia-titulo">Experiencias laborales</h2><p>Tres experiencias ficticias utilizadas para completar y comprobar el timeline.</p></div>
        <ol className="timeline">
          {experiencias.map(exp => <li className="experience" key={exp.id}>
            <span className="round-icon"><BriefcaseBusiness size={18}/></span>
            <div><small>{exp.periodo}</small><h3>{exp.cargo}</h3><p><strong>{exp.empresa}.</strong> {exp.descripcion}</p></div>
          </li>)}
        </ol>
      </section>
    </section>
  );
}
